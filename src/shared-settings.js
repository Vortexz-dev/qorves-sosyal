import {mergeSimulationSettings} from './publication.js';
const encode=v=>v===null?{nullValue:null}:typeof v==='boolean'?{booleanValue:v}:typeof v==='number'?{integerValue:String(v)}:Array.isArray(v)?{arrayValue:{values:v.map(encode)}}:{stringValue:String(v)};
// Settings already arrive through the shared listener. Updating only changed
// fields avoids a transactional read that can retry indefinitely on read quota.
export function settingsCommit(project,current,patch,now){
 const fields={...patch},transforms=[{fieldPath:'revision',increment:{integerValue:'1'}}];
 delete fields.revision;delete fields.totalPausedMs;delete fields.pauseStartedAt;delete fields.apiKey;
 if('enabled'in fields&&fields.enabled!==current.enabled){
  fields.pauseStartedAt=fields.enabled?0:now;
  if(fields.enabled)transforms.push({fieldPath:'totalPausedMs',increment:{integerValue:String(Math.max(0,now-(current.pauseStartedAt||now)))}});
 }
 return {writes:[{update:{name:`projects/${project}/databases/(default)/documents/settings/simulation`,fields:Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,encode(v)]))},updateMask:{fieldPaths:Object.keys(fields)},currentDocument:{exists:true},updateTransforms:transforms}]};
}
export async function writeSharedSettings(project,token,current,patch,{fetcher=fetch,now=Date.now(),endpoint}={}){
 let r;
 try{r=await fetcher(endpoint||`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents:commit`,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({...settingsCommit(project,current,patch,now),...(endpoint?{requestId:crypto.randomUUID()}:{})}),signal:AbortSignal.timeout(8000)});}
 catch(e){throw Error(e.name==='TimeoutError'?'Ayarın kaydı doğrulanamadı. Bağlantıyı kontrol edip yeniden dene.':'Ortak ayar bağlantısına ulaşılamadı. Yeniden dene.');}
 const body=await r.json();if(!r.ok)throw Error(r.status===429?'Firebase kayıt kotası dolu. Kota yenilendiğinde tekrar deneyebilirsin.':'Ortak ayar kaydedilemedi ('+r.status+').');
 const next=mergeSimulationSettings(current,patch,now),revision=body.writeResults?.[0]?.transformResults?.[0]?.integerValue;
 if(revision!==undefined)next.revision=Number(revision);return next;
}
