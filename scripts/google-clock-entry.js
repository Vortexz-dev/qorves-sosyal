import {storage} from './google-clock-storage.js';
import {generate} from '../src/simulation.js';
import {cloudTurnDue} from '../src/publication.js';
import {day} from '../src/domain.js';
export async function checkClock(){await storage.init();return {enabled:storage.settings.enabled,intervalMinutes:storage.settings.intervalMinutes,requests:storage.usage.requests||0,serviceUid:PropertiesService.getScriptProperties().getProperty('FIREBASE_SERVICE_UID')};}
export async function runClock(automatic=false){
 await storage.init();await storage.markWake(automatic);const s=storage.settings;
 if(!s.enabled)return {status:'paused',aiRequests:0};
 const published=await storage.flushDuePublications();await storage.tickReplies();await storage.refreshControl();
 let result={status:'publishing-only'};
 if(cloudTurnDue(s,storage.usage,Date.now(),day())){await storage.loadContext();result=await generate(false,[],{scheduleToleranceMs:90000,spreadMinutes:30});}
 await storage.refreshControl();return {result,published,requests:storage.usage.requests||0,generated:storage.usage.posts||0,pending:storage.usage.pending||0};
}
