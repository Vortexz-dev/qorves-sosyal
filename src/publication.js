export function mergeSimulationSettings(current,patch,now=Date.now()){
 const next={...current,...patch,apiKey:'',revision:(current.revision||0)+1};
 if('enabled'in patch&&patch.enabled!==current.enabled){
  if(!patch.enabled)next.pauseStartedAt=now;
  else{next.totalPausedMs=(current.totalPausedMs||0)+Math.max(0,now-(current.pauseStartedAt||now));next.pauseStartedAt=0;}
 }
 return next;
}
export const effectiveDue=(item,settings)=>item.dueAt+Math.max(0,(settings.totalPausedMs||0)-(item.pauseOffset||0));
export function planPublications(generated,memories,pairs,settings,now=Date.now(),minutes=30,random=Math.random){
 const window=Math.max(1,Math.min(30,minutes))*60000,latestContent=window*.82;
 const planned=[],times=new Map();
 for(const body of generated){const dueAt=now+Math.floor(random()*latestContent);times.set(body.id,dueAt);planned.push({id:'publication-'+body.id,kind:'publication',state:'pending',type:body.replyTo?'comment':'post',body,memory:memories.find(m=>m.handle===body.author)||null,dueAt,pauseOffset:settings.totalPausedMs||0});}
 const seen=new Set();
 for(const body of pairs.slice(0,500)){const key=encodeURIComponent(body.postId+':'+body.author);if(seen.has(key))continue;seen.add(key);const earliest=times.get(body.postId)||now;planned.push({id:'reaction-'+key,kind:'publication',state:'pending',type:'like',body,memory:null,dueAt:earliest+Math.floor(random()*Math.max(1,now+window-earliest)),pauseOffset:settings.totalPausedMs||0});}
 return planned;
}
export function cloudTurnDue(settings,control,now,date,manual=false){
 if(!settings.enabled)return false;
 if(control.until>now)return false;
 if(control.day===date&&((control.requests||0)>=settings.maxRequests||(control.posts||0)>=settings.maxPosts))return false;
 return manual||(settings.requestedTurnAt||0)>(control.lastAttempt||0)||now-(control.lastAttempt||0)>=Math.max(2,settings.intervalMinutes)*60000-90000;
}

// Six small reaction bundles avoid spending Firestore's free write quota on 100 separate queue records.
export function compactPublications(planned){
 const result=planned.filter(x=>x.type!=='like'),groups=new Map();
 for(const x of planned.filter(x=>x.type==='like')){const bucket=Math.floor(x.dueAt/300000);if(!groups.has(bucket))groups.set(bucket,[]);groups.get(bucket).push(x);}
 for(const [bucket,items]of groups)result.push({id:'reactions-'+bucket+'-'+items[0].id,kind:'publication',state:'pending',type:'likes',dueAt:Math.max(...items.map(x=>x.dueAt)),pauseOffset:items[0].pauseOffset,body:{items:items.map(x=>({body:x.body,dueAt:x.dueAt}))}});
 return result;
}
