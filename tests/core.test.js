import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {safeText,cleanHandle,escapeHtml,validateOutputs,validateBackup,scoreNPC,formatSocialText,chooseReactions} from '../src/domain.js';
import npcs from '../src/data/profiller.json' with {type:'json'};
import world from '../src/data/world.json' with {type:'json'};
import {planPublications,effectiveDue,mergeSimulationSettings,cloudTurnDue} from '../src/publication.js';
test('100 source characters have all portraits and connected handles',()=>{assert.equal(npcs.length,100);assert.equal(new Set(npcs.map(n=>n.kullanici_adi)).size,100);for(const n of npcs){assert.ok(existsSync('public/'+n.foto));assert.ok(n.asla_soylemez);for(const h of n.iliskili_hesaplar)assert.ok(npcs.some(n=>n.kullanici_adi===h));}});
test('public world has 29 unique systems and 20 playable races',()=>{assert.equal(new Set(world.systems).size,29);assert.equal(world.races.length,20);assert.ok(world.unknownSystems.includes('Nys'));for(const x of ['ZXJlYnVz','dGh1bA==','aXNvbGRl'])assert.ok(!JSON.stringify(world).toLowerCase().includes(atob(x)));});
test('spoiler filter normalizes Turkish casing and accents',()=>{for(const x of ['ISOLDE','Isolde','İSOLDE','EREBUS','Thul','Nys üzerinde yaşam','Cellax gerçeği','Aeternitas'])assert.equal(safeText(x),false,x);assert.equal(safeText('Prosperion’da vardiya bitti. #Dayanışma'),true);});
test('untrusted text is escaped before social formatting',()=>{assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');assert.equal(cleanHandle('@Çaycı İvo!'), '@cayci_ivo'.replace('_',''));});
test('apostrophes do not become numeric hashtag links',()=>{const formatted=formatSocialText("Prosperion'da #Vardiya @ada");assert.ok(!formatted.includes('/search/%2339'));assert.ok(formatted.includes("Prosperion&#39;da"));assert.ok(formatted.includes('/search/%23Vardiya'));});
test('model output rejects spoofed authors, wrong replies, duplicates, secrets, huge text',()=>{const tasks=[{handle:'@a',replyTo:'p1'},{handle:'@b',replyTo:null}];const rows=[{handle:'@evil',text:'test',replyTo:null},{handle:'@a',text:'Yanıt',replyTo:'other'},{handle:'@a',text:'Merhaba',replyTo:'p1',memory:'Tanıştık.'},{handle:'@a',text:'Yine',replyTo:'p1'},{handle:'@b',text:'Thul',replyTo:null},{handle:'@b',text:'a'.repeat(281),replyTo:null}];assert.deepEqual(validateOutputs(rows,tasks),[{handle:'@a',text:'Merhaba',replyTo:'p1',memory:'Tanıştık.'}]);});
test('topic, system, race and known relationships rank relevant NPCs',()=>{const n=npcs.find(n=>n.kullanici_adi==='@ada_fabrikakati');assert.ok(scoreNPC(n,{text:'Fabrika ücretleri ve çocuklar',system:'Prosperion',race:'İnsan',author:'@petra_tamir'})>scoreNPC(n,{text:'Yıldızlar',system:'Aerendis',race:'Ork',author:'@x'}));});
test('backup validation blocks control injection and invalid paths',()=>{assert.throws(()=>validateBackup({version:1,collections:{settings:[]}}));assert.throws(()=>validateBackup({version:1,collections:{posts:[{id:'a/b',text:'x'}]}}));assert.throws(()=>validateBackup({version:1,collections:{posts:[{id:'x',text:'ISOLDE'}]}}));assert.ok(validateBackup({version:1,collections:{posts:[{id:'x',text:'Merhaba'}]}}));});
const values=new Map();globalThis.localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};globalThis.window={addEventListener:()=>{}};
let chain=Promise.resolve();Object.defineProperty(globalThis,'navigator',{value:{locks:{request:(_,fn)=>{const r=chain.then(fn);chain=r.catch(()=>{});return r;}}},configurable:true});
const {storage,seeds}=await import('../src/storage.js');await storage.init({forceLocal:true});
test('source seed content is safe and available without AI requests',()=>{assert.ok(seeds.length>250);assert.ok(seeds.every(p=>safeText(p.text)));assert.equal(storage.settings.enabled,false);});
test('every source character has at least five historical posts',()=>{for(const n of npcs)assert.ok(seeds.filter(p=>p.author===n.kullanici_adi).length>=5,n.kullanici_adi);});
test('disabled simulation cannot reserve request usage',async()=>{assert.equal(await storage.claim('a',true),null);assert.equal(storage.usage.requests,undefined);});
test('only one concurrent tab can acquire generation lease',async()=>{await storage.saveSettings({enabled:true,apiKey:'test',maxRequests:4,maxPosts:10});const [a,b]=await Promise.all([storage.claim('a',true),storage.claim('b',true)]);assert.ok(a);assert.equal(b,null);assert.equal(storage.usage.requests,1);await storage.release(a,'test');});
test('pause invalidates in-flight output and preserves prior posts/memory',async()=>{const before=storage.getFeed().length;const c=await storage.claim('a',true);assert.ok(c);await storage.saveSettings({enabled:false});assert.equal(await storage.finish(c,[{id:'late',text:'geç',author:'@a',createdAt:1}],[],[]),false);assert.equal(storage.getFeed().length,before);await storage.release(c,'stopped');});
test('daily post budget constrains batch and memory survives pause',async()=>{await storage.saveSettings({enabled:true,maxPosts:1});const c=await storage.claim('a',true);assert.equal(c.budget,1);assert.equal(await storage.finish(c,[{id:'memorypost',text:'Yarın görüşürüz.',author:'@a',createdAt:Date.now()}],[{handle:'@a',summary:'@oyuncu ile yarın görüşecek.',recent:['Söz verdi.']}]),true);await storage.saveSettings({enabled:false});assert.ok((await storage.memory('@a')).summary.includes('@oyuncu'));await storage.saveSettings({enabled:true});assert.equal(await storage.claim('a',true),null);});
test('failed request consumes an attempt and does not retry in the interval',async()=>{await storage.saveSettings({enabled:true,maxPosts:50,maxRequests:10});const c=await storage.claim('a',true);assert.ok(c);const count=storage.usage.requests;await storage.release(c,'429');assert.equal(await storage.claim('a',false),null);assert.equal(storage.usage.requests,count);});
test('username creation, social data, tombstones and backup roundtrip',async()=>{await storage.saveUser({handle:'@player',name:'Oyuncu'},true);await assert.rejects(()=>storage.saveUser({handle:'@player',name:'Other'},true));const p=await storage.addPost({author:'@player',text:'Merhaba küme.',system:'Astarion'});await storage.toggleLike(p.id,'@other','@player');assert.ok(storage.list('likes').some(x=>x.postId===p.id));await storage.follow('@other','@player');assert.ok(storage.list('notifications').some(n=>n.kind==='takip'));await storage.addComment({author:'@other',text:'Merhaba!',postId:p.id,recipient:'@player',parentId:null});assert.ok(storage.list('comments').some(c=>c.postId===p.id));await storage.deletePost(p.id);assert.ok(!storage.getFeed().some(x=>x.id===p.id));const backup=await storage.export();assert.ok(!backup.collections.settings);assert.equal(backup.version,1);await storage.import(backup);});
test('simulation commits validated output and saves durable memory',async()=>{
 const {generate}=await import('../src/simulation.js');await storage.saveSettings({enabled:true,postsEnabled:true,repliesEnabled:false,maxRequests:20,maxPosts:50,apiKey:'test'});
 let calls=0;globalThis.fetch=async()=>{calls++;return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify([{handle:'@leontine_hessar',text:'Bugün çayımı dostlarımla içtim.',replyTo:null,memory:'Bugün dostlarıyla çay içti.'}])}]}}]})};};
 await generate(true,['@leontine_hessar']);assert.equal(calls,1);assert.ok((await storage.memory('@leontine_hessar')).summary.includes('çay'));await storage.saveSettings({enabled:false});await generate(true,['@leontine_hessar']);assert.equal(calls,1);
});
test('pause while network is pending discards output and keeps prior memory',async()=>{
 const {generate}=await import('../src/simulation.js');await storage.saveSettings({enabled:true});let started,resolveResponse;const start=new Promise(r=>started=r);globalThis.fetch=async()=>{started();return new Promise(r=>resolveResponse=r);};
 const job=generate(true,['@leontine_hessar']);await start;await storage.saveSettings({enabled:false});resolveResponse({ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify([{handle:'@leontine_hessar',text:'BU ÇIKTI YAYINLANMAMALI',replyTo:null,memory:'Yanlış hafıza.'}])}]}}]})});await job;
 assert.ok(!storage.getFeed().some(p=>p.text==='BU ÇIKTI YAYINLANMAMALI'));assert.ok((await storage.memory('@leontine_hessar')).summary.includes('çay'));
});
test('common switch closing at preflight sends zero external requests',async()=>{
 const {generate}=await import('../src/simulation.js');
 await storage.saveSettings({enabled:true,maxRequests:30});
 const original=storage.refreshSettings,before=storage.usage.requests;let calls=0;
 globalThis.fetch=async()=>{calls++;throw Error('Bu çağrı gerçekleşmemeli');};
 storage.refreshSettings=async()=>{await storage.saveSettings({enabled:false});return storage.settings;};
 try{await generate(true,['@leontine_hessar']);assert.equal(calls,0);assert.equal(storage.usage.requests,before);}
 finally{storage.refreshSettings=original;}
});
test('reopening common switch resumes generation without losing previous posts',async()=>{
 const {generate}=await import('../src/simulation.js');const before=storage.getFeed().length;
 await storage.saveSettings({enabled:true});let calls=0;
 globalThis.fetch=async()=>{calls++;return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify([{handle:'@leontine_hessar',text:'Çay masasında sohbet kaldığı yerden sürüyor.',replyTo:null,memory:'Dostlarıyla çay sohbetine devam etti.'}])}]}}]})};};
 const result=await generate(true,['@leontine_hessar']);assert.equal(result.status,'completed');assert.equal(calls,1);assert.equal(storage.getFeed().length,before+1);
});
test('100 reaction choices are unique and never self-likes',()=>{
 const posts=npcs.slice(0,20).map(n=>({id:'sample-'+n.id,author:n.kullanici_adi,system:n.sistem,text:n.bio}));
 const chosen=chooseReactions(posts,npcs,100);assert.equal(chosen.length,100);assert.equal(new Set(chosen.map(p=>p.postId+':'+p.author)).size,100);
 for(const p of chosen)assert.notEqual(p.author,posts.find(x=>x.id===p.postId).author);
});
test('one external request can publish 50 texts without recursively enqueueing NPC replies',async()=>{
 const {generate}=await import('../src/simulation.js');
 await storage.saveSettings({enabled:true,postsEnabled:true,repliesEnabled:false,batchSize:50,likesPerTurn:100,maxRequests:48,maxPosts:2400});
 const before=storage.getFeed().length,queued=storage.list('queue').length;let calls=0;
 globalThis.fetch=async()=>{calls++;return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(npcs.slice(0,50).map(n=>({handle:n.kullanici_adi,text:`Günlük ağ notu ${n.id}: vardiya bitti, çay hazır.`,replyTo:null,memory:'Vardiya sonrası çay içti.'})))}]}}]})};};
 const result=await generate(true,npcs.slice(0,50).map(n=>n.kullanici_adi));assert.equal(calls,1);assert.equal(result.generated,50);assert.ok(result.likes<=100);assert.equal(storage.getFeed().length,before+50);assert.equal(storage.list('queue').length,queued);
 await storage.saveSettings({enabled:false});const liked=storage.list('likes').length;
 assert.equal(await storage.addReactions({token:storage.usage.token,revision:storage.settings.revision},[{postId:'off-test',author:'@a',recipient:'@b'}]),0);assert.equal(storage.list('likes').length,liked);
});
test('scheduler jitter does not accidentally turn a half-hour schedule into hourly work',async()=>{
 await storage.saveSettings({enabled:true,intervalMinutes:30,maxRequests:48,maxPosts:2400});
 const saved=JSON.parse(values.get('qorves-social-v1'));saved.control.until=0;saved.control.lastAttempt=Date.now()-29.5*60000;values.set('qorves-social-v1',JSON.stringify(saved));
 assert.equal(await storage.claim('browser',false),null);
 const claim=await storage.claim('cloud',false,90000);assert.ok(claim);await storage.release(claim,'jitter test',true);
});
test('planned posts have varied times and reactions follow their target posts',()=>{
 let r=0;const posts=Array.from({length:50},(_,i)=>({id:'planned-'+i,author:'@a'+i,text:'Günlük not.'}));
 const likes=posts.map(p=>({postId:p.id,author:'@reader',recipient:p.author}));
 const planned=planPublications(posts,[],likes,{},1000,30,()=>((r++%97)+1)/100);
 assert.equal(planned.length,100);assert.ok(new Set(planned.map(p=>p.dueAt)).size>40);
 for(const item of planned){assert.ok(item.dueAt>=1000&&item.dueAt<=1000+1800000);if(item.type==='like')assert.ok(item.dueAt>=planned.find(p=>p.type==='post'&&p.body.id===item.body.postId).dueAt);}
});
test('pause shifts unpublished content forward instead of dumping it all on resume',()=>{
 const initial={enabled:true,totalPausedMs:0,revision:1};const paused=mergeSimulationSettings(initial,{enabled:false},1000);const resumed=mergeSimulationSettings(paused,{enabled:true},61000);
 assert.equal(resumed.totalPausedMs,60000);assert.equal(effectiveDue({dueAt:5000,pauseOffset:0},resumed),65000);
});
test('frequent cloud wake-ups cannot spend extra AI requests',()=>{
 const settings={enabled:true,intervalMinutes:30,maxRequests:48,maxPosts:2400};const control={day:'today',requests:5,posts:200,lastAttempt:1000000};
 assert.equal(cloudTurnDue(settings,control,1000000+300000,'today'),false);assert.equal(cloudTurnDue(settings,control,1000000+1800000,'today'),true);assert.equal(cloudTurnDue({...settings,enabled:false},control,99999999,'today'),false);assert.equal(cloudTurnDue(settings,{...control,requests:48},99999999,'today'),false);
});
test('queued content stays hidden while closed and publishes later without another API call',async()=>{
 await storage.saveSettings({enabled:true,maxRequests:48,maxPosts:2400});const claim=await storage.claim('paced',true);assert.ok(claim);
 const before=storage.getFeed().length;const p={id:'queued-proof',author:'@leontine_hessar',text:'Çaydan sonra görüşelim.',system:'Astarion',createdAt:Date.now()};
 assert.equal(await storage.stageTurn(claim,[p],[],[],[],30),true);assert.equal(storage.getFeed().length,before);
 await storage.saveSettings({enabled:false});assert.equal((await storage.flushDuePublications(Date.now()+3600000)).texts,0);assert.equal(storage.getFeed().length,before);
 await storage.saveSettings({enabled:true});assert.equal((await storage.flushDuePublications(Date.now()+3600000)).texts,1);assert.equal(storage.getFeed().length,before+1);assert.equal((await storage.flushDuePublications(Date.now()+3600000)).texts,0);
});


