// Keep immediate intent visible until the shared listener confirms it.
export function createOptimisticActions(changed=()=>{}){
 const actions=new Map();
 return {
  project(collection,rows){let result=rows;for(const [key,a]of actions){if(a.collection!==collection)continue;if(!a.pending&&a.confirmed(rows)){actions.delete(key);continue;}result=a.project(result);}return result;},
  busy(key){return !!actions.get(key)?.pending;},
  run(key,{collection,project,confirmed,save}){
   if(actions.get(key)?.pending)return actions.get(key).promise;
   const previous=actions.get(key),action={collection,project,confirmed,pending:true};
   // Defer save to a microtask so repeated synchronous clicks share one promise.
   action.promise=Promise.resolve().then(save).then(value=>{action.pending=false;changed();return value;},error=>{if(previous)actions.set(key,previous);else actions.delete(key);changed();throw error;});
   actions.set(key,action);changed();return action.promise;
  }
 };
}
