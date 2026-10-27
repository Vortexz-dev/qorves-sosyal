import {canonicalHandle} from './profiles.js';
export const isBlocked=(users,owner,npc)=>(users.find(u=>u.handle===owner)?.blockedAccounts||[]).some(h=>canonicalHandle(h)===canonicalHandle(npc));
export const canSee=(users,npc,post)=>!isBlocked(users,post.author,npc);
