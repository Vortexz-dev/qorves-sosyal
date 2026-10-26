import spoiler from './data/spoiler_kurallari.json' with {type:'json'};
export const normalize=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replaceAll('ı','i');
const forbidden=spoiler.blockedEncoded.map(s=>globalThis.atob(s));
export function safeText(s){const n=normalize(s);return ![...forbidden,...spoiler.blockedPhrases].some(w=>n.includes(normalize(w))) && !/nys/i.test(n) && !/cellax/i.test(n);}
// Nys/Cellax discussion is conservatively discarded rather than guessing semantic safety.
export const cleanHandle=s=>'@'+normalize(s).replace(/^@/,'').replace(/[^a-z0-9_]/g,'').slice(0,28);
export const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const formatSocialText=text=>String(text).split(/(#[\p{L}\p{N}_]+|@[a-zA-Z0-9_]+)/gu).map(part=>part.startsWith('#')?`<a href="#/search/${encodeURIComponent(part)}" class="hashtag">${escapeHtml(part)}</a>`:part.startsWith('@')?`<a href="#/profile/${encodeURIComponent(part)}">${escapeHtml(part)}</a>`:escapeHtml(part)).join('');
export const id=()=>crypto.randomUUID();
export const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export async function hash(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export function scoreNPC(n,target){const words=normalize(target.text).split(/\W+/).filter(w=>w.length>3); const topics=normalize(n.paylasim_konulari+' '+n.meslek);return (n.sistem===target.system?5:0)+(n.irk===target.race?2:0)+words.filter(w=>topics.includes(w)).length*2+(n.iliskili_hesaplar?.includes(target.author)?4:0);}
export function chooseReactions(posts,characters,count=100){
 const pairs=[],seen=new Set();const actors=[...characters].sort(()=>Math.random()-.5);
 for(let pass=0;pass<3&&pairs.length<count;pass++)for(const n of actors){
  const candidates=posts.filter(p=>p.author!==n.kullanici_adi&&!p.deleted&&!seen.has(`${p.id}:${n.kullanici_adi}`));
  candidates.sort((a,b)=>(scoreNPC(n,b)+Math.random()*5)-(scoreNPC(n,a)+Math.random()*5));
  const post=candidates[Math.floor(Math.random()*Math.min(8,candidates.length))];if(!post)continue;
  seen.add(`${post.id}:${n.kullanici_adi}`);pairs.push({postId:post.id,author:n.kullanici_adi,recipient:post.author});if(pairs.length>=count)break;
 }
 return pairs.slice(0,Math.min(100,count));
}
export function validateOutputs(rows,tasks){if(!Array.isArray(rows))return [];const used=new Set();return rows.filter(r=>{const t=tasks.find(t=>t.handle===r?.handle);if(!t||used.has(r.handle)||typeof r.text!=='string'||!r.text.trim()||r.text.length>280||!safeText(r.text)|| (r.replyTo??null)!==(t.replyTo??null))return false;used.add(r.handle);return true;}).map(r=>({...r,text:r.text.trim(),memory:typeof r.memory==='string'&&safeText(r.memory)?r.memory.slice(0,700):''}));}
export function validateBackup(data){if(data?.version!==1||!data.collections||typeof data.collections!=='object')throw Error('Bu bir Qorves yedeği değil.');for(const [name,rows]of Object.entries(data.collections)){if(!['posts','users','comments','likes','follows','notifications','events','memories','queue'].includes(name)||!Array.isArray(rows)||rows.length>10000)throw Error('Yedek koleksiyonu geçersiz.');for(const r of rows){if(!r||typeof r.id!=='string'||r.id.includes('/')||JSON.stringify(r).length>500000||('text'in r&&!safeText(r.text))||(name==='memories'&&r.kind!=='publication'&&(!safeText(r.summary||'')||!Array.isArray(r.recent)||!r.recent.every(safeText)))||(r.kind==='publication'&&(!Number.isFinite(r.dueAt)||!['post','comment','like','likes'].includes(r.type)||!r.body||('text'in r.body&&!safeText(r.body.text))||(r.memory&&(!safeText(r.memory.summary||'')||!Array.isArray(r.memory.recent)||!r.memory.recent.every(safeText)))||(r.type==='likes'&&(!Array.isArray(r.body.items)||r.body.items.length>100||r.body.items.some(x=>!Number.isFinite(x.dueAt)||!x.body?.postId||!x.body?.author)))))||(name==='queue'&&!safeText(r.target?.text||'')))throw Error('Yedekte geçersiz kayıt var.');}}return data;}


