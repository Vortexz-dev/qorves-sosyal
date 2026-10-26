import {config} from './config.js';
import {id,day,safeText,validateBackup} from './domain.js';
import npcs from './data/profiller.json' with {type:'json'};
import history from './data/history.json' with {type:'json'};
import {mergeSimulationSettings,planPublications,effectiveDue,compactPublications} from './publication.js';
export const defaults={enabled:false,postsEnabled:true,repliesEnabled:true,intervalMinutes:30,maxRequests:48,interactiveMaxRequests:96,maxPosts:2400,batchSize:50,likesPerTurn:100,apiKey:'',model:config.geminiModel,muted:[],revision:0};
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
 async authToken(){if(!db)throw Error('Mesajlar için ortak ağa bağlan.');const {getAuth}=await import('firebase/auth');return getAuth().currentUser.getIdToken();},
 async resetIdentity(){if(!db)return;const {getAuth,signOut,signInAnonymously}=await import('firebase/auth');const a=getAuth();await signOut(a);await signInAnonymously(a);uid=a.currentUser.uid;},
 async init({forceLocal=false,cloud=false,deliveryOnly=false}={}){
  if(Object.keys(config.firebaseConfig).length&&!forceLocal){
   const initial=[];
   function listen(target,consume){initial.push(new Promise((resolve,reject)=>{let first=true;fs.onSnapshot(target,snap=>{consume(snap);if(first){first=false;resolve();}},error=>{storage.error='Ortak veriler alınamadı. Firebase bağlantısını ve kuralları kontrol et.';emit();if(first){first=false;reject(error);}});}));}
   const [{initializeApp},auth,firestore]=await Promise.all([import('firebase/app'),import('firebase/auth'),import('firebase/firestore')]);
   fs=firestore;const app=initializeApp(config.firebaseConfig);db=fs.getFirestore(app);mode='Ortak (Firebase)';
   const a=auth.getAuth(app);await auth.signInAnonymously(a);uid=a.currentUser.uid;
   for(const name of names){remoteRows[name]={};if(deliveryOnly||name==='memories'||name==='queue'||(cloud&&['users','likes','notifications','follows'].includes(name)))continue;
    const q=name==='posts'?fs.query(fs.collection(db,name),fs.orderBy('createdAt','desc'),fs.limit(config.feedPageSize)):name==='notifications'?fs.query(fs.collection(db,name),fs.orderBy('createdAt','desc'),fs.limit(100)):cloud&&name==='comments'?fs.query(fs.collection(db,name),fs.orderBy('createdAt','desc'),fs.limit(200)):fs.collection(db,name);
    const consume=snap=>{for(const change of snap.docChanges()){if(change.type==='removed'){if(name!=='posts')delete remoteRows[name][change.doc.id];}else remoteRows[name][change.doc.id]={...change.doc.data(),id:change.doc.id};}if(name==='posts'&&!cursor)cursor=snap.docs.at(-1)||null;emit();};
    if(cloud)initial.push(fs.getDocs(q).then(consume));else listen(q,consume);
   }
   // All moderation tombstones must survive the recent-feed window on fresh clients.
   if(!deliveryOnly)listen(fs.query(fs.collection(db,'posts'),fs.where('deleted','==',true)),snap=>{for(const d of snap.docs)remoteRows.posts[d.id]={...d.data(),id:d.id};emit();});
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
 async readNotifications(keys){const now=Date.now();if(db){const batch=fs.writeBatch(db);for(const key of keys.slice(0,100))batch.update(ref('notifications',key),{readAt:now});await batch.commit();}else applyLocal(s=>{for(const key of keys)if(s.collections.notifications[key])s.collections.notifications[key].readAt=now;});},
 async saveUser(user,creating=false){const key=user.handle.slice(1);if(db){await fs.runTransaction(db,async tx=>{const r=ref('users',key),old=await tx.get(r);if(creating&&old.exists())throw Error('Bu kullanıcı adı alınmış.');tx.set(r,{...user,id:key});});}else{if(creating&&await getOne('users',key))throw Error('Bu kullanıcı adı alınmış.');await put('users',key,{...user,id:key});}},
 getUser:handle=>getOne('users',handle.replace(/^@/,'')),
 async saveSettings(patch){if('apiKey' in patch){privateKey=patch.apiKey;localStorage.setItem('qorves-gemini-private',privateKey);patch={...patch};delete patch.apiKey;}if(db){await fs.runTransaction(db,async tx=>{const r=ref('settings','simulation'),snap=await tx.get(r);tx.set(r,mergeSimulationSettings({...defaults,...snap.data()},patch));});}else applyLocal(s=>{s.settings=mergeSimulationSettings({...defaults,...s.settings},patch);});},
 async deletePost(postId){await put('posts',postId,{id:postId,deleted:true,createdAt:Date.now()});},deleteComment:key=>remove('comments',key),
 async saveEvent(event){if(!safeText(event.text))throw Error('Olay metni evren kurallarını ihlal ediyor.');const row={...event,id:event.id||id(),createdAt:event.createdAt||Date.now()};await put('events',row.id,row);},deleteEvent:key=>remove('events',key),
 async enqueue(target){const row={id:target.id,target,createdAt:Date.now(),done:false};await put('queue',row.id,row);},
 async pending(){if(db){const snap=await fs.getDocs(fs.query(fs.collection(db,'queue'),fs.where('done','==',false),fs.limit(10)));return snap.docs.map(d=>({...d.data(),id:d.id}));}return rows('queue').filter(q=>!q.done).slice(0,10);},
 memory:handle=>getOne('memories',encodeURIComponent(handle)),
 relationship:(author,target)=>getOne('follows',encodeURIComponent(author+':'+target)),
 async updateRelationships(claim,decisions){let changed=0;for(const d of decisions.slice(0,6)){if(!d?.author||d.author===d.target||!['follow','unfollow'].includes(d.action)||!safeText(d.reason||'')||!d.reason?.trim()||!npcs.some(n=>n.kullanici_adi===d.author))continue;const key=encodeURIComponent(d.author+':'+d.target),marker='relationship-'+key,now=Date.now();if(db){const done=await fs.runTransaction(db,async tx=>{const [s,c,f,m]=await Promise.all([tx.get(ref('settings','simulation')),tx.get(ref('control','simulation')),tx.get(ref('follows',key)),tx.get(ref('memories',marker))]);if(!s.data()?.enabled||s.data().revision!==claim.revision||c.data()?.token!==claim.token||now-(m.data()?.updatedAt||0)<86400000||(d.action==='follow')===f.exists())return false;if(d.action==='follow'){tx.set(ref('follows',key),{id:key,author:d.author,target:d.target,createdAt:now});if(!npcs.some(n=>n.kullanici_adi===d.target)){const nid=id();tx.set(ref('notifications',nid),{id:nid,recipient:d.target,author:d.author,kind:'takip',postId:'',createdAt:now,readAt:0});}}else tx.delete(ref('follows',key));tx.set(ref('memories',marker),{id:marker,kind:'relationship',summary:'Takip tercihi güncellendi.',recent:[],updatedAt:now});return true;});if(done)changed++;}else if(settings.enabled&&settings.revision===claim.revision&&state.control.token===claim.token){const old=state.collections.memories[marker],exists=!!state.collections.follows[key];if(now-(old?.updatedAt||0)<86400000||(d.action==='follow')===exists)continue;applyLocal(s=>{if(d.action==='follow')s.collections.follows[key]={id:key,author:d.author,target:d.target,createdAt:now};else delete s.collections.follows[key];s.collections.memories[marker]={id:marker,kind:'relationship',summary:'Takip tercihi güncellendi.',recent:[],updatedAt:now};});if(d.action==='follow')await storage.notify(d.target,d.author,'takip');changed++;}}return changed;},
 async stageTurn(claim,generated,memories,pairs,handled=[],minutes=30){
  const raw=planPublications(generated,memories,pairs,claim.settings,Date.now(),minutes),planned=compactPublications(raw);
  if(db)return fs.runTransaction(db,async tx=>{const sr=ref('settings','simulation'),cr=ref('control','simulation');const [a,b]=await Promise.all([tx.get(sr),tx.get(cr)]);const s=a.data(),c=b.data();if(!s?.enabled||s.revision!==claim.revision||c?.token!==claim.token||c.until<Date.now())return false;for(const item of planned)tx.set(ref('memories',item.id),item);for(const q of handled)tx.set(ref('queue',q.id),{...q,done:true});tx.set(cr,{...c,posts:c.posts+generated.length,pending:(c.pending||0)+raw.length,until:0,status:'Üretildi; yayınlar yarım saate dağıtıldı',lastSuccess:Date.now()});return true;});
  if(!settings.enabled||settings.revision!==claim.revision||state.control.token!==claim.token)return false;
  applyLocal(s=>{for(const item of planned)s.collections.memories[item.id]=item;for(const q of handled)s.collections.queue[q.id]={...q,done:true};s.control={...s.control,posts:s.control.posts+generated.length,pending:(s.control.pending||0)+raw.length,until:0};});return true;
 },
 async flushDuePublications(now=Date.now()){
  await storage.refreshSettings();if(!storage.settings.enabled)return {texts:0,likes:0};
  const items=db?(await fs.getDocs(fs.query(fs.collection(db,'memories'),fs.where('dueAt','<=',now),fs.limit(200)))).docs.map(d=>({...d.data(),id:d.id})):rows('memories').filter(x=>x.kind==='publication'&&x.dueAt<=now);
  const due=items.filter(x=>x.kind==='publication'&&effectiveDue(x,storage.settings)<=now).sort((a,b)=>a.dueAt-b.dueAt),total={texts:0,likes:0};
  const reactions=item=>item.type==='likes'?item.body.items:item.type==='like'?[{body:item.body,dueAt:item.dueAt}]:[];
  for(let offset=0;offset<due.length;offset+=40){const batch=due.slice(offset,offset+40);
   if(db){const result=await fs.runTransaction(db,async tx=>{
    const [sdoc,cdoc,...docs]=await Promise.all([tx.get(ref('settings','simulation')),tx.get(ref('control','simulation')),...batch.map(x=>tx.get(ref('memories',x.id)))]),s=sdoc.data(),c=cdoc.data()||{};
    if(!s?.enabled||!config.simulationAllowed)return {texts:0,likes:0};
    const current=docs.map((d,i)=>({...d.data(),id:batch[i].id})).filter(x=>x.kind==='publication'&&effectiveDue(x,s)<=now),pairs=current.flatMap(reactions),existing=await Promise.all(pairs.map(x=>tx.get(ref('likes',encodeURIComponent(x.body.postId+':'+x.body.author))))),seen=new Set(existing.filter(d=>d.exists()).map(d=>d.id));
    const result={texts:0,likes:0,removed:0};
    for(const item of current){const rs=reactions(item);
     if(rs.length){for(const reaction of rs){const body=reaction.body,key=encodeURIComponent(body.postId+':'+body.author);if(!seen.has(key)){seen.add(key);tx.set(ref('likes',key),{id:key,postId:body.postId,author:body.author,createdAt:reaction.dueAt+Math.max(0,(s.totalPausedMs||0)-(item.pauseOffset||0)),publishedAt:Date.now()});if(body.recipient&&!npcs.some(n=>n.kullanici_adi===body.recipient)){const nid='like-notice-'+key;tx.set(ref('notifications',nid),{id:nid,recipient:body.recipient,author:body.author,kind:'beğeni',postId:body.postId,createdAt:reaction.dueAt,readAt:0});}result.likes++;}}result.removed+=rs.length;}
     else{const body=item.body,createdAt=effectiveDue(item,s);tx.set(ref(item.type==='comment'?'comments':'posts',body.id),{...body,createdAt,publishedAt:Date.now()});if(item.memory)tx.set(ref('memories',encodeURIComponent(item.memory.handle)),item.memory);if(body.recipient&&!npcs.some(n=>n.kullanici_adi===body.recipient)){const nid=id();tx.set(ref('notifications',nid),{id:nid,recipient:body.recipient,author:body.author,kind:'yanıt',postId:body.postId||body.id,createdAt});}result.texts++;result.removed++;}
     tx.delete(ref('memories',item.id));
    }
    if(result.removed)tx.set(ref('control','simulation'),{...c,pending:Math.max(0,(c.pending||0)-result.removed),published:(c.published||0)+result.texts,likes:(c.likes||0)+result.likes,lastPublication:Date.now()});return result;
   });total.texts+=result.texts;total.likes+=result.likes;
   }else if(storage.settings.enabled){applyLocal(s=>{for(const old of batch){const item=s.collections.memories[old.id];if(!item||effectiveDue(item,s.settings)>now)continue;const rs=reactions(item);if(rs.length){for(const reaction of rs){const body=reaction.body,key=encodeURIComponent(body.postId+':'+body.author);if(!s.collections.likes[key]){s.collections.likes[key]={id:key,...body,createdAt:reaction.dueAt+Math.max(0,(s.settings.totalPausedMs||0)-(item.pauseOffset||0))};if(body.recipient&&!npcs.some(n=>n.kullanici_adi===body.recipient)){const nid='like-notice-'+key;s.collections.notifications[nid]={id:nid,recipient:body.recipient,author:body.author,kind:'beğeni',postId:body.postId,createdAt:reaction.dueAt,readAt:0};}total.likes++;}}}else{const body=item.body;s.collections[item.type==='comment'?'comments':'posts'][body.id]={...body,createdAt:effectiveDue(item,s.settings)};if(item.memory)s.collections.memories[encodeURIComponent(item.memory.handle)]=item.memory;total.texts++;}delete s.collections.memories[old.id];}s.control.pending=Object.values(s.collections.memories).filter(x=>x.kind==='publication').reduce((n,x)=>n+(reactions(x).length||1),0);});}
  }return total;
 },
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








