import test from 'node:test';
import assert from 'node:assert/strict';
import {createOptimisticActions} from '../src/optimistic.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const intent=(job,wanted=true)=>({collection:'likes',project:rows=>[...rows.filter(r=>r.id!=='heart'),...(wanted?[{id:'heart'}]:[])],confirmed:rows=>rows.some(r=>r.id==='heart')===wanted,save:()=>job.promise});
test('a click is immediately visible and repeated pending clicks share one write',async()=>{
 const model=createOptimisticActions(),job=deferred();let calls=0;const options={...intent(job),save:()=>{calls++;return job.promise;}};
 const first=model.run('like:p',options),second=model.run('like:p',options);assert.equal(first,second);assert.equal(model.busy('like:p'),true);assert.equal(model.project('likes',[]).length,1);
 await Promise.resolve();assert.equal(calls,1);job.resolve();await first;assert.equal(model.busy('like:p'),false);assert.equal(model.project('likes',[]).length,1);
 assert.equal(model.project('likes',[{id:'heart'}]).length,1);assert.deepEqual(model.project('likes',[]),[]);
});
test('failed saves restore the real count and never pretend the reaction was saved',async()=>{
 const model=createOptimisticActions(),job=deferred(),saved=model.run('like:p',intent(job));assert.equal(model.project('likes',[]).length,1);
 job.reject(Error('offline'));await assert.rejects(saved,/offline/);assert.deepEqual(model.project('likes',[]),[]);assert.equal(model.busy('like:p'),false);
});
test('failed undo restores the earlier confirmed intent while unrelated live rows survive',async()=>{
 const model=createOptimisticActions(),one=deferred();const add=model.run('like:p',intent(one));one.resolve();await add;
 const two=deferred(),undo=model.run('like:p',intent(two,false));assert.deepEqual(model.project('likes',[{id:'other'}]),[{id:'other'}]);two.reject(Error('offline'));await assert.rejects(undo);
 assert.deepEqual(model.project('likes',[{id:'other'}]),[{id:'other'},{id:'heart'}]);assert.deepEqual(model.project('follows',[{id:'other'}]),[{id:'other'}]);
});
