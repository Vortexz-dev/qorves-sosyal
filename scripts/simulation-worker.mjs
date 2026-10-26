// Local-only producer. The API key stays on the DM's computer and never enters Firebase.
import {readFileSync} from 'node:fs';
const keyPath=process.env.QORVES_GEMINI_KEY_FILE;
if(!keyPath)throw Error('QORVES_GEMINI_KEY_FILE ile yerel anahtar dosyasını belirt.');
const key=readFileSync(keyPath,'utf8').match(/[A-Za-z0-9_.-]{24,}/)?.[0];
if(!key)throw Error('Anahtar dosyası okunamadı.');
const values=new Map([['qorves-gemini-private',key]]);
globalThis.localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
globalThis.window={addEventListener:()=>{}};
const {storage}=await import('../src/storage.js');
const {startSimulation}=await import('../src/simulation.js');
await storage.init();
startSimulation();
console.log('Qorves yerel üreticisi hazır. Anahtar yalnız bu işlemde tutulur. DM panelinden simülasyonu kapatabilirsin.');
