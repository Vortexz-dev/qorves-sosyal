import npcs from '../src/data/profiller.json' with {type:'json'};
import {storage} from './google-clock-storage.js';
import {generate} from '../src/simulation.js';
import {cloudTurnDue} from '../src/publication.js';
import {day} from '../src/domain.js';
export async function checkClock(){await storage.init();return {release:'Q05',imageDailyLimit:50,memoryDays:90,profiles:npcs.length,likesPerTurn:storage.settings.likesPerTurn,imageEnabled:!!storage.settings.imageEnabled,enabled:storage.settings.enabled,intervalMinutes:storage.settings.intervalMinutes,requests:storage.usage.requests||0,serviceUid:PropertiesService.getScriptProperties().getProperty('FIREBASE_SERVICE_UID')};}
export async function runClock(automatic=false){
 await storage.init();await storage.markWake(automatic);const s=storage.settings;
 if(!s.enabled)return {status:'paused',aiRequests:0};
 const published=await storage.flushDuePublications();await storage.tickReplies();await storage.refreshControl();
 let result={status:'publishing-only'};
 if(cloudTurnDue(s,storage.usage,Date.now(),day())){await storage.loadContext();result=await generate(false,[],{scheduleToleranceMs:90000,spreadMinutes:30});}
 await storage.refreshControl();return {result,published,requests:storage.usage.requests||0,generated:storage.usage.posts||0,pending:storage.usage.pending||0};
}

export async function verifyImage(){
 await storage.init();if(!storage.settings.enabled||!storage.settings.imageEnabled)return {status:'paused'};
 const previousAttempt=storage.usage.lastAttempt||0,claim=await storage.claim('image-setup-check',true);if(!claim)return {status:'busy-or-budget'};
 try{const npc=npcs[0],image=await storage.attachImage(claim,{author:npc.kullanici_adi},'An ordinary handheld phone photograph at night inside a worn civilian spaceport in Astarion, Qorves science fiction universe. A chipped tea cup on a metal counter beside a rain streaked window, distant blue landing lights outside, quiet candid snapshot, imperfect focus and dark grainy shadows, no readable text, no logos, no collage.');return {status:image?'ready':'skipped',imageCharacters:image?.length||0};}
 finally{await storage.release(claim,'Gorsel baglantisi kontrol edildi; metin istegi kullanilmadi.',true);await storage.restoreDiagnostic(claim,previousAttempt);}
}
