import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
const bundle=readFileSync(new URL('../research/google-clock/Code.gs',import.meta.url),'utf8');
const enc=v=>v===null?{nullValue:null}:typeof v==='string'?{stringValue:v}:typeof v==='boolean'?{booleanValue:v}:typeof v==='number'?{integerValue:String(v)}:Array.isArray(v)?{arrayValue:{values:v.map(enc)}}:{mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,enc(x)]))}};
const dec=v=>'stringValue'in v?v.stringValue:'integerValue'in v?Number(v.integerValue):'booleanValue'in v?v.booleanValue:'nullValue'in v?null:'arrayValue'in v?(v.arrayValue.values||[]).map(dec):Object.fromEntries(Object.entries(v.mapValue.fields).map(([k,x])=>[k,dec(x)]));
const prefix='projects/qorves-sosyal/databases/(default)/documents/';
function fixture({paused=false,pauseInModel=false,claimConflict=false}={}){
 const docs=new Map([['settings/simulation',{enabled:!paused,revision:1,postsEnabled:true,repliesEnabled:false,model:'gemini-3.5-flash-lite',maxRequests:1,maxPosts:50,batchSize:1,likesPerTurn:2,intervalMinutes:30,muted:[]}],['control/simulation',{}]]);let calls=0,conflicted=false;
 const document=key=>docs.has(key)?{name:prefix+key,updateTime:JSON.stringify(docs.get(key)),fields:enc(docs.get(key)).mapValue.fields}:null;
 function respond(data,status=200){return {getResponseCode:()=>status,getContentText:()=>JSON.stringify(data)};}
 const context=vm.createContext({console:{log(){},error(){}},Utilities:{getUuid:randomUUID,sleep(){},base64Decode:s=>[...Buffer.from(s,'base64')],newBlob:bytes=>({getDataAsString:()=>Buffer.from(bytes).toString('utf8')})},PropertiesService:{getScriptProperties:()=>({getProperty:key=>key==='FIREBASE_SERVICE_UID'?'service-test':null,setProperties(){}})},CacheService:{getScriptCache:()=>({get:()=> 'firebase-test-token',put(){}})},UrlFetchApp:{fetch(url,o={}){
  let body=o.payload?JSON.parse(o.payload):{};
  if(url.endsWith('/api/v1/clock/model')){body=body.payload;calls++;if(pauseInModel)docs.set('settings/simulation',{...docs.get('settings/simulation'),enabled:false,revision:2});const prompt=body.contents[0].parts[0].text,tasks=JSON.parse(prompt.match(/GÖREVLER: (.+)\n/)[1]);return respond({candidates:[{content:{parts:[{text:JSON.stringify(tasks.map(t=>({handle:t.handle,text:'Bu reklamı kapatmanın bir yolunu bulan var mı?',replyTo:t.replyTo,memory:'Reklamlardan şikâyet etti.'})))}]}}]});}
  if(url.endsWith('/api/v1/common/sync'))return respond({active:false,phase:'waiting'});
  if(url.endsWith('/api/v1/tick'))return respond({published:0});
  if(url.endsWith(':beginTransaction'))throw Error('beginTransaction is not available for Firebase ID credentials');
  if(url.endsWith(':rollback'))return respond({});
  if(url.endsWith(':batchGet'))return respond(body.documents.map(name=>{const d=document(name.slice(prefix.length));return d?{found:d}:{missing:name};}));
  if(url.endsWith(':commit')){if(claimConflict&&!conflicted&&body.writes.some(w=>w.update?.fields?.requests)){conflicted=true;docs.set('settings/simulation',{...docs.get('settings/simulation'),enabled:false,revision:2});}for(const w of body.writes){const key=(w.update?.name||w.delete||w.verify).slice(prefix.length),v=w.currentDocument;if(v&&(('updateTime'in v&&v.updateTime!==JSON.stringify(docs.get(key)))||('exists'in v&&v.exists!==docs.has(key))))return respond({},412);}for(const w of body.writes){if(w.verify)continue;if(w.delete)docs.delete(w.delete.slice(prefix.length));else docs.set(w.update.name.slice(prefix.length),Object.fromEntries(Object.entries(w.update.fields).map(([k,v])=>[k,dec(v)])));}return respond({});}
  if(url.endsWith(':runQuery')){const q=body.structuredQuery,collection=q.from[0].collectionId;let rows=[...docs].filter(([k])=>k.startsWith(collection+'/'));if(q.where){const f=q.where.fieldFilter,v=dec(f.value);rows=rows.filter(([,d])=>f.op==='EQUAL'?d[f.field.fieldPath]===v:d[f.field.fieldPath]!==undefined&&d[f.field.fieldPath]<=v);}if(q.orderBy)rows.sort((a,b)=>(b[1][q.orderBy[0].field.fieldPath]||0)-(a[1][q.orderBy[0].field.fieldPath]||0));return respond(rows.slice(0,q.limit).map(([k])=>({document:document(k)})));}
  const key=decodeURIComponent(url.split('/documents/')[1]||'');return docs.has(key)?respond(document(key)):respond({},404);
 }}});
 vm.runInContext(bundle,context);return {docs,get calls(){return calls;},run:auto=>vm.runInContext(`QorvesClockCore.runClock(${auto})`,context)};
}
test('Google timer uses the same daily budget and publishes queued work without a second model call',async()=>{
 const f=fixture(),first=await f.run(true);assert.equal(first.result.status,'scheduled');assert.equal(f.calls,1);assert.equal(f.docs.get('control/simulation').requests,1);assert.ok(f.docs.get('control/simulation').lastScheduledWake>0);
 for(const [key,d]of f.docs)if(d.kind==='publication'){d.dueAt=Date.now()-10;if(d.type==='likes')for(const item of d.body.items)item.dueAt=Date.now()-10;}
 const next=await f.run(true);assert.equal(next.result.status,'publishing-only');assert.equal(f.calls,1);assert.equal(f.docs.get('control/simulation').pending,0);assert.equal([...f.docs.keys()].filter(k=>k.startsWith('posts/')).length,1);
});
test('paused Google timer never calls a model and manual tests do not claim an automatic wake',async()=>{
 const f=fixture({paused:true}),result=await f.run(false);assert.equal(result.status,'paused');assert.equal(f.calls,0);assert.equal(f.docs.get('control/simulation').lastScheduledWake,undefined);assert.equal(f.docs.get('control/simulation').clockTrigger,'google_manual');
});
test('pause during Google model generation discards output and retains request accounting',async()=>{
 const f=fixture({pauseInModel:true}),result=await f.run(true);assert.equal(result.result.status,'discarded');assert.equal(f.calls,1);assert.equal(f.docs.get('control/simulation').requests,1);assert.equal([...f.docs.values()].filter(d=>d.kind==='publication').length,0);
});

test('a switch change between claim read and commit rejects stale versions and retries without calling AI',async()=>{const f=fixture({claimConflict:true});await f.run(true);assert.equal(f.calls,0);assert.equal(f.docs.get('control/simulation').requests||0,0);});


test('a queued response to a blocked player is discarded at actual publication time',async()=>{
 const f=fixture(),now=Date.now();f.docs.set('settings/simulation',{...f.docs.get('settings/simulation'),maxRequests:0});f.docs.set('users/alice',{handle:'@alice',blockedAccounts:['@blocked']});f.docs.set('control/simulation',{pending:1});
 f.docs.set('memories/blocked-publication',{id:'blocked-publication',kind:'publication',type:'comment',dueAt:now-1000,pauseOffset:0,body:{id:'blocked-comment',author:'@blocked',recipient:'@alice',postOwner:'@alice',postId:'p',text:'Gorunmemeli.'}});
 await f.run(true);assert.equal(f.calls,0);assert.ok(!f.docs.has('comments/blocked-comment'));assert.ok(!f.docs.has('memories/blocked-publication'));assert.equal(f.docs.get('control/simulation').pending,0);
});
