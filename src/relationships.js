import {canonicalHandle} from './profiles.js';
export function followAccounts(rows,handle,mode='followers'){
 const owner=canonicalHandle(handle),handles=new Set();
 for(const row of rows){const author=canonicalHandle(row.author),target=canonicalHandle(row.target);if(!author||!target||author===target)continue;if(mode==='following'?author===owner:target===owner)handles.add(mode==='following'?target:author);}
 return [...handles].sort((a,b)=>a.localeCompare(b,'tr'));
}
export function messageReceipt(message,now=Date.now()){
 if(message.readAt&&message.readAt<=now)return {label:'Görüldü',retry:false};
 if(message.state==='failed')return {label:'Hatta kesinti',retry:true};
 if(message.state==='quota')return {label:'Hat yoğun',retry:true};
 if(message.state==='blocked')return {label:'Ulaştırılamadı',retry:false};
 return {label:'İletildi',retry:false};
}
