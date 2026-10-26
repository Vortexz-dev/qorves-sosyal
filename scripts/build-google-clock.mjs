import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const banner=`var globalThis=this;
globalThis.crypto={randomUUID:function(){return Utilities.getUuid();}};
globalThis.atob=function(s){return Utilities.newBlob(Utilities.base64Decode(s)).getDataAsString();};
globalThis.setTimeout=function(){return 0;};globalThis.clearTimeout=function(){};
globalThis.AbortController=class{constructor(){this.signal={aborted:false};}abort(){this.signal.aborted=true;}};
globalThis.fetch=async function(url,options){options=options||{};var model=decodeURIComponent(String(url).match(/models[/]([^:]+):generateContent/)[1]);var response=UrlFetchApp.fetch('https://qorves-sosyal-api.stormypoppy17.chatgpt.site/api/v1/clock/model',{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+globalThis.QORVES_CLOCK_ACCESS_TOKEN},payload:JSON.stringify({model:model,payload:JSON.parse(options.body),claim:globalThis.QORVES_CLOCK_CLAIM}),muteHttpExceptions:true});var status=response.getResponseCode();return {ok:status>=200&&status<300,status:status,json:async function(){return JSON.parse(response.getContentText());}};};
`;
const footer=`
function qorvesCloudTick(event){return QorvesClockCore.runClock(!!(event&&event.triggerUid)).then(function(result){console.log(JSON.stringify(result));}).catch(function(error){console.error(error&&error.message||'Clock failed');throw error;});}
function installQorvesClock(){var existing=ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='qorvesCloudTick';});if(!existing.length)ScriptApp.newTrigger('qorvesCloudTick').timeBased().everyMinutes(5).create();console.log('Qorves clock installed; AI budget and shared switch remain authoritative.');}
function checkQorvesClock(){return QorvesClockCore.checkClock().then(function(result){console.log(JSON.stringify(result));});}
function testQorvesClock(){return qorvesCloudTick(null);}
function stopQorvesClock(){ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='qorvesCloudTick';}).forEach(function(t){ScriptApp.deleteTrigger(t);});}
`;
await mkdir('research/google-clock',{recursive:true});
await build({entryPoints:['scripts/google-clock-entry.js'],bundle:true,format:'iife',globalName:'QorvesClockCore',platform:'neutral',target:'es2020',minify:true,outfile:'research/google-clock/Code.gs',banner:{js:banner},footer:{js:footer},plugins:[{name:'google-clock-storage',setup(b){b.onResolve({filter:/\/storage\.js$/},args=>args.importer.endsWith('simulation.js')?{path:path.resolve('scripts/google-clock-storage.js')}:undefined);}}]});
await writeFile('research/google-clock/appsscript.json',JSON.stringify({timeZone:'Europe/Istanbul',runtimeVersion:'V8',exceptionLogging:'STACKDRIVER',oauthScopes:['https://www.googleapis.com/auth/script.external_request','https://www.googleapis.com/auth/script.scriptapp']},null,2));
console.log('Google clock built without embedding the Gemini secret.');
