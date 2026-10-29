import test from 'node:test';
import assert from 'node:assert/strict';
import {settingsCommit,writeSharedSettings} from '../src/shared-settings.js';
test('shared stop/start writes without a quota-limited read and preserves unrelated settings',async()=>{
 let calls=0;const current={enabled:true,revision:7,totalPausedMs:100,model:'keep',muted:['@a']};
 const stopped=await writeSharedSettings('test','private-token',current,{enabled:false},{now:1000,fetcher:async(url,o)=>{
  calls++;assert.ok(url.endsWith(':commit'));assert.equal(o.method,'POST');
  const w=JSON.parse(o.body).writes[0];assert.deepEqual(w.updateMask.fieldPaths,['enabled','pauseStartedAt']);assert.equal(w.update.fields.enabled.booleanValue,false);assert.equal(w.update.fields.pauseStartedAt.integerValue,'1000');assert.equal(w.updateTransforms[0].increment.integerValue,'1');
  return Response.json({writeResults:[{transformResults:[{integerValue:'8'}]}]});
 }});
 assert.equal(calls,1);assert.equal(stopped.enabled,false);assert.equal(stopped.model,'keep');assert.equal(stopped.revision,8);
 const resume=settingsCommit('test',stopped,{enabled:true},2500).writes[0];assert.equal(resume.updateTransforms[1].fieldPath,'totalPausedMs');assert.equal(resume.updateTransforms[1].increment.integerValue,'1500');assert.equal(resume.update.fields.pauseStartedAt.integerValue,'0');
});
test('a quota refusal returns a clear error instead of retrying indefinitely or pretending success',async()=>{
 let calls=0;await assert.rejects(writeSharedSettings('test','token',{enabled:true},{enabled:false},{fetcher:async()=>{calls++;return Response.json({error:{status:'RESOURCE_EXHAUSTED'}},{status:429});}}),/kota/);assert.equal(calls,1);
});

test('shared storage failures explain the actual refusal instead of an opaque status number',async()=>{
 await assert.rejects(writeSharedSettings('test','token',{enabled:true},{enabled:false},{fetcher:async()=>Response.json({error:'Ortak veri servisi kullanılamıyor.'},{status:503})}),/Ortak veri servisi kullanılamıyor/);
});
