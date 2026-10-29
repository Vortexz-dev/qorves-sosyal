import test from 'node:test';
import assert from 'node:assert/strict';
import {createAccountVault} from '../src/account-vault.js';
import {markAllRead} from '../src/read-all.js';
function vault(){const rows=new Map(),io={get:async k=>structuredClone(rows.get(k)),put:async(k,v)=>{rows.set(k,structuredClone(v));},all:async()=>[...rows.values()].map(v=>structuredClone(v)),remove:async k=>rows.delete(k)};return {rows,api:createAccountVault(io),io};}
test('saved accounts survive reopening with encrypted credentials and non-extractable keys',async()=>{
 const {api,rows,io}=vault();await api.remember({handle:'@one',name:'One',passwordHash:'not-metadata'},'private-password');
 const record=rows.get('@one');assert.equal(record.secretKey.extractable,false);assert.ok(!JSON.stringify(record).includes('private-password'));assert.equal(record.passwordHash,undefined);
 assert.deepEqual(await api.list(),[{handle:'@one',name:'One',avatar:'',ready:true}]);assert.equal(await createAccountVault(io).password('@one'),'private-password');
 await api.profile({handle:'@one',name:'Updated'});assert.equal(await api.password('@one'),'private-password');await api.remove('@one');assert.deepEqual(await api.list(),[]);
});
test('multiple accounts keep independent keys and cannot substitute another identity ciphertext',async()=>{
 const {api,rows}=vault();await Promise.all([api.remember({handle:'@one'},'first'),api.remember({handle:'@two'},'second')]);assert.equal(await api.password('@one'),'first');assert.equal(await api.password('@two'),'second');
 const swapped=rows.get('@one');rows.set('@two',{...swapped,handle:'@two'});await assert.rejects(api.password('@two'));
});
test('an existing profile without credentials requests one explicit sign-in',async()=>{const {api}=vault();await api.profile({handle:'@one'});assert.equal((await api.list())[0].ready,false);await assert.rejects(api.password('@one'),/bir kez giriş/);});
test('mark all attempts both independent channels even if public storage fails',async()=>{
 let privateCalls=0;const result=await markAllRead({publicIds:['n1'],privateUnread:true,writePublic:async()=>{throw Error('storage offline');},writePrivate:async()=>{privateCalls++;}});
 assert.equal(result.public.ok,false);assert.equal(result.private.ok,true);assert.equal(privateCalls,1);
});
test('public notifications succeed without an unlocked private inbox and empty operations send nothing',async()=>{
 let calls=0;assert.deepEqual(await markAllRead({publicIds:[],privateUnread:false,writePublic:()=>calls++,writePrivate:()=>calls++}),{});
 const result=await markAllRead({publicIds:['one'],privateUnread:false,writePublic:async ids=>{assert.deepEqual(ids,['one']);calls++;},writePrivate:()=>{throw Error('locked');}});assert.equal(calls,1);assert.equal(result.public.ok,true);assert.equal(result.private,undefined);
});
