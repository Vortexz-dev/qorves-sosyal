const norm=s=>String(s||'').toLocaleLowerCase('tr').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replaceAll('ı','i');
const stop=new Set(['icin','gibi','olan','biri','cok','bir','ve','ile','ama','hesap']);
export function accountTags(p={}){
 const tags=new Set();const add=(k,v)=>{if(v)tags.add(k+':'+norm(v));};
 let gender=p.cinsiyet||p.gender;const description=norm(p.avatar_tarifi);if(!gender&&p.kullanici_adi){const female=/(?:^|\W)(?:kadin|woman|female)(?:$|\W)/.test(description),male=/(?:^|\W)(?:erkek|man|male)(?:$|\W)/.test(description);if(female!==male)gender=female?'kadin':'erkek';}
 add('system',p.system||p.sistem);add('race',p.race||p.irk);add('type',p.tip);add('gender',gender);
 const age=Number(p.yas||p.age);if(age>=18)add('age',age<=25?'18-25':age<=35?'26-35':age<=50?'36-50':'51+');else if(age>0)add('age','under18');
 const text=[p.job,p.meslek,p.paylasim_konulari,p.bio,p.alt_tip].filter(Boolean).join(' ');
 for(const word of norm(text).match(/[\p{L}]{4,}/gu)||[])if(!stop.has(word))tags.add('topic:'+word);
 return [...tags].slice(0,45);
}
export function tasteProfile(likes,owner,posts,people,now=Date.now()){
 const postMap=new Map(posts.map(p=>[p.id,p])),weights=new Map(),authors=new Map();
 const seen=new Set();for(const l of likes.filter(l=>l.author===owner&&typeof l.postId==='string'&&!l.postId.startsWith('comment:')).sort((a,b)=>b.createdAt-a.createdAt).slice(0,150)){
  if(seen.has(l.postId))continue;seen.add(l.postId);const p=postMap.get(l.postId);if(!p||p.author===owner)continue;
  const w=Math.pow(.5,Math.max(0,now-(l.createdAt||now))/86400000/30);authors.set(p.author,(authors.get(p.author)||0)+w);
  for(const tag of accountTags(people(p.author)))weights.set(tag,(weights.get(tag)||0)+w);
 }
 return {weights,authors,count:seen.size};
}
export function affinity(handle,profile,people){const tags=accountTags(people(handle));return Math.min(5,profile.authors.get(handle)||0)*1.2+tags.reduce((n,t)=>n+Math.min(6,profile.weights.get(t)||0)*(t.startsWith('gender:')?1.2:t.startsWith('age:')?.7:t.startsWith('topic:')?.2:.35),0)/Math.max(1,Math.sqrt(tags.length));}
export function rankFeed(posts,profile,people,now=Date.now()){
 const chronological=[...posts].sort((a,b)=>b.createdAt-a.createdAt||a.id.localeCompare(b.id));if(!profile.count)return chronological;
 const scores=new Map();
 const ranked=[...posts].sort((a,b)=>score(b)-score(a)||b.createdAt-a.createdAt||a.id.localeCompare(b.id));
 function score(p){if(!scores.has(p.author))scores.set(p.author,Math.min(10,affinity(p.author,profile,people)));return 12*Math.pow(.5,Math.max(0,now-p.createdAt)/3600000/18)+scores.get(p.author);}
 const result=[],used=new Set();let r=0,c=0;while(result.length<posts.length){const pool=result.length%5===4?chronological:ranked;let i=pool===ranked?r:c;while(i<pool.length&&used.has(pool[i].id))i++;const item=pool[i];if(pool===ranked)r=i+1;else c=i+1;if(!item)break;used.add(item.id);result.push(item);}return result;
}
export const inSystem=(post,system)=>!system||post.system===system;
