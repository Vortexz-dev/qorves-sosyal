// One bounded production turn. GitHub Actions owns the schedule and encrypted secret.
const apiKey=process.env.GEMINI_API_KEY;
if(!apiKey){console.error('GEMINI_API_KEY deposunun Actions secret alanında tanımlanmalı.');process.exit(1);}
const values=new Map([['qorves-gemini-private',apiKey]]);
globalThis.localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
globalThis.window={addEventListener:()=>{}};
const timer=setTimeout(()=>{console.error('Bulut turu toplam süre sınırına ulaştı.');process.exit(1);},420000);
try{
 const {storage}=await import('../src/storage.js');
 const {generate}=await import('../src/simulation.js');
 await storage.init({cloud:true});
 const settings=await storage.refreshSettings();
 if(!settings.enabled){console.log('Simülasyon panelden kapalı; Gemini isteği gönderilmedi.');process.exit(0);}
 const result=await generate(process.env.QORVES_FORCE_TURN==='true');
 // Never print settings or provider payloads: the job log must contain no secrets.
 console.log(JSON.stringify({result,day:storage.usage.day,requests:storage.usage.requests||0,generated:storage.usage.posts||0,status:storage.usage.status||''}));
 clearTimeout(timer);process.exit(result?.status==='failed'?1:0);
}catch(error){clearTimeout(timer);console.error('Bulut turu başarısız:',error.code||error.name);process.exit(1);}
