const stages={identity:[18,'KİMLİK İMZASI','session.restore() → signature verified'],network:[42,'GEÇİT EL SIKIŞMASI','relay.connect() → encrypted channel'],feed:[68,'FREKANS EŞİTLEME','stream.open() → awaiting live packets'],ready:[91,'AKIŞ DOĞRULANDI','stream.verify() → checksum matched']};
export function startBoot(root=document.querySelector('#boot')){
 if(!root)return {progress(){},async complete(){},fail(){}};
 const status=root.querySelector('[data-boot-status]'),log=root.querySelector('[data-boot-log]'),code=root.querySelector('[data-boot-code]');
 let tick=0,closed=false;
 const timer=setInterval(()=>{if(closed)return;code.textContent=`RX ${((++tick*7919)%0xffffff).toString(16).padStart(6,'0').toUpperCase()}  /  SS.214\n${tick%2?'▰ ▱ ▰ ▰ ▱ ▱ ▰ ▱':'▱ ▰ ▱ ▰ ▰ ▱ ▰ ▰'}  PACKET MONITOR`;},180);
 const stop=()=>{closed=true;clearInterval(timer);};
 return {progress(stage){const s=stages[stage];if(!s||closed)return;root.style.setProperty('--boot-progress',s[0]+'%');status.textContent=s[1];const line=document.createElement('div');line.textContent='› '+s[2];log.append(line);while(log.children.length>5)log.firstElementChild.remove();},
 async complete(){stop();root.style.setProperty('--boot-progress','100%');root.classList.add('boot-success');status.textContent='SUCCESSFUL · HAT AÇIK';code.textContent='CONNECTION ESTABLISHED\nQORVES / SS.214';await new Promise(r=>setTimeout(r,260));root.classList.add('boot-leave');await new Promise(r=>setTimeout(r,220));root.remove();},
 fail(){stop();root.remove();}};
}
