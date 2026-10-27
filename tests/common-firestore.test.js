import test from 'node:test';
import assert from 'node:assert/strict';
import {createCommonFirestore} from '../src/common-firestore.js';
const prefix='projects/qorves-sosyal/databases/(default)/documents/';
const wire=(id,text,version='v1')=>({name:prefix+'posts/'+id,updateTime:version,fields:{text:{stringValue:text},createdAt:{integerValue:'123'}}});

test('shared SDK paginates without dropping old rows and keeps snapshot identities',async()=>{
 const original=globalThis.fetch,calls=[];globalThis.fetch=async(url,o)=>{const q=JSON.parse(o.body).structuredQuery;calls.push(q);const offset=q.startAfter?100:0;return Response.json({documents:Array.from({length:offset?2:100},(_,i)=>({document:wire(String(offset+i),'row '+(offset+i))})),cursor:4});};
 const fs=createCommonFirestore(async()=> 'local-test-token',{cursor:4});try{const q=fs.query(fs.collection({},'posts'),fs.limit(102)),snap=await fs.getDocs(q);assert.equal(snap.docs.length,102);assert.equal(new Set(snap.docs.map(d=>d.id)).size,102);assert.equal(snap.docs.at(-1).data().text,'row 101');assert.equal(calls.length,2);assert.equal(calls[1].startAfter.id,'99');}finally{fs.stop();globalThis.fetch=original;}
});
test('shared SDK retries a conflicted transaction with fresh reads and sends read preconditions',async()=>{
 const original=globalThis.fetch;let reads=0,commits=0,runs=0;globalThis.fetch=async(url,o)=>{if(url.endsWith('/read'))return Response.json({document:wire('p','before','v'+(++reads))});if(url.endsWith('/changes'))return Response.json({changes:[],cursor:0});const b=JSON.parse(o.body);commits++;assert.ok(b.requestId);assert.equal(b.writes[0].currentDocument.updateTime,'v'+reads);return commits===1?Response.json({error:'conflict'},{status:409}):Response.json({writeResults:[{updateTime:'v3'}]});};
 const fs=createCommonFirestore(async()=> 'local-test-token',{});try{const r=fs.doc({},'posts','p');await fs.runTransaction({},async tx=>{runs++;const old=await tx.get(r);assert.equal(old.data().text,'before');tx.set(r,{text:'after'});});assert.equal(runs,2);assert.equal(reads,2);assert.equal(commits,2);}finally{fs.stop();globalThis.fetch=original;}
});
test('shared SDK preserves physical deletions in its local cache',async()=>{
 const original=globalThis.fetch;let deleted=false,resolveRemoved;const removed=new Promise(resolve=>resolveRemoved=resolve);globalThis.fetch=async(url,o)=>{if(url.endsWith('/query'))return Response.json({documents:[{document:wire('p','visible')}],cursor:0});if(url.endsWith('/changes'))return Response.json({changes:deleted?[{seq:1,collection:'posts',id:'p',document:null}]:[],cursor:deleted?1:0});deleted=true;return Response.json({writeResults:[]});};
 const fs=createCommonFirestore(async()=> 'local-test-token',{});try{await new Promise(resolve=>{fs.onSnapshot(fs.collection({},'posts'),snap=>{if(!snap.docs.length)resolveRemoved();else resolve();});});await fs.deleteDoc(fs.doc({},'posts','p'));await removed;}finally{fs.stop();globalThis.fetch=original;}
});


test('the shared SDK respects the server page size for photo-heavy profiles',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async(url,o)=>{const q=JSON.parse(o.body).structuredQuery,offset=q.startAfter?Number(q.startAfter.id)+1:0,length=Math.min(25,51-offset);calls++;return Response.json({documents:Array.from({length},(_,i)=>({document:wire(String(offset+i),'photo '+(offset+i))})),pageLimit:25,cursor:0});};
 const fs=createCommonFirestore(async()=> 'local-test-token',{});try{const rows=await fs.getDocs(fs.collection({},'posts'));assert.equal(rows.docs.length,51);assert.equal(calls,3);}finally{fs.stop();globalThis.fetch=original;}
});
