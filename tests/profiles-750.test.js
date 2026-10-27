import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import profiles from '../src/data/profiller.json' with {type:'json'};
import {canonicalHandle,npcFor} from '../src/profiles.js';
import {socialVoice} from '../src/social-life.js';

test('the 250 additional identities have usable portraits, banners and all supplied relationships',()=>{
 const extra=profiles.filter(n=>n.id>=501);
 assert.equal(extra.length,250);
 assert.deepEqual(extra.map(n=>n.id),Array.from({length:250},(_,i)=>501+i));
 assert.equal(extra.reduce((sum,n)=>sum+n.iliskili_hesaplar.length,0),857);
 for(const p of extra){
  assert.match(p.kullanici_adi,/^@[a-zA-Z0-9_.]{1,28}$/);
  assert.ok(p.kisilik&&p.konusma_uslubu&&p.hayat_ozeti&&p.ornek_paylasimlar.length);
  assert.ok(existsSync('public/'+p.foto));assert.ok(existsSync('public/'+p.banner));
  for(const h of p.iliskili_hesaplar)assert.ok(npcFor(h),h);
 }
 assert.equal(canonicalHandle('@dilay.hukukçu'),'@dilay.hukukcu');
});

test('private extra biography notes never enter public profile data or the Google clock bundle',()=>{
 for(const p of profiles)for(const key of ['dm_notu','aile','gecmis','is','iliski','sir','rutin'])assert.ok(!Object.hasOwn(p,key));
 const clock=readFileSync('research/google-clock/Code.gs','utf8');
 assert.ok(clock.includes('lunaa.kat'));assert.ok(clock.includes('Q08'));
 assert.ok(!clock.includes('ozelHayat'));
 assert.match(socialVoice,/18 yaşından küçük hesaplarla/);
 assert.ok(profiles.some(n=>n.id>=501&&n.yas<18));
});
