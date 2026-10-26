export async function compressImage(file,avatar=false){
 if(!file||!file.type.startsWith('image/'))throw Error('Lütfen bir görsel dosyası seç.');
 if(file.size>12*1024*1024)throw Error('Görsel 12 MB altında olmalı.');
 const url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();const max=avatar?384:850,ratio=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*ratio);c.height=Math.round(img.height*ratio);c.getContext('2d').drawImage(img,0,0,c.width,c.height);let data=c.toDataURL('image/jpeg',.72);if(data.length>180000)data=c.toDataURL('image/jpeg',.4);if(data.length>240000)throw Error('Görsel fazla ayrıntılı; daha küçük bir görsel dene.');return data;}finally{URL.revokeObjectURL(url);}
}
