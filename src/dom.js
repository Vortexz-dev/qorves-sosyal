// Preserve live controls, file pickers, selection, scroll and animations during background updates.
const key=n=>n.nodeType===1?(n.id||n.getAttribute('data-key')||(n.tagName==='FORM'?'form:'+n.dataset.form+':'+(n.dataset.post||n.dataset.peer||'')+':'+(n.dataset.parent||''):'')||(['A','BUTTON'].includes(n.tagName)?n.getAttribute('href')||n.getAttribute('data-action'):'')||(n.tagName==='INPUT'?n.name||n.type:'')):'';
const compatible=(a,b)=>a.nodeType===b.nodeType&&a.nodeName===b.nodeName&&key(a)===key(b);
function morph(a,b){
 if(a.nodeType!==1){if(a.nodeValue!==b.nodeValue)a.nodeValue=b.nodeValue;return;}
 for(const x of [...a.attributes])if(!b.hasAttribute(x.name))a.removeAttribute(x.name);
 for(const x of b.attributes)if(a.getAttribute(x.name)!==x.value)a.setAttribute(x.name,x.value);
 // Textareas keep their live value; fresh elements already contain the right default.
 if(a.tagName==='TEXTAREA')return;
 reconcile(a,b);
}
function reconcile(a,b){let cursor=a.firstChild;for(const next of [...b.childNodes]){let current=cursor;
 if(!current||!compatible(current,next)){current=[...a.childNodes].find(n=>n!==cursor&&key(next)&&compatible(n,next));if(current)a.insertBefore(current,cursor);else{a.insertBefore(next.cloneNode(true),cursor);continue;}}
 morph(current,next);cursor=current.nextSibling;
 }while(cursor){const next=cursor.nextSibling;cursor.remove();cursor=next;}}
export function patchHTML(root,html){const template=document.createElement('template');template.innerHTML=html;reconcile(root,template.content);}
