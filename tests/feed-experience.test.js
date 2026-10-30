import test from 'node:test';
import assert from 'node:assert/strict';
import {createSeenHistory,freshFeed,keepVisibleOrder} from '../src/feed-seen.js';
import {insertEmoji,findEmojis} from '../src/emoji.js';
import {expandLikes} from '../src/likes.js';
test('seen posts survive reload, isolate accounts and retain only the current visible reading session',()=>{
 const data=new Map(),store={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},now=Date.now(),history=createSeenHistory(store);history.use('@one');history.mark('old',now);history.mark('current',now);
 const posts=[{id:'old'},{id:'current'},{id:'new'},{id:'liked'}];
 assert.deepEqual(freshFeed(posts,{seen:history,visible:new Set(['current']),liked:new Set(['liked'])}).map(p=>p.id),['current','new']);
 const reopened=createSeenHistory(store);reopened.use('@one');assert.ok(reopened.has('old'));assert.deepEqual(freshFeed(posts,{seen:reopened,liked:new Set(['liked'])}).map(p=>p.id),['new']);reopened.use('@two');assert.ok(!reopened.has('old'));reopened.use('@one');assert.ok(reopened.has('old'));
 assert.equal(freshFeed([{id:'liked'}],{seen:history,liked:new Set(['liked']),visible:new Set(['liked'])}).length,0);
 assert.equal(freshFeed([{id:'liked'}],{seen:history,liked:new Set(['liked']),visible:new Set(['liked']),retainedLiked:new Set(['liked'])}).length,1);
});
test('seen upload acknowledges only its own batch and merges remote history',()=>{
 const h=createSeenHistory({getItem:()=>null,setItem:()=>{}});h.use('@one');h.mark('first');const b=h.batch();h.mark('second');h.ack(b);assert.deepEqual(h.batch().map(x=>x.id),['second']);h.merge([{post_id:'remote',seen:Date.now()}]);assert.ok(h.has('remote'));
});
test('emoji insertion preserves caret selection, Turkish text and message size limits',()=>{
 const r=insertEmoji('Selam dostum',6,12,'❤️');assert.equal(r.value,'Selam ❤️');assert.equal(r.caret,8);assert.equal(r.inserted,true);
 assert.equal(insertEmoji('abc',1,1,'😀',4).inserted,false);assert.equal(insertEmoji('a😀b',3,3,'✨').value,'a😀✨b');assert.ok(findEmojis('kahkaha').some(([emoji])=>emoji==='😂'));assert.ok(findEmojis('öpücük').some(([emoji])=>emoji==='😘'));
});
test('comment likes remain distinct from post likes for the same author and carry their parent thread',()=>{
 const likes=expandLikes([{postId:'post',author:'@one',createdAt:1},{postId:'comment:reply',commentId:'reply',parentPostId:'post',author:'@one',createdAt:2}]);assert.equal(likes.length,2);assert.equal(likes.find(l=>l.commentId)?.parentPostId,'post');assert.notEqual(likes[0].id,likes[1].id);
});

test('reposts of the same original do not repeat a seen or duplicated recommendation',()=>{
 const h={has:id=>id==='seen'};assert.equal(freshFeed([{id:'r1',repostOf:'seen'}],{seen:h}).length,0);
 assert.equal(freshFeed([{id:'r1',repostOf:'p'},{id:'r2',repostOf:'p'},{id:'p'}],{seen:h}).length,1);
});

test('background recommendations never lift an already visible post above what the player is reading',()=>{
 const ranked=[{id:'b',createdAt:1},{id:'a',createdAt:1},{id:'c',createdAt:1}];assert.deepEqual(keepVisibleOrder(ranked,['a','b'],10).map(p=>p.id),['a','b','c']);
 assert.deepEqual(keepVisibleOrder([{id:'new',createdAt:20},...ranked],['a','b'],10).map(p=>p.id),['new','a','b','c']);
});
