export function accountPage(){return `
<section class="page-intro wrap account-heading"><p class="eyebrow">SEU TERMINAL · SUA CONTA</p><h1>Seu salão vai<br/>com você.</h1><p>Entre para guardar uma cópia da sua partida na nuvem. Jogar continua gratuito e não exige uma conta.</p></section>
<section class="account-layout wrap" id="account-app" aria-label="Conta do jogador">
 <aside class="account-aside"><span class="account-terminal" aria-hidden="true">LHS<span>● ONLINE / CONTA OPCIONAL</span></span><h2>Uma conta.<br/>Seu próximo capítulo.</h2><ul><li>Um save principal e um backup na nuvem</li><li>Envio manual, sempre sob seu controle</li><li>Seus Cookies vinculados à sua identidade</li></ul><a class="text-link" href="/jogar/">Continuar sem conta →</a><p class="small">Cookies são a moeda premium opcional. Pagamentos ainda não estão disponíveis.</p></aside>
 <div class="account-card">
  <p id="account-status" class="account-status" role="status" aria-live="polite">Preparando o terminal…</p>
  <div id="auth-view">
   <div class="account-tabs" role="group" aria-label="Acesso à conta"><button type="button" data-auth-mode="login" aria-pressed="true">Entrar</button><button type="button" data-auth-mode="signup" aria-pressed="false">Criar conta</button></div>
   <h2 id="auth-title">Bom ter você de volta.</h2><p id="auth-copy">Acesse sua conta com email e senha.</p>
   <form id="auth-form"><fieldset id="auth-fields" disabled>
    <label for="account-email">Email</label><input id="account-email" name="email" type="email" autocomplete="email" maxlength="254" required placeholder="voce@exemplo.com"/>
    <div id="password-field"><label for="account-password">Senha</label><div class="password-row"><input id="account-password" name="password" type="password" autocomplete="current-password" minlength="6" maxlength="128" required/><button type="button" id="show-password" aria-label="Mostrar senha" aria-pressed="false">Mostrar</button></div><p id="password-hint" class="small" hidden>Use pelo menos 8 caracteres. Não reutilize uma senha de outro serviço.</p></div>
    <label id="signup-notice" class="account-consent" hidden><input type="checkbox" id="account-terms"/> Li os <a href="/termos/" target="_blank" rel="noopener">termos de uso</a> e a <a href="/privacidade/" target="_blank" rel="noopener">política de privacidade</a> para a conta opcional.</label>
    <button class="button account-submit" id="auth-submit" type="submit">Entrar na conta</button>
    <button class="account-link" id="forgot-password" type="button">Esqueci minha senha</button>
   </fieldset></form>
   <p class="small account-session-note">Sua sessão fica apenas na memória desta página. Ao fechar ou recarregar, entre novamente. A senha não é guardada pelo site.</p>
  </div>
  <div id="verify-view" hidden><p class="eyebrow">CONFIRME SEU EMAIL</p><h2>Falta só uma conexão.</h2><p>Abra o email de confirmação que enviamos. Confira também a caixa de spam. Seus saves só ficam disponíveis depois da confirmação.</p><div class="actions"><button class="button" type="button" id="check-email">Já confirmei meu email</button><button class="button secondary" type="button" id="resend-email">Reenviar email</button><button class="account-link" type="button" data-signout>Usar outra conta</button></div></div>
  <div id="dashboard-view" hidden>
   <div class="account-welcome"><div><p class="eyebrow">CONTA CONECTADA</p><h2>Seu terminal pessoal.</h2><p id="player-email" class="account-email"></p></div><button class="account-link" type="button" data-signout>Sair da conta</button></div>
   <div class="account-metrics"><article><span>Cookies da conta</span><strong id="cookies-balance">—</strong><small>Moeda premium opcional · compras indisponíveis</small></article><article><span>Save principal</span><strong id="save-state">Consultando…</strong><small id="save-date">Nenhum envio automático</small></article></div>
   <section class="account-saves" aria-labelledby="saves-title"><h3 id="saves-title">Sua partida na nuvem</h3><p>Para enviar seu progresso, exporte o JSON pelo menu do jogo e selecione esse arquivo aqui. Para continuar uma cópia da nuvem, baixe e importe o arquivo pelo menu do jogo.</p>
    <div class="actions"><button class="button secondary" id="download-main" type="button" disabled>Baixar save principal</button><button class="button secondary" id="download-backup" type="button">Recuperar backup</button></div>
    <form id="upload-form"><label for="save-file">Arquivo de save do LHS (JSON, até 2 MB)</label><input id="save-file" type="file" accept=".json,application/json" required/><button type="submit" class="button" id="upload-save">Enviar save à nuvem</button></form>
    <button class="account-link" id="refresh-account" type="button">Atualizar conta e conferir save</button>
   </section><a class="button account-submit" href="/jogar/">Voltar ao jogo →</a><p class="small">O envio preserva seu arquivo e o save local. O principal anterior vira o backup. Se outro dispositivo salvar primeiro, o envio é bloqueado para proteger a versão mais recente.</p>
  </div><noscript><p>Ative JavaScript para acessar a conta. Você pode continuar jogando sem login em um navegador com JavaScript habilitado.</p></noscript>
 </div>
</section><script type="module" src="/assets/account.mjs"></script>`;}
