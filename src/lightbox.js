// Kept outside #app so live feed updates cannot replace an open image viewer.
export function startLightbox(){
 const dialog=document.createElement('dialog');
 dialog.className='image-viewer';
 dialog.setAttribute('aria-label','Görseli incele');
 dialog.innerHTML='<div class="image-viewer-toolbar"><span class="image-viewer-caption"></span><button type="button" class="image-viewer-zoom" aria-label="Yakınlaştır">＋</button><button type="button" class="image-viewer-close" aria-label="Görseli kapat">✕</button></div><div class="image-viewer-stage"><img alt="" draggable="false"></div><p class="image-viewer-hint">Büyütmek için görsele dokun</p>';
 document.body.append(dialog);
 const image=dialog.querySelector('img'),stage=dialog.querySelector('.image-viewer-stage'),zoomButton=dialog.querySelector('.image-viewer-zoom');
 let trigger=null,zoom=1,closing=false,timer,oldOverflow='';
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function fit(){
  if(!image.naturalWidth)return;
  const scale=Math.min((innerWidth-32)/image.naturalWidth,Math.max(100,innerHeight-150)/image.naturalHeight,1.8);
  image.style.width=Math.round(image.naturalWidth*scale*zoom)+'px';
  image.style.height=Math.round(image.naturalHeight*scale*zoom)+'px';
  stage.scrollLeft=Math.max(0,(stage.scrollWidth-stage.clientWidth)/2);
  stage.scrollTop=Math.max(0,(stage.scrollHeight-stage.clientHeight)/2);
 }
 function toggleZoom(){zoom=zoom===1?2:1;dialog.classList.toggle('is-zoomed',zoom>1);zoomButton.textContent=zoom>1?'−':'＋';zoomButton.setAttribute('aria-label',zoom>1?'Uzaklaştır':'Yakınlaştır');fit();}
 function close(){
  if(!dialog.open||closing)return;closing=true;dialog.classList.add('is-closing');
  clearTimeout(timer);timer=setTimeout(()=>{dialog.close();dialog.classList.remove('is-closing');image.removeAttribute('src');document.body.style.overflow=oldOverflow;closing=false;if(trigger?.isConnected)trigger.focus({preventScroll:true});},reduced()?0:180);
 }
 function open(target){
  if(dialog.open)return;
  const src=target.dataset.imageSrc||target.currentSrc||target.src;
  if(!src)return;
  trigger=target;zoom=1;closing=false;oldOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';dialog.classList.remove('is-zoomed');
  zoomButton.textContent='＋';zoomButton.setAttribute('aria-label','Yakınlaştır');
  image.alt=target.dataset.imageLabel||target.alt||'Görsel';
  dialog.querySelector('.image-viewer-caption').textContent=image.alt;
  image.style.width='';image.style.height='';image.src=src;
  const box=target.getBoundingClientRect();
  dialog.style.setProperty('--image-origin-x',(box.left+box.width/2-innerWidth/2)+'px');
  dialog.style.setProperty('--image-origin-y',(box.top+box.height/2-innerHeight/2)+'px');
  dialog.showModal();fit();dialog.querySelector('.image-viewer-close').focus({preventScroll:true});
 }
 image.addEventListener('load',fit);
 dialog.querySelector('.image-viewer-close').addEventListener('click',close);
 zoomButton.addEventListener('click',toggleZoom);
 image.addEventListener('click',toggleZoom);
 dialog.addEventListener('click',event=>{if(event.target===stage||event.target===dialog)close();});
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 window.addEventListener('resize',()=>{if(dialog.open)fit();});
 window.addEventListener('hashchange',close);
 document.addEventListener('click',event=>{
  const target=event.target.closest?.('[data-image-viewer],.post-image,.dm-image');
  if(!target||dialog.contains(target))return;
  event.preventDefault();event.stopPropagation();open(target);
 },true);
 document.addEventListener('keydown',event=>{
  if(!['Enter',' '].includes(event.key))return;
  const target=event.target.closest?.('[data-image-viewer],.post-image,.dm-image');
  if(target){event.preventDefault();event.stopPropagation();open(target);}
 },true);
}
