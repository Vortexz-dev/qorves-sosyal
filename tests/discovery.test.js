import test from 'node:test';
import assert from 'node:assert/strict';
import {accountTags,tasteProfile,rankFeed,inSystem} from '../src/discovery.js';
import {groupDialog,groupPage} from '../src/group-ui.js';
const people={a:{yas:23,system:'A',job:'Müzisyen',paylasim_konulari:'müzik konser'},b:{yas:24,system:'B',job:'Müzisyen',paylasim_konulari:'müzik konser'},c:{yas:40,system:'C',job:'Madenci',paylasim_konulari:'maden işçi'}};
test('taste follows actual likes, age ranges and interests without inventing gender',()=>{
 const posts=[{id:'old',author:'a',createdAt:1}],profile=tasteProfile([{author:'me',postId:'old',createdAt:100}], 'me',posts,h=>people[h],100);
 assert.ok(accountTags(people.a).includes('age:18-25'));assert.ok(!accountTags(people.a).some(t=>t.startsWith('gender:')));assert.ok(accountTags({kullanici_adi:'@fiction',avatar_tarifi:'24 yaşında insan kadın'}).includes('gender:kadin'));assert.ok(!accountTags({avatar_tarifi:'kadın'}).some(t=>t.startsWith('gender:')));
 const result=rankFeed([{id:'other',author:'c',createdAt:100},{id:'similar',author:'b',createdAt:100}],profile,h=>people[h],100);assert.equal(result[0].id,'similar');
 const unlike=tasteProfile([], 'me',posts,h=>people[h]);assert.equal(unlike.count,0);
});
test('personal ranking retains every post once and keeps discovery slots and system boundary',()=>{
 const posts=Array.from({length:30},(_,i)=>({id:String(i),author:i%2?'b':'c',system:i%2?'A':'B',createdAt:1000-i}));
 const t=tasteProfile([{author:'me',postId:'1',createdAt:1000}], 'me',posts,h=>people[h],1000),ranked=rankFeed(posts,t,h=>people[h],1000);
 assert.equal(new Set(ranked.map(p=>p.id)).size,30);assert.equal(ranked[4].id,'0');assert.ok(posts.filter(p=>inSystem(p,'A')).every(p=>p.system==='A'));assert.equal(posts.filter(p=>inSystem(p,'')).length,30);
});
test('private group renderer escapes names and messages and only renders supplied membership',()=>{
 const dialog=groupDialog([{name:'<script>',handle:'@abc',system:'A'}],new Set(['@abc']),'');assert.ok(!dialog.includes('<script>'));assert.ok(dialog.includes('&lt;script&gt;'));
 const html=groupPage({data:{group:{name:'<X>',members:[{handle:'@abc',leftAt:0}]},messages:[{id:'1',sender:'@abc',text:'<img onerror=bad>',createdAt:1}],typing:[]},groups:[],id:'g-id',owner:'@me',person:h=>({name:h}),busy:false,error:'',image:'',icon:()=>''});assert.ok(html.includes('&lt;img onerror=bad&gt;'));assert.ok(!html.includes('<X>'));
});
