import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {inflateRawSync} from 'node:zlib';
import {resolve,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const archives=['profiles-500-avatars.zip','profiles-500-banners.zip'];
for(const file of archives){const archive=resolve(root,'assets',file);
if(existsSync(archive)){
 const bytes=readFileSync(archive);let offset=0,count=0;
 while(bytes.readUInt32LE(offset)===0x04034b50){
  const flags=bytes.readUInt16LE(offset+6),method=bytes.readUInt16LE(offset+8),size=bytes.readUInt32LE(offset+18),nameSize=bytes.readUInt16LE(offset+26),extra=bytes.readUInt16LE(offset+28);
  if(flags&8)throw Error('Portre arşivi desteklenmeyen biçimde.');
  const name=bytes.subarray(offset+30,offset+30+nameSize).toString('utf8');
  const target=resolve(root,'public',name),allowed=resolve(root,'public','profiller')+sep;
  if(!target.startsWith(allowed)||!/^profiller\/[^/]+\/(profil|banner)\.jpg$/.test(name))throw Error('Portre yolu geçersiz.');
  const start=offset+30+nameSize+extra,packed=bytes.subarray(start,start+size);
  const data=method===0?packed:method===8?inflateRawSync(packed):null;
  if(!data)throw Error('Portre sıkıştırması desteklenmiyor.');
  mkdirSync(dirname(target),{recursive:true});writeFileSync(target,data);count++;offset=start+size;
 }
 if(count!==500)throw Error('500 karakter görseli bulunamadı.');
 console.log('500 karakter görseli hazır: '+file);
}

}
