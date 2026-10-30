// Lightweight wake-up: queued publishing does not call Gemini.
import {initializeApp} from 'firebase/app';
import {getAuth,signInAnonymously} from 'firebase/auth';
import {openCloudStore} from './cloud-store.mjs';
import {config} from '../src/config.js';
import {day} from '../src/domain.js';
import {cloudTurnDue} from '../src/publication.js';
const apiKey=process.env.GEMINI_API_KEY;
if(!apiKey){console.error('GEMINI_API_KEY deposunun Actions secret alanında tanımlanmalı.');process.exit(1);}
const values=new Map([['qorves-gemini-private',apiKey]]);
globalThis.localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
globalThis.window={addEventListener:()=>{}};
const timer=setTimeout(()=>{console.error('Bulut turu toplam süre sınırına ulaştı.');process.exit(1);},420000);
try{
 const {storage,defaults}=await import('../src/storage.js');
 const app=initializeApp(config.firebaseConfig);await signInAnonymously(getAuth(app));const fs=await openCloudStore(()=>getAuth(app).currentUser.getIdToken());if(!fs){console.log('Ortak hat ilk esitleme veya guvenli durdurma durumunda; islem yapilmadi.');clearTimeout(timer);process.exit(0);}const {getFirestore,setDoc,getDocFromServer,getDocs,doc,query,collection,where,limit}=fs,db=getFirestore(app);
 const [s,c]=await Promise.all([getDocFromServer(doc(db,'settings','simulation')),getDocFromServer(doc(db,'control','simulation'))]);
 const settings={...defaults,...s.data()},control=c.data()||{},now=Date.now();
 await setDoc(doc(db,'control','simulation'),{lastWake:now,clockTrigger:process.env.GITHUB_EVENT_NAME||'local',...(process.env.GITHUB_EVENT_NAME==='schedule'?{lastScheduledWake:now}:{})},{merge:true});
 if(!config.simulationAllowed||!settings.enabled){console.log('Simülasyon panelden kapalı; Gemini isteği ve yayın yapılmadı.');process.exit(0);}
 if(config.realtimeEnabled&&config.realtimeUrl){try{const r=await fetch(config.realtimeUrl+'/api/v1/tick',{headers:{Authorization:'Bearer '+await getAuth(app).currentUser.getIdToken()},signal:AbortSignal.timeout(20000)});if(!r.ok)console.log('Ek yanıt dağıtıcısı bu tur kullanılamadı; normal tur devam ediyor.');}catch{console.log('Ek yanıt dağıtıcısına bu tur ulaşılamadı.');}}
 const due=cloudTurnDue(settings,control,now,day(),process.env.QORVES_FORCE_TURN==='true');
 const pending=await getDocs(query(collection(db,'memories'),where('dueAt','<=',now),limit(1)));
 if(!due&&pending.empty){console.log('Henüz üretim veya yayın zamanı değil; AI çağrısı yapılmadı.');process.exit(0);}
 await storage.init({cloud:true,deliveryOnly:!due});
 const published=await storage.flushDuePublications();
 let result={status:'publishing-only'};
 if(due){const {generate}=await import('../src/simulation.js');result=await generate(process.env.QORVES_FORCE_TURN==='true',[],{scheduleToleranceMs:90000,spreadMinutes:30});}
 await storage.refreshControl();
 // Never print settings or provider payloads: the job log must contain no secrets.
 console.log(JSON.stringify({result,published,requests:storage.usage.requests||0,generated:storage.usage.posts||0,likes:storage.usage.likes||0,pending:storage.usage.pending||0,status:storage.usage.status||''}));
 clearTimeout(timer);process.exit(result?.status==='failed'?1:0);
}catch(error){clearTimeout(timer);console.error('Bulut turu başarısız:',error.code||error.name);process.exit(1);}


