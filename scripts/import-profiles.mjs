import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {safeText} from '../src/domain.js';
const root=process.argv[2];if(!root)throw Error('Pass the local source directory containing profiller.json.');
const raw=JSON.parse((await readFile(path.join(root,'profiller.json'),'utf8')).replace(/^\uFEFF/,'')),source=Array.isArray(raw)?raw:raw.profiller;
const old=JSON.parse(await readFile('src/data/profiller.json','utf8'));let aliases={};try{aliases=JSON.parse(await readFile('src/data/profile-aliases.json','utf8'));}catch{}
const repairs=Object.fromEntries(source.filter(n=>/[^a-zA-Z0-9_.@]/.test(n.kullanici_adi)).map(n=>[n.kullanici_adi,n.kullanici_adi.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replaceAll('ı','i')]));
const clean=v=>typeof v==='string'&&safeText(v)?v:'';
const canonical=new Map(source.map(n=>[n.id,repairs[n.kullanici_adi]||n.kullanici_adi]));
for(const n of source)if(repairs[n.kullanici_adi])aliases[n.kullanici_adi]=repairs[n.kullanici_adi];
for(const n of old)if(canonical.has(n.id)&&n.kullanici_adi!==canonical.get(n.id))aliases[n.kullanici_adi]=canonical.get(n.id);
const handles=new Set(canonical.values());const resolve=h=>aliases[h]||h;
const result=source.map(n=>({id:n.id,kullanici_adi:canonical.get(n.id),gorunen_ad:clean(n.gorunen_ad)||n.gercek_ad,gercek_ad:clean(n.gercek_ad),irk:n.irk,sistem:n.sistem,sehir:clean(n.sehir),yas:Number.parseInt(n.yas)||null,meslek:clean(n.meslek),bio:clean(n.bio),kisilik:clean(n.kisilik),hayat_ozeti:clean(n.hayat_ozeti),sever:clean(n.sever),sevmez:clean(n.sevmez),paylasir:clean(n.paylasir),paylasmaz:clean(n.paylasmaz),aliskanlik:clean(n.aliskanlik),konusma_uslubu:clean(n.yazim||n.konusma_uslubu),paylasim_konulari:clean(n.konular||n.paylasim_konulari),paylasim_sikligi_ve_bicimi:clean(n.aliskanlik||n.paylasim_sikligi_ve_bicimi),asla_soylemez:clean(n.paylasmaz||n.asla_soylemez)||'Gizli evren bilgisi açıklamaz.',kavga:clean(n.kavga),takip:clean(n.takip),kaos:clean(n.kaos),tip:n.tip,alt_tip:clean(n.alt_tip),ornek_paylasimlar:(n.ornek_paylasimlar||[]).filter(safeText),iliskili_hesaplar:[...new Set((n.iliskili_hesaplar||[]).map(resolve).filter(h=>handles.has(h)))],foto:n.foto,banner:n.banner,avatar_tarifi:clean(n.avatar_tarifi)}));
if(result.length!==500||new Set(result.map(n=>n.kullanici_adi)).size!==500||result.some(n=>!/^@[a-zA-Z0-9_.]{1,28}$/.test(n.kullanici_adi)))throw Error('500 unique valid profiles are required.');
await mkdir('research',{recursive:true});await writeFile('research/previous-profiles.json',JSON.stringify(old));await writeFile('src/data/profiller.json',JSON.stringify(result,null,2)+'\n');await writeFile('src/data/profile-aliases.json',JSON.stringify(aliases,null,2)+'\n');
await writeFile('../qorves-sosyal-api/lib/data/profiller.json',JSON.stringify(result.map((n,i)=>({...n,dm_notu:clean(source[i].dm_notu)})),null,2)+'\n');await writeFile('../qorves-sosyal-api/lib/data/profile-aliases.json',JSON.stringify(aliases,null,2)+'\n');
console.log(JSON.stringify({profiles:result.length,aliases:Object.keys(aliases).length,repairedHandles:Object.keys(repairs).length}));
