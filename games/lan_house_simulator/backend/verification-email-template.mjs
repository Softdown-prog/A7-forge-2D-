const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function brandedVerificationLink(firebaseLink,siteUrl){
 const action=new URL(firebaseLink),code=action.searchParams.get('oobCode');
 if(action.searchParams.get('mode')!=='verifyEmail'||!code||!/^[A-Za-z0-9_-]{16,1024}$/.test(code))throw Error('Link de confirmação inválido.');
 const link=new URL('/conta/confirmar/',siteUrl);
 // Fragments are not sent to Pages, HTTP logs or Referer headers.
 link.hash=new URLSearchParams({codigo:code}).toString();
 return link.href;
}

export function verificationEmailTemplate(link,siteUrl){
 const safeLink=escape(link),home=escape(new URL('/',siteUrl).href);
 const subject='Só falta confirmar seu email · LHS';
 const text=`Boas-vindas ao Lan House Simulator!\n\nSua conta está quase pronta. Confirme seu email para acessar o painel e guardar seus saves na nuvem.\n\nConfirmar meu email:\n${link}\n\nO link é pessoal. Se você não criou esta conta, ignore esta mensagem.\n\nPrecisa de ajuda? Responda a este email.\nEquipe LHS · Seu bairro. Seu negócio. Sua história.`;
 const html=`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Confirme seu email · LHS</title>
<style>@media only screen and (max-width:600px){.outer{padding:20px 12px!important}.content{padding:32px 24px!important}.headline{font-size:30px!important}.cta{display:block!important;text-align:center!important}.masthead{padding:28px 24px!important}}</style></head>
<body style="margin:0;padding:0;background:#eef0e8;font-family:Arial,Helvetica,sans-serif;color:#203a30;-webkit-text-size-adjust:100%">
<div style="display:none;font-size:1px;color:#eef0e8;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">Sua conta está quase pronta. Confirme seu email e entre no salão.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0e8"><tr><td class="outer" align="center" style="padding:40px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#fffdf6;border:1px solid #d3dbcd;border-radius:16px;overflow:hidden">
<tr><td class="masthead" style="padding:32px 40px;background:#192e2a;border-bottom:4px solid #c7df82">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#c7df82;padding:12px 13px;border-radius:8px;font-family:Courier New,monospace;font-size:24px;font-weight:bold;color:#192e2a;letter-spacing:-1px">LHS</td><td style="padding-left:16px;color:#fffdf6;font-size:13px;font-weight:bold;letter-spacing:1.5px;line-height:1.6">LAN HOUSE<br><span style="color:#c7df82">SIMULATOR</span></td></tr></table>
</td></tr>
<tr><td class="content" style="padding:40px">
<p style="margin:0 0 20px;font-size:11px;font-weight:bold;letter-spacing:2px;color:#5c715a">SUA CONTA · ÚLTIMO PASSO</p>
<h1 class="headline" style="margin:0 0 20px;font-size:36px;line-height:1.12;letter-spacing:-1px;color:#192e2a">Seu lugar no salão<br>está quase pronto.</h1>
<p style="margin:0 0 14px;font-size:16px;line-height:1.7">Boas-vindas ao <strong>Lan House Simulator</strong>!</p>
<p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:#53645a">Confirme seu email para acessar sua conta e guardar seus saves na nuvem.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%"><tr><td align="left" style="padding:0 0 28px"><a class="cta" href="${safeLink}" style="display:inline-block;background:#c7df82;border:1px solid #b0cb66;border-radius:8px;padding:18px 28px;font-size:16px;font-weight:bold;line-height:1.25;text-decoration:none;color:#192e2a;mso-padding-alt:0;text-underline-color:#c7df82"><!--[if mso]><i style="letter-spacing:24px;mso-font-width:-100%;mso-text-raise:27pt">&nbsp;</i><![endif]--><span style="mso-text-raise:13pt">Confirmar meu email</span><!--[if mso]><i style="letter-spacing:24px;mso-font-width:-100%">&nbsp;</i><![endif]--></a></td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f3e8;border-radius:8px"><tr><td style="padding:18px 20px;font-size:13px;line-height:1.65;color:#53645a"><strong style="color:#203a30">Um link só seu.</strong><br>Se você não criou esta conta, pode ignorar esta mensagem. Nenhuma ação é necessária.</td></tr></table>
<p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#68796c">O botão não abriu? <a href="${safeLink}" style="color:#284e37;text-decoration:underline">Use este link para confirmar</a>.<br>Se o link expirou, peça um novo em Minha conta.</p>
</td></tr>
<tr><td style="padding:24px 40px;border-top:1px solid #e1e6d8;font-size:12px;line-height:1.8;color:#68796c">Precisa de ajuda? Responda a este email.<br><strong style="color:#203a30">Equipe LHS</strong> · Um jogo Softdown<br><a href="${home}" style="color:#53645a;text-decoration:none">lhs.analysepro.com</a></td></tr>
</table>
<p style="margin:22px 0 0;font-size:11px;letter-spacing:.5px;color:#73806f">SEU BAIRRO. SEU NEGÓCIO. SUA HISTÓRIA.</p>
</td></tr></table></body></html>`;
 return {subject,text,html};
}
