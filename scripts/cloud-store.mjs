import {commonCall,createCommonFirestore} from '../src/common-firestore.js';
// Use the same write fence as the site and Google clock; never fall back on a state error.
export async function openCloudStore(token,{call=commonCall,common=createCommonFirestore,legacy=()=>import('firebase/firestore')}={}){
 const state=await call(token,'state');
 if(state.phase==='copying'||state.emergencyPaused)return null;
 if(state.active)return common(token,state);
 return legacy();
}
