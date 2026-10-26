export function imageContext(tasks,feed,max=3){
 const seen=new Set(),parts=[];
 for(const t of tasks){if(!t.target)continue;const post=t.target.postId?feed.find(p=>p.id===t.target.postId):t.target;if(!post||seen.has(post.id)||seen.size>=max)continue;const m=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(post.image||'');if(!m||post.image.length>240000)continue;seen.add(post.id);parts.push({text:`Bu görsel ${post.id} kimlikli paylaşımın eki. Yalnız ilgili görevin yanıtında kullan.`},{inlineData:{mimeType:m[1],data:m[2]}});
 }return parts;
}
