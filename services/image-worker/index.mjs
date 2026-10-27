// Qorves image worker. Workers Free only; fixed FLUX model, no paid fallback.
const relayUrl='https://qorves-sosyal-api.stormypoppy17.chatgpt.site/api/v1/image/consume';
const project='qorves-sosyal',clockUid='vQSL2BwTHvTtOASzi2r11xSEHD13';let keys,keysUntil=0;
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const bytes=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function identity(token){const [h,p,s]=token.split('.');if(!h||!p||!s)throw Error('identity');const header=JSON.parse(new TextDecoder().decode(bytes(h))),body=JSON.parse(new TextDecoder().decode(bytes(p)));if(header.alg!=='RS256'||body.sub!==clockUid||body.aud!==project||body.iss!==`https://securetoken.google.com/${project}`||body.exp*1000<=Date.now())throw Error('identity');if(!keys||keysUntil<Date.now()){const r=await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('keys');keys=(await r.json()).keys;keysUntil=Date.now()+3600000;}const jwk=keys.find(k=>k.kid===header.kid);if(!jwk)throw Error('identity');const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,bytes(s),new TextEncoder().encode(h+'.'+p)))throw Error('identity');}
async function doc(name,token){const r=await fetch(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/${name}`,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('settings');return (await r.json()).fields||{};}
const enc=new TextEncoder();
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function relayKey(secret){return crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
async function sign(secret,raw){return hex(await crypto.subtle.sign('HMAC',await relayKey(secret),enc.encode(raw)));}
async function verify(secret,raw,signature){if(!secret||!/^[a-f0-9]{64}$/.test(signature||''))return false;return crypto.subtle.verify('HMAC',await relayKey(secret),Uint8Array.from(signature.match(/../g),x=>parseInt(x,16)),enc.encode(raw));}
export default {async fetch(request,env){
 const path=new URL(request.url).pathname;
 if(path==='/health')return json({ok:true,model:'flux-1-schnell'});
 if(request.method!=='POST')return json({error:'Not found'},404);
 try{
  if(Number(request.headers.get('content-length')||0)>12000)return json({error:'Too large'},413);
  const raw=await request.text();if(raw.length>12000)return json({error:'Too large'},413);
  const data=JSON.parse(raw),token=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';
  if(path==='/generate'){
   if(!await verify(env.IMAGE_RELAY_SECRET,raw,request.headers.get('x-qorves-signature'))||Math.abs(Date.now()-Number(data.issuedAt))>60000)return json({error:'Unauthorized'},403);
  }else await identity(token);
  if(typeof data.prompt!=='string'||data.prompt.length<10||data.prompt.length>1400)return json({error:'Invalid prompt'},400);
  // Signed relay requests use the server's authoritative common-store check.
  // Legacy clock requests retain their Firestore claim validation.
  const s=path==='/generate'?null:await doc('settings/simulation',token),revision=s?Number(s.revision?.integerValue||0):Number(data.revision);
  if(s&&(!s.enabled?.booleanValue||!s.imageEnabled?.booleanValue))return json({error:'Paused'},409);
  if(path==='/generate'){
   const permitBody=JSON.stringify({permit:data.permit,revision,issuedAt:Date.now()});
   const r=await fetch(relayUrl,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json','User-Agent':'Qorves-Image-Worker/1.0','x-qorves-signature':await sign(env.IMAGE_RELAY_SECRET,permitBody)},body:permitBody,signal:AbortSignal.timeout(10000)});
   if(!r.ok||!(await r.json()).allowed)return json({error:'Consumed or expired permit'},409);
  }else{
   const c=await doc('control/simulation',token);
   if(revision!==data.claim?.revision||c.token?.stringValue!==data.claim?.token||Number(c.until?.integerValue||0)<=Date.now())return json({error:'Expired claim'},409);
  }
  if(!env.AI)return json({error:'Image binding unavailable'},503);
  const result=await env.AI.run('@cf/black-forest-labs/flux-1-schnell',{prompt:data.prompt,steps:4}),image=result.image;
  if(typeof image!=='string'||image.length>3900000||!/^[A-Za-z0-9+/=]+$/.test(image))return json({image:null,reason:'image-too-large'});
  if(path!=='/generate'){const current=await doc('settings/simulation',token);if(!current.enabled?.booleanValue||!current.imageEnabled?.booleanValue||Number(current.revision?.integerValue||0)!==revision)return json({error:'Paused'},409);}
  // The caller rechecks the shared revision before saving or publishing output.
  return json({image:'data:image/jpeg;base64,'+image});
 }catch(error){const message=String(error?.message||'');if(/identity|keys/.test(message))return json({error:'Unauthorized'},403);if(/quota|neurons|daily|allocation|429|3030/i.test(message))return json({error:'Free image quota exhausted'},429);return json({error:'Image service unavailable'},503);}
}};
