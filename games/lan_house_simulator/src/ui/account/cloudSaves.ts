import type {AccountGamePort} from "../../application/accountGamePort.js";

interface CloudSaveDependencies {
 api(path:string,body?:object):Promise<unknown>;
 hasSession():boolean;
 cloudState:HTMLElement;
}

/** Revision-aware cloud save operations; local game state is restored only with confirmation. */
export function createCloudSaveController(port:AccountGamePort,deps:CloudSaveDependencies){
 let revision:string|null|undefined;
 return {
  reset():void{revision=undefined;},
  async read(backup=false,restoreGame=false):Promise<void>{
   if(!deps.hasSession())throw Error("Entre na conta primeiro.");
   const result=await deps.api("/v1/saves/main"+(backup?"?backup=true":"")) as {save?:object;revision:string|null};
   revision=result.revision;
   if(!result.save){deps.cloudState.textContent="Não há save nesta posição da nuvem.";return;}
   if(restoreGame){
    const restore=port.prepareRestore(JSON.stringify(result.save));
    if(window.confirm(backup?"Restaurar o backup neste navegador?":"Restaurar a partida da nuvem neste navegador?"))
     restore();
   }
   deps.cloudState.textContent=restoreGame?"Consulta concluída.":"Save encontrado na nuvem; revisão consultada. Restauração não foi automática.";
  },
  async save():Promise<void>{
   if(revision===undefined)throw Error("Consulte a nuvem antes de salvar.");
   const result=await deps.api("/v1/saves/main",{expectedRevision:revision,
    save:JSON.parse(port.exportSaveText())}) as {revision:string};
   revision=result.revision;
   deps.cloudState.textContent="Save confirmado na nuvem. O save local permanece preservado.";
  }
 };
}
