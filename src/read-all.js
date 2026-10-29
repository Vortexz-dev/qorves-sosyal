export async function markAllRead({publicIds,privateUnread,writePublic,writePrivate}){
 const jobs=[];
 if(publicIds.length)jobs.push({kind:'public',promise:Promise.resolve().then(()=>writePublic(publicIds))});
 if(privateUnread)jobs.push({kind:'private',promise:Promise.resolve().then(writePrivate)});
 const results=await Promise.allSettled(jobs.map(j=>j.promise));
 return Object.fromEntries(jobs.map((j,i)=>[j.kind,{ok:results[i].status==='fulfilled',error:results[i].reason}]));
}