import {imageContext} from '../src/vision.js';
import {compactPublications} from '../src/publication.js';
test('image context includes actual bytes once per parent and never fetches external URLs',()=>{
 const feed=[{id:'p',image:'data:image/jpeg;base64,YWJj'},{id:'remote',image:'https://untrusted.example/image.jpg'}];
 const parts=imageContext([{target:{postId:'p'}},{target:{postId:'p'}},{target:{postId:'remote'}}],feed);
 assert.equal(parts.length,2);assert.equal(parts[1].inlineData.data,'YWJj');assert.equal(parts[1].inlineData.mimeType,'image/jpeg');assert.ok(parts[0].text.includes('p'));
});
test('reaction queue is compact enough for Firebase free writes',()=>{
 const posts=Array.from({length:50},(_,i)=>({id:'budget'+i,author:'@x',text:'Merhaba'}));const pairs=Array.from({length:100},(_,i)=>({postId:posts[i%50].id,author:'@n'+i}));
 const raw=planPublications(posts,[],pairs,{},Date.now(),30),small=compactPublications(raw);assert.ok(small.length<=57);assert.equal(small.filter(x=>x.type==='likes').reduce((n,x)=>n+x.body.items.length,0),100);
});

import {repetitive,socialAngle} from '../src/social-life.js';
import {unreadNotifications,typingVisible,shuffleSuggestions} from '../src/inbox.js';
test('cloned posts are rejected without forcing unrelated topics or extra generation calls',()=>{
 assert.equal(repetitive('Bugün limanda vardiya yine bitti, çayımı içtim.', ['Bugün limanda vardiya yine bitti, çayımı içtim. #Liman']),true);
 assert.equal(repetitive('Bu şarkının nakaratını unutamıyorum.', ['Bugün limanda vardiya yine bitti, çayımı içtim.']),false);
 assert.notEqual(socialAngle('@ada',0),socialAngle('@ada',1800000));
});
test('unread notifications merge private messages without leaking other accounts',()=>{
 const n=unreadNotifications([{id:'1',recipient:'@me',createdAt:1},{id:'2',recipient:'@other',createdAt:4}],[{id:'dm:x',createdAt:3}], '@me');assert.deepEqual(n.map(x=>x.id),['dm:x','1']);assert.equal(n[0].source,'private');assert.equal(n[0].kind,'mesaj');
 assert.equal(typingVisible(60000,49999),false);assert.equal(typingVisible(60000,50000),true);assert.equal(typingVisible(60000,60000),false);
});
test('suggestions shuffle once from all accounts and retain unique candidates',()=>{
 const picks=shuffleSuggestions(['a','b','c','d'],()=>0);assert.equal(new Set(picks).size,4);assert.notDeepEqual(picks,['a','b','c','d']);
});
test('notifications stay read across storage roundtrips',async()=>{
 await storage.notify('@reader','@sender','beğeni','notice-post');const notice=storage.list('notifications').find(n=>n.recipient==='@reader');assert.ok(!notice.readAt);await storage.readNotifications([notice.id]);assert.ok(storage.list('notifications').find(n=>n.id===notice.id).readAt>0);
});
test('NPC follows require an explicit justified decision, shared switch and daily relationship cooldown',async()=>{
 await storage.saveSettings({enabled:true,apiKey:'test',maxRequests:100,maxPosts:10000});const claim=await storage.claim('relations',true);assert.ok(claim);const author=npcs[0].kullanici_adi,target='@relationship_player';
 assert.equal(await storage.updateRelationships(claim,[{author,target,action:'follow',reason:''}]),0);assert.equal(await storage.updateRelationships(claim,[{author,target,action:'follow',reason:'Ortak bir konu hakkında görüşlerini ilginç buldu.'}]),1);assert.ok(await storage.relationship(author,target));
 assert.equal(await storage.updateRelationships(claim,[{author,target,action:'unfollow',reason:'Hemen vazgeçti.'}]),0);await storage.saveSettings({enabled:false});assert.equal(await storage.updateRelationships(claim,[{author,target:'@another',action:'follow',reason:'İlgisini çekti.'}]),0);await storage.release(claim,'test');
});
