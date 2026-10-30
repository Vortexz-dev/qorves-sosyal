import test from 'node:test';
import assert from 'node:assert/strict';
import {openCloudStore} from '../scripts/cloud-store.mjs';
test('cloud wake uses the common write fence even while Firebase reads are preferred',async()=>{
 const token=()=>'',store={},state={active:true,provider:'firebase'};
 assert.equal(await openCloudStore(token,{call:async()=>state,common:(t,s)=>{assert.equal(t,token);assert.equal(s,state);return store;},legacy:()=>assert.fail('direct Firebase writes forbidden')}),store);
});
test('cloud wake does not bypass an unavailable, copying or paused common store',async()=>{
 for(const state of [{phase:'copying'},{active:true,emergencyPaused:true}])assert.equal(await openCloudStore(()=>'',{call:async()=>state,legacy:()=>assert.fail(),common:()=>assert.fail()}),null);
 await assert.rejects(openCloudStore(()=>'',{call:async()=>{throw Error('offline');},legacy:()=>assert.fail()}),/offline/);
});
test('pre-migration cloud wake retains the legacy store',async()=>{const store={};assert.equal(await openCloudStore(()=>'',{call:async()=>({active:false,phase:'idle'}),legacy:async()=>store}),store);});
