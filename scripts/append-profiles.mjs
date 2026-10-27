import {readFile,writeFile,access} from 'node:fs/promises';
import path from 'node:path';
import {safeText} from '../src/domain.js';

// Incremental import: existing identities, history and private personality notes
// remain intact. Never publish the raw source or the private-only fields.
const input=process.argv[2];
if(!input)throw Error('Pass the additional profiles JSON file.');
const parse=async file=>JSON.parse((await readFile(file,'utf8')).replace(/^\uFEFF/,''));
const raw=await parse(input),extra=Array.isArray(raw)?raw:raw.profiller;
const current=await parse('src/data/profiller.json');
const backend=await parse('../qorves-sosyal-api/lib/data/profiller.json');
const aliases=await parse('src/data/profile-aliases.json');
const clean=v=>typeof v==='string'&&safeText(v)?v:'';
const handle=h=>'@'+String(h).replace(/^@/,'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replaceAll('ı','i');
const canonical=h=>aliases[h]||handle(h);
const ids=new Set(current.map(n=>n.id)),handles=new Set(current.map(n=>n.kullanici_adi));
for(const n of extra){
 const h=handle(n.kullanici_adi);
 if(!/^@[a-zA-Z0-9_.]{1,28}$/.test(h)||ids.has(n.id)||handles.has(h))throw Error('Duplicate or invalid profile identity: '+n.id);
 ids.add(n.id);handles.add(h);if(h!==n.kullanici_adi)aliases[n.kullanici_adi]=h;
}
const profiles=[];const privateProfiles=[];
for(const n of extra){
 const folder=path.dirname(n.foto.replaceAll('\\','/'));
 if(!/^profiller\/[^/]+$/.test(folder)||n.banner.replaceAll('\\','/')!==folder+'/banner.jpg')throw Error('Invalid profile image paths: '+n.id);
 await access(path.resolve(path.dirname(input),folder,'profil.jpg'));await access(path.resolve(path.dirname(input),folder,'banner.jpg'));
 const relations=[...new Set((n.iliskili_hesaplar||[]).map(h=>canonical('@'+h.replace(/^@/,''))))];
 if(relations.some(h=>!handles.has(h)))throw Error('Unresolved relationship: '+n.id);
 const p={id:n.id,kullanici_adi:handle(n.kullanici_adi),gorunen_ad:clean(n.gorunen_ad)||clean(n.gercek_ad),gercek_ad:clean(n.gercek_ad),irk:clean(n.irk),sistem:clean(n.sistem),sehir:clean(n.sehir),yas:Number.parseInt(n.yas)||null};
 for(const k of ['meslek','bio','kisilik','hayat_ozeti','sever','sevmez','paylasir','paylasmaz','aliskanlik','kavga','takip','kaos','alt_tip','avatar_tarifi','banner_tarifi'])p[k]=clean(n[k]);
 Object.assign(p,{tip:n.tip,konusma_uslubu:clean(n.yazim||n.konusma_uslubu),paylasim_konulari:clean(n.konular||n.paylasim_konulari),paylasim_sikligi_ve_bicimi:clean(n.aliskanlik||n.paylasim_sikligi_ve_bicimi),asla_soylemez:clean(n.paylasmaz||n.asla_soylemez)||'Gizli evren bilgisi açıklamaz.',ornek_paylasimlar:(n.ornek_paylasimlar||[]).filter(safeText),iliskili_hesaplar:relations,foto:folder+'/profil.jpg',banner:folder+'/banner.jpg'});
 profiles.push(p);
 const privateProfile={...p,dm_notu:clean(n.dm_notu)};
 for(const k of ['aile','gecmis','is','iliski','sir','rutin'])privateProfile[k]=clean(n[k]);
 privateProfiles.push(privateProfile);
}
const write=async(file,value)=>writeFile(file,JSON.stringify(value,null,2)+'\n');
await write('src/data/profiller.json',[...current,...profiles]);
await write('src/data/profile-aliases.json',aliases);
await write('../qorves-sosyal-api/lib/data/profiller.json',[...backend,...privateProfiles]);
await write('../qorves-sosyal-api/lib/data/profile-aliases.json',aliases);
console.log(JSON.stringify({added:profiles.length,total:current.length+profiles.length,aliases:Object.keys(aliases).length,relationships:profiles.reduce((s,n)=>s+n.iliskili_hesaplar.length,0)}));
