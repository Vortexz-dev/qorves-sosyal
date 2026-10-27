// Every comment appears exactly once, including orphaned and cyclic legacy replies.
export function flattenThread(comments){
 const rows=[...new Map(comments.map(c=>[c.id,c])).values()].sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)||a.id.localeCompare(b.id));
 const ids=new Set(rows.map(c=>c.id)),children=new Map(),seen=new Set(),out=[];
 for(const c of rows){if(!children.has(c.parentId))children.set(c.parentId,[]);children.get(c.parentId).push(c);}
 function visit(c,depth){if(seen.has(c.id))return;seen.add(c.id);out.push({comment:c,depth});for(const child of children.get(c.id)||[])visit(child,depth+1);}
 for(const c of rows)if(!c.parentId||!ids.has(c.parentId))visit(c,0);
 for(const c of rows)visit(c,0);
 return out;
}
