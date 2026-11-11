/** Owns the fallback account dialog structure, without adding a second dialog during Angular migration. */
export function ensureAccountDialog():HTMLDialogElement{
 // During the Angular cutover rehearsal, the Angular island supplies the
 // dialog markup. Keep the native fallback until production migrates, and
 // never mount two dialogs or attach duplicate account action listeners.
 const angularDialog=document.querySelector<HTMLDialogElement>(
  "#angular-player-account > #player-account");
 const dialog=angularDialog??document.createElement("dialog");
 if(!angularDialog){
 dialog.id="player-account";dialog.className="account-dialog";
 dialog.setAttribute("aria-labelledby","account-heading");
 // Os controles são exclusivos deste diálogo; nenhuma informação do servidor
 // é inserida usando innerHTML.
 dialog.innerHTML=`
  <header class="account-header">
   <div><span class="account-eyebrow">SEU PERFIL · SOFTDOWN</span>
    <h2 id="account-heading">Minha Conta</h2>
    <p>Cookies, itens adquiridos e histórico de movimentações.</p>
   </div><button id="account-close" class="slice" type="button" aria-label="Fechar Minha Conta">Fechar ✕</button>
  </header>
  <nav class="account-tabs" aria-label="Seções de Minha Conta">
   <button type="button" data-account-tab="summary">Resumo</button>
   <button type="button" data-account-tab="catalog">Loja Cookies</button>
   <button type="button" data-account-tab="inventory">Meus itens</button>
   <button type="button" data-account-tab="history">Histórico</button>
   <button type="button" data-account-tab="cloud">Nuvem</button>
  </nav>
  <div id="account-alert" class="account-alert" role="status" aria-live="polite"></div>
  <section data-account-page="summary" aria-label="Resumo da conta">
   <div class="account-stats">
    <div><small>Saldo disponível</small><strong id="account-balance">—</strong></div>
    <div><small>Cookies gastos em itens</small><strong id="account-spent">—</strong></div>
    <div><small>Itens adquiridos</small><strong id="account-owned">—</strong></div>
   </div>
   <p id="account-connection" class="account-subtext"></p>
   <div class="account-actions"><button id="account-refresh" class="slice" type="button">Atualizar saldo e itens</button></div>
   <details id="account-login-box" class="account-auth" open>
    <summary>Entrar ou criar conta</summary>
    <p>Conta opcional. Seu jogo local funciona sem cadastro.</p>
    <label>E-mail<input id="account-email" type="email" autocomplete="email" placeholder="seu@email.com"/></label>
    <label>Senha<input id="account-password" type="password" autocomplete="current-password" placeholder="Sua senha"/></label>
    <div class="account-actions">
     <button id="account-signin" type="button">Entrar</button>
     <button id="account-signup" type="button">Criar conta</button>
     <button id="account-recovery" type="button">Recuperar senha</button>
    </div>
   </details>
   <div class="account-actions"><button id="account-logout" type="button">Sair da conta</button></div>
   <div id="account-donate"></div>
   <p class="account-footnote">Cookies são separados dos R$ fictícios da lan house.
   Não podem ser sacados. Os itens são opcionais e não dão vantagem econômica.</p>
  </section>
  <section data-account-page="catalog" aria-label="Loja de Cookies" hidden>
   <p class="account-subtext">Conheça os cosméticos e os preços. Resgates só ficam
    disponíveis com conta verificada, saldo suficiente e catálogo habilitado no servidor.</p>
   <div id="account-catalog" class="account-items"></div>
  </section>
  <section data-account-page="inventory" aria-label="Itens adquiridos" hidden>
   <p class="account-subtext">Equipe ou desequipe os itens que já pertencem à sua conta.</p>
   <div id="account-inventory" class="account-items"></div>
  </section>
  <section data-account-page="history" aria-label="Histórico de Cookies" hidden>
   <p class="account-subtext">Movimentações confirmadas pelo servidor, não pelo arquivo de save.</p>
   <div id="account-transactions" class="account-ledger"></div>
  </section>
  <section data-account-page="cloud" aria-label="Progresso na nuvem" hidden>
   <p class="account-subtext">Salve ou restaure sua partida na conta. Seu save local nunca é apagado automaticamente.</p>
   <div class="account-actions">
    <button id="account-cloud-check" type="button">Consultar nuvem</button>
    <button id="account-cloud-save" type="button">Salvar na nuvem</button>
    <button id="account-cloud-load" type="button">Restaurar partida</button>
    <button id="account-cloud-backup" type="button">Restaurar backup</button>
   </div>
   <p id="account-cloud-state" class="account-subtext"></p>
  </section>
 `;
 document.body.append(dialog);
 }
 return dialog;
}
