import {config} from './config.js';
import {id,day,safeText,validateBackup} from './domain.js';
import npcs from './data/profiller.json' with {type:'json'};
import history from './data/history.json' with {type:'json'};
export const defaults={enabled:false,postsEnabled:true,repliesEnabled:true,intervalMinutes:30,maxRequests:48,maxPosts:2400,batchSize:50,likesPerTurn:100,apiKey:'',model:config.geminiModel,muted:[],revision:0};
const names=['posts','users','comments','likes','follows','notifications','events','memories','queue'];
const base=new Date('2026-10-26T04:00:00Z').getTime();
export const seeds=[...npcs.flatMap((n,i)=>n.ornek_paylasimlar.filter(safeText).map((text,j)=>({id:`seed-${n.id}-${j}`,author:n.kullanici_adi,text,system:n.sistem,race:n.irk,createdAt:base-(j*100+i)*420000,seed:true}))),...history.filter(p=>safeText(p.text)).map(p=>({...p,seed:true}))].sort((a,b)=>b.createdAt-a.createdAt);
const localKey='qorves-social-v1';
let state=JSON.parse(localStorage.getItem(localKey)||'null')||{collections:Object.fromEntries(names.map(n=>[n,{}])),settings:{...defaults},control:{}};
let db,fs,uid,mode='Yerel',listeners=new Set(),remoteRows={},cursor=null,feedLimit=config.feedPageSize;
let settings={...defaults,...state.settings};
let privateKey=localStorage.getItem('qorves-gemini-private')||'';
const emit=()=>listeners.forEach(fn=>fn());
function persist(){try{localStorage.setItem(localKey,JSON.stringify(state));}catch{throw Error('Tarayıcı depolaması doldu. Yedek alıp büyük görselleri azalt.');}emit();}
function applyLocal(fn){const next=structuredClone(state);fn(next);localStorage.setItem(localKey,JSON.stringify(next));state=next;settings={...defaults,...state.settings};emit();}
function rows(name){return mode==='Yerel'?Object.values(state.collections[name]||{}):Object.values(remoteRows[name]||{});}
function ref(name,key){return fs.doc(db,name,key);}
async function put(name,key,data){if(db)await fs.setDoc(ref(name,key),data);else applyLocal(s=>{s.collections[name][key]=data;});}
async function remove(name,key){if(db)await fs.deleteDoc(ref(name,key));else applyLocal(s=>{delete s.collections[name][key];});}
async function getOne(name,key){return db?(await fs.getDoc(ref(name,key))).data():state.collections[name]?.[key];}
async function atomicControl(fn){if(db)return fs.runTransaction(db,async tx=>{const r=ref('control','simulation'),s=ref('settings','simulation');const [a,b]=await Promise.all([tx.get(r),tx.get(s)]);const result=fn(a.data()||{}, {...defaults,...b.data(),apiKey:privateKey});if(result?.next)tx.set(r,result.next);return result?.value;});return navigator.locks.request('qorves-simulation',async()=>{state=JSON.parse(localStorage.getItem(localKey))||state;const result=fn(state.control||{},{...defaults,...state.settings,apiKey:privateKey});if(result?.next)applyLocal(s=>s.control=result.next);return result?.value;});}
export const storage={
 get mode(){return mode;}, get settings(){return {...settings,apiKey:privateKey};}, get uid(){return uid;},get usage(){return db?remoteRows.control?.simulation||{}:state.control||{};},
 async init({forceLocal=false,cloud=false}={}){
  if(Object.keys(config.firebaseConfig).length&&!forceLocal){
   const initial=[];
   function listen(target,consume){initial.push(new Promise((resolve,reject)=>{let first=true;fs.onSnapshot(target,snap=>{consume(snap);if(first){first=false;resolve();}},error=>{storage.error='Ortak veriler alınamadı. Firebase bağlantısını ve kuralları kontrol et.';emit();if(first){first=false;reject(error);}});}));}
   const [{initializeApp},auth,firestore]=await Promise.all([import('firebase/app'),import('firebase/auth'),import('firebase/firestore')]);
   fs=firestore;const app=initializeApp(config.firebaseConfig);db=fs.getFirestore(app);mode='Ortak (Firebase)';
   const a=auth.getAuth(app);await auth.signInAnonymously(a);uid=a.currentUser.uid;
   for(const name of names){remoteRows[name]={};if(name==='memories'||name==='queue'||(cloud&&['users','likes','notifications','follows'].includes(name)))continue;
    const q=name==='posts'?fs.query(fs.collection(db,name),fs.orderBy('createdAt','desc'),fs.limit(config.feedPageSize)):name==='notifications'?fs.query(fs.collection(db,name),fs.orderBy('createdAt','desc'),fs.limit(100)):cloud&&name==='comments'?fs.query(fs.collection(db,name),fs.orderBy('createdAt','desc'),fs.limit(200)):fs.collection(db,name);
    const consume=snap=>{for(const change of snap.docChanges()){if(change.type==='removed'){if(name!=='posts')delete remoteRows[name][change.doc.id];}else remoteRows[name][change.doc.id]={...change.doc.data(),id:change.doc.id};}if(name==='posts'&&!cursor)cursor=snap.docs.at(-1)||null;emit();};
    if(cloud)initial.push(fs.getDocs(q).then(consume));else listen(q,consume);
   }
   // All moderation tombstones must survive the recent-feed window on fresh clients.
   listen(fs.query(fs.collection(db,'posts'),fs.where('deleted','==',true)),snap=>{for(const d of snap.docs)remoteRows.posts[d.id]={...d.data(),id:d.id};emit();});
   listen(ref('settings','simulation'),snap=>{settings={...defaults,...snap.data()};emit();});
   remoteRows.control={};listen(ref('control','simulation'),snap=>{remoteRows.control.simulation=snap.data()||{};emit();});
   await Promise.all(initial);
  }else{uid='local';window.addEventListener('storage',e=>{if(e.key===localKey){state=JSON.parse(e.newValue)||state;settings={...defaults,...state.settings};emit();}});}
  return storage;
 },
 subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},list:rows,
 async refreshSettings(){if(db){settings={...defaults,...(await fs.getDocFromServer(ref('settings','simulation'))).data()};emit();}return storage.settings;},
 async refreshControl(){if(db){remoteRows.control.simulation=(await fs.getDocFromServer(ref('control','simulation'))).data()||{};emit();}return storage.usage;},
 getFeed(){const saved=rows('posts'),hidden=new Set(saved.filter(p=>p.deleted).map(p=>p.id));const map=new Map([...seeds,...saved].map(p=>[p.id,p]));return [...map.values()].filter(p=>!p.deleted&&!hidden.has(p.id)).sort((a,b)=>b.createdAt-a.createdAt);},
 async loadMore(){if(!db){feedLimit+=40;return;}if(!cursor)return;const snap=await fs.getDocs(fs.query(fs.collection(db,'posts'),fs.orderBy('createdAt','desc'),fs.startAfter(cursor),fs.limit(40)));for(const d of snap.docs)remoteRows.posts[d.id]={...d.data(),id:d.id};cursor=snap.docs.at(-1)||null;emit();},
 async addPost(p){if(!p.text?.trim()||p.text.length>500||!safeText(p.text))throw Error('Bu metin yayınlanamaz. Uzunluğu veya evren kurallarını kontrol et.');const row={...p,id:p.id||id(),createdAt:p.createdAt||Date.now()};await put('posts',row.id,row);if(!npcs.some(n=>n.kullanici_adi===row.author))await storage.enqueue(row);return row;},
 async addComment(c){if(!c.text?.trim()||c.text.length>500||!safeText(c.text))throw Error('Bu yorum yayınlanamaz.');const row={...c,id:id(),createdAt:Date.now()};await put('comments',row.id,row);await storage.notify(c.recipient,c.author,'yorum',c.postId);await storage.enqueue({...row,system:c.system,race:c.race});return row;},
 async toggleLike(postId,author,recipient){const key=encodeURIComponent(`${postId}:${author}`),existing=await getOne('likes',key);if(existing)await remove('likes',key);else{await put('likes',key,{id:key,postId,author,createdAt:Date.now()});await storage.notify(recipient,author,'beğeni',postId);}},
 async follow(author,target){if(author===target)return;const key=encodeURIComponent(`${author}:${target}`);if(await getOne('follows',key))await remove('follows',key);else{await put('follows',key,{id:key,author,target});await storage.notify(target,author,'takip');}},
 async notify(recipient,author,kind,postId=''){if(!recipient||recipient===author||npcs.some(n=>n.kullanici_adi===recipient))return;const key=id();await put('notifications',key,{id:key,recipient,author,kind,postId,createdAt:Date.now()});},
 async saveUser(user,creating=false){const key=user.handle.slice(1);if(db){await fs.runTransaction(db,async tx=>{const r=ref('users',key),old=await tx.get(r);if(creating&&old.exists())throw Error('Bu kullanıcı adı alınmış.');tx.set(r,{...user,id:key});});}else{if(creating&&await getOne('users',key))throw Error('Bu kullanıcı adı alınmış.');await put('users',key,{...user,id:key});}},
 getUser:handle=>getOne('users',handle.replace(/^@/,'')),
 async saveSettings(patch){if('apiKey' in patch){privateKey=patch.apiKey;localStorage.setItem('qorves-gemini-private',privateKey);patch={...patch};delete patch.apiKey;}if(db){await fs.runTransaction(db,async tx=>{const r=ref('settings','simulation'),snap=await tx.get(r);tx.set(r,{...defaults,...snap.data(),...patch,apiKey:'',revision:(snap.data()?.revision||0)+1});});}else applyLocal(s=>{s.settings={...defaults,...s.settings,...patch,apiKey:'',revision:(s.settings.revision||0)+1};});},
 async deletePost(postId){await put('posts',postId,{id:postId,deleted:true,createdAt:Date.now()});},deleteComment:key=>remove('comments',key),
 async saveEvent(event){if(!safeText(event.text))throw Error('Olay metni evren kurallarını ihlal ediyor.');const row={...event,id:event.id||id(),createdAt:event.createdAt||Date.now()};await put('events',row.id,row);},deleteEvent:key=>remove('events',key),
 async enqueue(target){const row={id:target.id,target,createdAt:Date.now(),done:false};await put('queue',row.id,row);},
 async pending(){if(db){const snap=await fs.getDocs(fs.query(fs.collection(db,'queue'),fs.where('done','==',false),fs.limit(10)));return snap.docs.map(d=>({...d.data(),id:d.id}));}return rows('queue').filter(q=>!q.done).slice(0,10);},
 memory:handle=>getOne('memories',encodeURIComponent(handle)),
 async addReactions(claim,pairs){
  const unique=[...new Map(pairs.map(p=>[encodeURIComponent(`${p.postId}:${p.author}`),p])).entries()].slice(0,100);
  if(db)return fs.runTransaction(db,async tx=>{const [s,c,...existing]=await Promise.all([tx.get(ref('settings','simulation')),tx.get(ref('control','simulation')),...unique.map(([key])=>tx.get(ref('likes',key)))]);if(!s.data()?.enabled||s.data()?.revision!==claim.revision||c.data()?.token!==claim.token)return 0;let added=0;for(let i=0;i<unique.length;i++){if(existing[i].exists())continue;const [key,p]=unique[i];tx.set(ref('likes',key),{id:key,postId:p.postId,author:p.author,createdAt:Date.now()});if(p.recipient&&!npcs.some(n=>n.kullanici_adi===p.recipient)){const nid=id();tx.set(ref('notifications',nid),{id:nid,recipient:p.recipient,author:p.author,kind:'beğeni',postId:p.postId,createdAt:Date.now()});}added++;}tx.set(ref('control','simulation'),{...c.data(),likes:(c.data().likes||0)+added},{merge:true});return added;});
  if(!settings.enabled||settings.revision!==claim.revision||state.control.token!==claim.token)return 0;
  let added=0;applyLocal(s=>{for(const [key,p]of unique){if(s.collections.likes[key])continue;s.collections.likes[key]={id:key,postId:p.postId,author:p.author,createdAt:Date.now()};added++;}s.control.likes=(s.control.likes||0)+added;});return added;
 },
 async claim(owner,manual=false,scheduleToleranceMs=0){return atomicControl((c,s)=>{const now=Date.now(),date=day(),requests=c.day===date?c.requests||0:0,posts=c.day===date?c.posts||0:0;if(!config.simulationAllowed||!s.enabled||!s.apiKey||(!s.postsEnabled&&!s.repliesEnabled)||c.until>now||(!manual&&now-(c.lastAttempt||0)<Math.max(2,s.intervalMinutes)*60000-Math.max(0,Math.min(90000,scheduleToleranceMs)))||requests>=s.maxRequests||posts>=s.maxPosts)return {value:null};const token=id(),budget=Math.min(Math.max(1,Math.min(50,s.batchSize||50)),s.maxPosts-posts);return {next:{...c,day:date,requests:requests+1,posts,likes:c.day===date?c.likes||0:0,owner,token,revision:s.revision,until:now+360000,lastAttempt:now},value:{token,revision:s.revision,budget,settings:s}};});},
 async finish(claim,generated,memories,handled=[]){
  if(db){return fs.runTransaction(db,async tx=>{const cr=ref('control','simulation'),sr=ref('settings','simulation');const [a,b]=await Promise.all([tx.get(cr),tx.get(sr)]);const c=a.data(),s={...defaults,...b.data()};if(!s.enabled||s.revision!==claim.revision||c?.token!==claim.token||c.until<Date.now()||!config.simulationAllowed)return false;for(const p of generated)tx.set(ref(p.replyTo?'comments':'posts',p.id),p);for(const m of memories)tx.set(ref('memories',encodeURIComponent(m.handle)),m);for(const q of handled)tx.set(ref('queue',q.id),{...q,done:true});tx.set(cr,{...c,posts:c.posts+generated.length,until:0,status:'Tamamlandı',lastSuccess:Date.now()});return true;});
  }return navigator.locks.request('qorves-simulation',async()=>{state=JSON.parse(localStorage.getItem(localKey))||state;const c=state.control,s=state.settings;if(!s.enabled||s.revision!==claim.revision||c.token!==claim.token||c.until<Date.now()||!config.simulationAllowed)return false;applyLocal(next=>{for(const p of generated)next.collections[p.replyTo?'comments':'posts'][p.id]=p;for(const m of memories)next.collections.memories[encodeURIComponent(m.handle)]=m;for(const q of handled)next.collections.queue[q.id]={...q,done:true};next.control={...c,posts:c.posts+generated.length,until:0,status:'Tamamlandı',lastSuccess:Date.now()};});return true;});
 },
 async release(claim,status,refund=false){return atomicControl(c=>c.token===claim.token?{next:{...c,until:0,status,requests:Math.max(0,c.requests-(refund?1:0))},value:true}:{value:false});},
 async export(){const collections={};for(const name of names){if(db){const snap=await fs.getDocs(fs.collection(db,name));collections[name]=snap.docs.map(d=>({...d.data(),id:d.id}));}else collections[name]=Object.entries(state.collections[name]||{}).map(([key,value])=>({...value,id:key}));}return {version:1,exportedAt:new Date().toISOString(),collections};},
 async import(data){validateBackup(data);for(const [name,items]of Object.entries(data.collections)){for(const row of items)await put(name,row.id,row);}emit();},
};







