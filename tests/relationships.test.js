import test from 'node:test';
import assert from 'node:assert/strict';
import {followAccounts,messageReceipt} from '../src/relationships.js';
import {canonicalHandle} from '../src/profiles.js';
import aliases from '../src/data/profile-aliases.json' with {type:'json'};
test('profile lists preserve direction and deduplicate revised account identities',()=>{
 const [old,updated]=Object.entries(aliases)[0],rows=[{author:'@player',target:old},{author:'@player',target:updated},{author:'@other',target:'@player'},{author:'@player',target:'@player'}];
 assert.deepEqual(followAccounts(rows,'@player','following'),[canonicalHandle(updated)]);assert.deepEqual(followAccounts(rows,'@player','followers'),['@other']);assert.deepEqual(followAccounts(rows,updated,'followers'),['@player']);
});
test('intentional unread and failed processing are distinct without inventing a seen receipt',()=>{
 assert.deepEqual(messageReceipt({state:'sent',readAt:0}),{label:'İletildi',retry:false});
 assert.deepEqual(messageReceipt({state:'failed',readAt:0}),{label:'Hatta kesinti',retry:true});
 assert.deepEqual(messageReceipt({state:'quota',readAt:0}),{label:'Hat yoğun',retry:true});
 assert.deepEqual(messageReceipt({state:'sent',readAt:100},99),{label:'İletildi',retry:false});assert.equal(messageReceipt({state:'sent',readAt:100},100).label,'Görüldü');
});
