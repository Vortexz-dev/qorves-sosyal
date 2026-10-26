export function unreadNotifications(publicRows,privateRows,handle){return [...publicRows.filter(n=>n.recipient===handle).map(n=>({...n,source:'public'})),...privateRows.map(n=>({...n,source:'private',kind:'mesaj'}))].sort((a,b)=>b.createdAt-a.createdAt);}
export function typingVisible(arrivalAt,now=Date.now()){return Number.isFinite(arrivalAt)&&now>=arrivalAt-10000&&now<arrivalAt;}
export function shuffleSuggestions(accounts,random=Math.random){const copy=[...accounts];for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
