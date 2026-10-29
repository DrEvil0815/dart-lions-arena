
'use strict';
window.ArenaResults=(()=>{
 const overlay=document.getElementById('result-overlay');
 const title=document.getElementById('result-title'),subtitle=document.getElementById('result-subtitle'),stats=document.getElementById('result-stats');
 let onExit=()=>{},onRestart=()=>{};
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 document.getElementById('result-exit').addEventListener('click',()=>{overlay.hidden=true;onExit();});
 document.getElementById('result-restart').addEventListener('click',()=>{overlay.hidden=true;onRestart();});
 return {open(data){title.textContent=data.title;subtitle.textContent=data.subtitle;stats.innerHTML=data.stats.map(([label,value])=>`<div class="result-stat"><strong>${escape(value)}</strong><span>${escape(label)}</span></div>`).join('');onExit=data.onExit;onRestart=data.onRestart;overlay.hidden=false;document.getElementById('result-restart').focus();},close(){overlay.hidden=true;}};
})();
