import profiles from './data/profiller.json' with {type:'json'};
import aliases from './data/profile-aliases.json' with {type:'json'};
export const canonicalHandle=h=>aliases[h]||h;
export const profileAuthors=h=>[...new Set([canonicalHandle(h),...Object.keys(aliases).filter(k=>aliases[k]===canonicalHandle(h))])];
export const canonicalRow=r=>{const n={...r};for(const k of ['author','recipient','target','handle','peer','sender'])if(typeof n[k]==='string')n[k]=canonicalHandle(n[k]);return n;};
export const npcFor=h=>profiles.find(n=>n.kullanici_adi===canonicalHandle(h));
