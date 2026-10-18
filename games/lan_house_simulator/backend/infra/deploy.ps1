param(
 [string]$Project='loyal-road-395203',
 [string]$Region='us-central1',
 [string]$Database='lhs-game',
 [string]$Bucket='loyal-road-395203-lhs-saves',
 [string[]]$AllowedOrigins=@()
)
$ErrorActionPreference='Stop'
function Cloud { & gcloud @args; if($LASTEXITCODE -ne 0){throw "gcloud falhou: $($args[0]) $($args[1])"} }
$billing=Cloud billing projects describe $Project --format='value(billingEnabled)'
if("$billing" -ne 'True' -and "$billing" -ne 'true'){throw 'Faturamento desativado. Regularize no Google Cloud antes de implantar.'}
foreach($origin in $AllowedOrigins){$uri=[uri]$origin;if($uri.Scheme -ne 'https' -or $uri.AbsolutePath -ne '/' -or $uri.Query -or $uri.Fragment -or $uri.UserInfo){throw 'AllowedOrigins deve conter apenas origens HTTPS sem caminho.'}}
Cloud services enable run.googleapis.com firestore.googleapis.com storage.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com identitytoolkit.googleapis.com firebaserules.googleapis.com --project=$Project --quiet
$sa="lhs-backend@$Project.iam.gserviceaccount.com"
$accounts=Cloud iam service-accounts list --project=$Project --format='value(email)'
if($sa -notin $accounts){Cloud iam service-accounts create lhs-backend --project=$Project --display-name='LHS backend only' --quiet}
$databases=Cloud firestore databases list --project=$Project --format='value(name)'
if("projects/$Project/databases/$Database" -notin $databases){Cloud firestore databases create --project=$Project --database=$Database --location=$Region --type=firestore-native --delete-protection --quiet}
$location=Cloud firestore databases describe --project=$Project --database=$Database --format='value(locationId)'
if("$location" -ne $Region){throw 'Banco existente está em outra região.'}
$buckets=Cloud storage buckets list --project=$Project --format='value(name)'
if($Bucket -notin $buckets -and "gs://$Bucket" -notin $buckets){Cloud storage buckets create "gs://$Bucket" --project=$Project --location=$Region --uniform-bucket-level-access --public-access-prevention --soft-delete-duration=0}
Cloud storage buckets update "gs://$Bucket" --uniform-bucket-level-access --public-access-prevention --soft-delete-duration=0
Cloud storage buckets add-iam-policy-binding "gs://$Bucket" --member="serviceAccount:$sa" --role=roles/storage.objectUser
$conditionFile=Join-Path $PSScriptRoot 'condition.generated.yaml'
$envFile=Join-Path $PSScriptRoot 'env.generated.yaml'
try {
 @("title: lhs-database-only",('expression: '+(('resource.name == "projects/'+$Project+'/databases/'+$Database+'"') | ConvertTo-Json -Compress))) | Set-Content $conditionFile -Encoding utf8
 Cloud projects add-iam-policy-binding $Project --member="serviceAccount:$sa" --role=roles/datastore.user --condition-from-file=$conditionFile --quiet --format='value(version)'
 Cloud projects add-iam-policy-binding $Project --member="serviceAccount:$sa" --role=roles/firebaseauth.viewer --condition=None --quiet --format='value(version)'
 Cloud firestore fields ttls update expiresAt --project=$Project --database=$Database --collection-group=rateLimits --enable-ttl --async --quiet
 # Deny direct client access. Server SDKs use the scoped IAM service account.
 $access=Cloud auth print-access-token
 $headers=@{Authorization="Bearer $access";'x-goog-user-project'=$Project}
 $rule=Get-Content (Join-Path $PSScriptRoot 'firestore.rules') -Raw
 $ruleSet=Invoke-RestMethod -Method Post -Uri "https://firebaserules.googleapis.com/v1/projects/$Project/rulesets" -Headers $headers -ContentType 'application/json' -Body (@{source=@{files=@(@{name='firestore.rules';content=$rule})}} | ConvertTo-Json -Depth 6)
 $release=@{name="projects/$Project/releases/cloud.firestore/$Database";rulesetName=$ruleSet.name}
 $existing=Invoke-WebRequest -Uri "https://firebaserules.googleapis.com/v1/$($release.name)" -Headers $headers -SkipHttpErrorCheck
 if($existing.StatusCode -eq 404){Invoke-RestMethod -Method Post -Uri "https://firebaserules.googleapis.com/v1/projects/$Project/releases" -Headers $headers -ContentType 'application/json' -Body ($release | ConvertTo-Json) | Out-Null}
 elseif($existing.StatusCode -eq 200){Invoke-RestMethod -Method Patch -Uri "https://firebaserules.googleapis.com/v1/$($release.name)" -Headers $headers -ContentType 'application/json' -Body (@{release=$release;updateMask='rulesetName'} | ConvertTo-Json) | Out-Null}
 else{throw "Não foi possível verificar as regras: HTTP $($existing.StatusCode)"}
 @("GOOGLE_CLOUD_PROJECT: $Project","FIRESTORE_DATABASE_ID: $Database","SAVES_BUCKET: $Bucket",('ALLOWED_ORIGINS: '+(($AllowedOrigins -join ',') | ConvertTo-Json -Compress)),"PAYMENTS_ENABLED: 'false'","PAYMENTS_MODE: sandbox") | Set-Content $envFile -Encoding utf8
 $source=Resolve-Path (Join-Path $PSScriptRoot '../..')
 $services=Cloud run services list --project=$Project --region=$Region --format='value(metadata.name)'
 # Never replace payment variables or secret references on an existing service.
 if('lhs-backend' -in @($services)){
  $updates="^|^GOOGLE_CLOUD_PROJECT=$Project|FIRESTORE_DATABASE_ID=$Database|SAVES_BUCKET=$Bucket"
  if($AllowedOrigins.Count){$updates+='|ALLOWED_ORIGINS='+($AllowedOrigins -join ',')}
  Cloud run deploy lhs-backend --project=$Project --region=$Region --source=$source --service-account=$sa --cpu=1 --memory=512Mi --min=0 --min-instances=0 --max=3 --max-instances=3 --concurrency=20 --timeout=30 --cpu-throttling --no-cpu-boost --allow-unauthenticated --update-env-vars=$updates --quiet
 }else{
  Cloud run deploy lhs-backend --project=$Project --region=$Region --source=$source --service-account=$sa --cpu=1 --memory=512Mi --min=0 --min-instances=0 --max=3 --max-instances=3 --concurrency=20 --timeout=30 --cpu-throttling --no-cpu-boost --allow-unauthenticated --env-vars-file=$envFile --quiet
 }
 Cloud run services describe lhs-backend --project=$Project --region=$Region --format='yaml(status.url,status.conditions,spec.template.spec.containers.resources,spec.template.metadata.annotations)'
} finally {
 foreach($path in @($conditionFile,$envFile)){if(Test-Path -LiteralPath $path){Remove-Item -LiteralPath $path}}
}
