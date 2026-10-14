param(
 [string]$Project='loyal-road-395203',
 [string]$Region='us-central1',
 [string]$Database='lhs-game',
 [string]$Bucket='loyal-road-395203-lhs-saves'
)
$ErrorActionPreference='Stop'
function Cloud { & gcloud @args; if($LASTEXITCODE -ne 0){throw "gcloud falhou: $($args[0]) $($args[1])"} }
$image=Cloud run services describe lhs-backend --project=$Project --region=$Region --format='value(spec.template.spec.containers[0].image)'
if(!$image -or "$image" -notmatch '@sha256:[a-f0-9]{64}$'){throw 'A API deve estar implantada com uma imagem identificada por digest.'}
# Same API-only image and existing scoped IAM; no new project-wide permissions.
# No schedule and no deletion by default. Execution overrides enable --apply.
Cloud run jobs deploy lhs-save-reconciliation --project=$Project --region=$Region --image=$image --command=node --args=reconcile-saves.mjs --service-account="lhs-backend@$Project.iam.gserviceaccount.com" --cpu=1 --memory=512Mi --tasks=1 --parallelism=1 --max-retries=0 --task-timeout=300s --set-env-vars="GOOGLE_CLOUD_PROJECT=$Project,FIRESTORE_DATABASE_ID=$Database,SAVES_BUCKET=$Bucket" --quiet
