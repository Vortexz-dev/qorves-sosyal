import test from 'node:test';
import assert from 'node:assert/strict';
import {flattenThread} from '../src/threads.js';
import {isBlocked,canSee} from '../src/social-visibility.js';
test('all six replies appear including deep, orphaned and cyclic comments',()=>{const rows=[{id:'1',parentId:null},{id:'2',parentId:'1'},{id:'3',parentId:'2'},{id:'4',parentId:'deleted'},{id:'5',parentId:'6'},{id:'6',parentId:'5'}];const visible=flattenThread(rows);assert.equal(visible.length,6);assert.equal(new Set(visible.map(r=>r.comment.id)).size,6);assert.equal(visible.find(r=>r.comment.id==='3').depth,2);});
test('blocking an old profile name excludes the revised identity from the player post context',()=>{const users=[{handle:'@player',blockedAccounts:['@leontine_hessar']}];assert.equal(isBlocked(users,'@player','@leontine.h'),true);assert.equal(canSee(users,'@leontine.h',{author:'@player'}),false);assert.equal(canSee(users,'@nella_borucu',{author:'@player'}),true);});
