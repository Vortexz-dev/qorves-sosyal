// Device-only encrypted credentials. The AES key is non-extractable; plaintext
// passwords are used only for the existing authenticated sign-in request.
export function createAccountVault(io,crypt=crypto){

 const metadata=u=>({handle:u.handle,name:u.name||u.handle,avatar:u.avatar||''});
 return {
  async list(){return (await io.all()).filter(r=>r?.handle).map(r=>({...metadata(r),ready:!!r.cipher}));},
  async profile(u){const old=await io.get(u.handle);await io.put(u.handle,{...old,...metadata(u)});},
  async remember(u,password){const secretKey=await crypt.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']),iv=crypt.getRandomValues(new Uint8Array(12)),cipher=await crypt.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(u.handle)},secretKey,new TextEncoder().encode(password));await io.put(u.handle,{...metadata(u),iv,cipher,secretKey});},
  async password(handle){const saved=await io.get(handle);if(!saved?.cipher)throw Error('Bu hesap için şifrenle bir kez giriş yap.');return new TextDecoder().decode(await crypt.subtle.decrypt({name:'AES-GCM',iv:saved.iv,additionalData:new TextEncoder().encode(handle)},saved.secretKey,saved.cipher));},
  remove:handle=>io.remove(handle)
 };
}
let database;
function open(){return database||=new Promise((resolve,reject)=>{const r=indexedDB.open('qorves-account-vault',1);r.onupgradeneeded=()=>r.result.createObjectStore('entries');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('Cihazdaki hesap kaydına ulaşılamadı.'));});}
async function request(mode,fn){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('entries',mode),r=fn(tx.objectStore('entries'));let result;r.onsuccess=()=>{result=r.result;};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(Error('Hesap bu cihaza kaydedilemedi.'));tx.onabort=tx.onerror;});}
export const accountVault=createAccountVault({get:k=>request('readonly',s=>s.get(k)),put:(k,v)=>request('readwrite',s=>s.put(v,k)),all:()=>request('readonly',s=>s.getAll()),remove:k=>request('readwrite',s=>s.delete(k))});
