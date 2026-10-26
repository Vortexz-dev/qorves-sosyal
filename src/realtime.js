import {config} from './config.js';
import {storage} from './storage.js';
export const realtime={
 get enabled(){return !!config.realtimeEnabled&&!!config.realtimeUrl;},
 async call(path,data){if(!realtime.enabled)throw Error('Mesaj hattı henüz oyunculara açılmadı.');const token=await storage.authToken();const r=await fetch(config.realtimeUrl+'/api/v1'+path,{method:data?'POST':'GET',headers:{Authorization:'Bearer '+token,...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});if(r.redirected||!r.headers.get('content-type')?.includes('application/json'))throw Error('Mesaj hattı henüz oyunculara açılmadı.');const b=await r.json();if(!r.ok)throw Error(b.error||'Mesaj hattı geçici olarak meşgul.');return b;},
 bind:(handle,password)=>realtime.call('/bind',{handle,password}),
 unbind:()=>realtime.enabled?realtime.call('/unbind',{}):Promise.resolve(),
 messages:peer=>realtime.call('/dm'+(peer?'?peer='+encodeURIComponent(peer):'')),
 read:peer=>realtime.call('/dm/read',{peer}),
 readAll:()=>realtime.call('/dm/read',{all:true}),
 send:(peer,text)=>realtime.call('/dm/send',{peer,text}),
 async react(collection,id){if(!realtime.enabled)return;try{await realtime.call('/react',{collection,id});}catch(e){console.info('Ek yanıt ertelendi; normal küme turu kullanılacak.');}},
 async tick(){if(!realtime.enabled)return;try{await realtime.call('/tick');}catch{}},
};
