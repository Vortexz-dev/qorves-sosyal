const ttl=180*86400000,max=30000;
export function createSeenHistory(store){
 let owner='',entries=new Map(),pending=new Map();
 const key=()=> 'qorves-seen-v1:'+owner;
 function save(){try{store.setItem(key(),JSON.stringify([...entries].sort((a,b)=>b[1]-a[1]).slice(0,max)));store.setItem(key()+':pending',JSON.stringify([...pending].slice(0,max)));}catch{}}
 return {
  use(handle,now=Date.now()){if(owner===handle)return;owner=handle||'';pending=new Map();try{entries=new Map(JSON.parse(store.getItem(key())||'[]').filter(([id,at])=>typeof id==='string'&&at>now-ttl));pending=new Map(JSON.parse(store.getItem(key()+':pending')||'[]').filter(([id,at])=>entries.has(id)&&at>now-ttl));}catch{entries=new Map();}},
  has:id=>entries.has(id),
  mark(id,now=Date.now()){if(!owner||entries.has(id))return false;entries.set(id,now);pending.set(id,now);save();return true;},
  markMany(ids,now=Date.now()){if(!owner)return;let changed=false;for(const id of ids)if(!entries.has(id)){entries.set(id,now);pending.set(id,now);changed=true;}if(changed)save();},
  merge(rows){for(const row of rows||[]){const id=row.post_id||row.id,at=Number(row.seen||row.at);if(typeof id==='string'&&Number.isFinite(at))entries.set(id,Math.max(entries.get(id)||0,at));}save();},
  batch:()=>[...pending].slice(0,100).map(([id,at])=>({id,at})),
  ack(rows){for(const r of rows)if(pending.get(r.id)===r.at)pending.delete(r.id);save();},
 };
}
export function freshFeed(posts,{seen,liked=new Set(),visible=new Set(),retainedLiked=new Set()}){const roots=new Set();return posts.filter(p=>{const root=p.repostOf||p.id;if(roots.has(root))return false;const keep=(retainedLiked.has(p.id)||!liked.has(p.id)&&!liked.has(root))&&(visible.has(p.id)||!seen.has(p.id)&&!seen.has(root));if(keep)roots.add(root);return keep;});}
export function keepVisibleOrder(ranked,order,openedAt){
 if(!order.length)return ranked;
 const byId=new Map(ranked.map(p=>[p.id,p])),held=order.map(id=>byId.get(id)).filter(Boolean),ids=new Set(held.map(p=>p.id));
 const incoming=ranked.filter(p=>!ids.has(p.id)&&p.createdAt>openedAt);for(const p of incoming)ids.add(p.id);
 return [...incoming,...held,...ranked.filter(p=>!ids.has(p.id))];
}
export function watchFeed(root,history){
 if(typeof IntersectionObserver==='undefined')return ()=>{};
 const timers=new Map(),observed=new Set();const observer=new IntersectionObserver(entries=>{for(const entry of entries){const el=entry.target,id=el.dataset.feedId;clearTimeout(timers.get(el));timers.delete(el);if(entry.isIntersecting&&(entry.intersectionRatio>=.55||entry.intersectionRect.height>=Math.min(350,innerHeight*.55)))timers.set(el,setTimeout(()=>{timers.delete(el);const rect=el.getBoundingClientRect(),height=Math.max(0,Math.min(rect.bottom,innerHeight)-Math.max(rect.top,0));if(el.isConnected&&(height>=rect.height*.55||height>=Math.min(350,innerHeight*.55))&&document.visibilityState==='visible'&&!document.querySelector('.modal-backdrop'))history.markMany([id,...(el.dataset.feedOrigin?[el.dataset.feedOrigin]:[])]);},1200));}},{threshold:[0,.25,.55]});
 const visibility=()=>{if(document.visibilityState==='visible')for(const el of observed){observer.unobserve(el);observer.observe(el);}else for(const t of timers.values())clearTimeout(t);};document.addEventListener('visibilitychange',visibility);
 const stop=()=>{observer.disconnect();document.removeEventListener('visibilitychange',visibility);for(const t of timers.values())clearTimeout(t);};
 return {sync(){const current=new Set(root.querySelectorAll('[data-feed-id]'));for(const el of observed)if(!current.has(el)){observer.unobserve(el);clearTimeout(timers.get(el));timers.delete(el);observed.delete(el);}for(const el of current)if(!observed.has(el)){observed.add(el);observer.observe(el);}},stop};
}
