'use strict';
(()=>{
const el=id=>document.getElementById(id);
const games=[['clock','Around the Clock'],['hunt','Zahlenjagd'],['bull','Bullseye-Challenge'],['high','Highscore']];
const numbers=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
const key='dartlions-kids-v24-local';
const legacyKey='dartlions-kids-v23';
const initial=()=>Array.from({length:6},(_,i)=>({name:'',game:games[i%4][0],hits:[],done:false}));
let boards=initial(),results=[],current=0;
try{const saved=JSON.parse(localStorage.getItem(key));if(Array.isArray(saved.boards)&&saved.boards.length===6)boards=saved.boards;if(Array.isArray(saved.results))results=saved.results;}catch{}
const save=()=>{try{localStorage.setItem(key,JSON.stringify({boards,results,current}));}catch{}};
const options=()=>games.map(([v,t])=>`<option value="${v}">${t}</option>`).join('');
el('kids-common').innerHTML=options();el('kids-game').innerHTML=options();
el('kids-board-select').innerHTML=boards.map((_,i)=>`<option value="${i}">Board ${i+1}</option>`).join('');
el('kids-hit').innerHTML=['MISS','SB','BULL',...Array.from({length:20},(_,i)=>i+1).flatMap(n=>['S','D','T'].map(m=>m+n))].map(v=>`<option value="${v}">${v==='MISS'?'Fehlwurf':v==='SB'?'Single Bull (25)':v==='BULL'?'Bullseye (50)':v}</option>`).join('');
const score=h=>h==='BULL'?50:h==='SB'?25:h==='MISS'?0:Number(h.slice(1))*(h[0]==='T'?3:h[0]==='D'?2:1);
const gameName=id=>games.find(g=>g[0]===id)?.[1]||id;
const allowedTotal=b=>b.game==='high';
function target(b){if(b.game==='clock')return Math.min(21,1+b.hits.filter(h=>h!=='MISS').reduce((n,h)=>{const expected=n+1;return n+(h.slice(1)===(expected===21?'':String(expected))&&expected<=20?1:0)},0));if(b.game==='hunt')return numbers[(b.hits.length/3|0)%20];return null;}
let progress=function(b){const n=b.hits.length;const pts=b.hits.reduce((s,h)=>s+score(h),0);if(b.game==='high')return {points:pts,description:`${Math.floor(n/3)} von 10 Aufnahmen · Dart ${n%3+1}/3`,finished:n>=30};if(b.game==='bull')return {points:b.hits.reduce((s,h)=>s+(h==='BULL'?50:h==='SB'?25:0),0),description:`${Math.floor(n/3)} von 10 Aufnahmen · Bull zählt`,finished:n>=30};if(b.game==='hunt')return {points:b.hits.reduce((s,h,i)=>{const t=numbers[Math.floor(i/3)%20];return s+(h.slice(1)===String(t)?(h[0]==='T'?3:h[0]==='D'?2:1):0)},0),description:`Ziel: ${numbers[Math.floor(n/3)%20]} · Aufnahme ${Math.floor(n/3)+1}/10`,finished:n>=30};let expected=1,success=0;for(const h of b.hits){if(h==='S'+expected||h==='D'+expected||h==='T'+expected){success++;expected++;if(expected>20)break;}}return {points:success,description:expected>20?'Alle Zahlen getroffen!':`Nächste Zahl: ${expected} · ${n} Darts`,finished:expected>20||n>=90};};
function escapeHTML(s){return String(s).replace(/[&"<>']/g,c=>({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;',"'":'&#39;'}[c]));}
function show(tab){['board','results'].forEach(t=>el('kids-'+t).hidden=t!==tab);document.querySelectorAll('[data-kids-tab]').forEach(b=>b.classList.toggle('active',b.dataset.kidsTab===tab));if(tab==='board')render();if(tab==='results')renderResults();}
function openBoard(i){current=i;save();el('kids-board-select').value=String(i);show('board');}
function render(){const b=boards[current],p=progress(b);el('kids-name').value=b.name;el('kids-game').value=b.game;el('kids-progress').textContent=`Board ${current+1} · ${gameName(b.game)} · ${p.description}`;el('kids-points').textContent=p.points+(b.game==='clock'?' Zahlen':' Punkte');el('kids-feedback').textContent=b.done?'Training abgeschlossen':p.finished?'Ziel erreicht – Training abschließen':`${b.hits.length} Darts erfasst`;
const total=el('kids-entry-mode').value==='total';if(total&&!allowedTotal(b)){el('kids-entry-mode').value='board';}
for(const o of el('kids-entry-mode').options)o.disabled=o.value==='total'&&!allowedTotal(b);
const entry=el('kids-entry-mode').value;el('kids-dartboard').hidden=entry!=='board';el('kids-manual').hidden=entry!=='manual';el('kids-total').hidden=entry!=='total';el('kids-log').textContent=b.hits.length?`Letzte Treffer: ${b.hits.slice(-18).join(' · ')}`:'Noch keine Treffer erfasst.';
}
function addHit(hit){const b=boards[current];if(b.done||progress(b).finished)return;if(b.hits.length>=90)return;b.hits.push(hit);save();render();}
function addTotal(){const b=boards[current];if(!allowedTotal(b))return;const v=Number(el('kids-total-score').value);if(!Number.isInteger(v)||v<0||v>180){alert('Bitte einen Gesamtscore zwischen 0 und 180 eingeben.');return;}if(b.hits.length>=30)return;b.hits.push('TOTAL:'+v,'TOTAL:0','TOTAL:0');el('kids-total-score').value='';save();render();}
// A total visit is stored as a three-dart group. For highscore, score the first value only.
function calc(b){if(b.game==='high')return b.hits.reduce((s,h)=>s+(h.startsWith('TOTAL:')?Number(h.slice(6)):score(h)),0);return progress(b).points;}
function finish(){const b=boards[current];if(!b.hits.length){alert('Bitte zuerst Treffer erfassen.');return;}b.done=true;results.unshift({date:new Date().toLocaleString('de-DE'),name:b.name||`Board ${current+1}`,board:current+1,game:gameName(b.game),points:calc(b),darts:b.hits.length});save();render();alert('Ergebnis gespeichert.');}
function renderResults(){el('kids-result-list').innerHTML=results.length?results.map(r=>`<div class="kids-result"><strong>${escapeHTML(r.name)}</strong> · Board ${r.board} · ${escapeHTML(r.game)}<br>${r.points} Punkte · ${r.darts} Darts · ${escapeHTML(r.date)}</div>`).join(''):'Noch keine Ergebnisse gespeichert.';}
function boardSvg(){const ns='http://www.w3.org/2000/svg';let html='<svg viewBox="0 0 320 320" role="group" aria-label="Dartboard mit anklickbaren Feldern"><circle cx="160" cy="160" r="157" fill="#111" stroke="#b78b4b" stroke-width="3"/>';
const point=(r,a)=>`${160+r*Math.cos(a)} ${160+r*Math.sin(a)}`;
for(let i=0;i<20;i++){const a=(i*18-99)*Math.PI/180,z=((i+1)*18-99)*Math.PI/180,n=numbers[i];for(const [r1,r2,m] of [[20,74,'S'],[74,84,'T'],[84,115,'S'],[115,126,'D']]){const path=`M ${point(r1,a)} L ${point(r2,a)} A ${r2} ${r2} 0 0 1 ${point(r2,z)} L ${point(r1,z)} A ${r1} ${r1} 0 0 0 ${point(r1,a)} Z`;const fill=m==='T'||m==='D'?(i%2?'#27885d':'#b93642'):(i%2?'#e4d8c2':'#272727');html+=`<path d="${path}" fill="${fill}" stroke="#777" stroke-width=".65" data-hit="${m+n}"/>`;}const ang=(i*18-90)*Math.PI/180;html+=`<text x="${160+141*Math.cos(ang)}" y="${160+141*Math.sin(ang)}" font-size="11" fill="#eee" text-anchor="middle" dominant-baseline="middle" pointer-events="none">${n}</text>`;}
html+='<circle cx="160" cy="160" r="20" fill="#25875b" data-hit="SB"/><circle cx="160" cy="160" r="9" fill="#c53845" data-hit="BULL"/></svg>';el('kids-dartboard').innerHTML=html;}
// Correct total-visit scoring in the highscore display.
const originalProgress=progress;
progress=function(b){const p=originalProgress(b);if(b.game==='high')p.points=calcHigh(b);return p;};
function calcHigh(b){return b.hits.reduce((s,h)=>s+(h.startsWith('TOTAL:')?Number(h.slice(6)):score(h)),0);}
el('open-kids').addEventListener('click',()=>{el('choice-screen').hidden=true;el('setup-screen').hidden=true;el('game-screen').hidden=true;el('kids-screen').hidden=false;show('board');});
el('kids-back').addEventListener('click',()=>{el('kids-screen').hidden=true;el('choice-screen').hidden=false;});
document.querySelectorAll('[data-kids-tab]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.kidsTab)));
el('kids-board-select').addEventListener('change',()=>openBoard(Number(el('kids-board-select').value)));
el('kids-name').addEventListener('change',()=>{boards[current].name=el('kids-name').value;save();});
el('kids-game').addEventListener('change',()=>{const b=boards[current];if(b.hits.length&&!confirm('Übung wechseln und bisherige Treffer dieses Boards zurücksetzen?')){render();return;}b.game=el('kids-game').value;b.hits=[];b.done=false;save();render();});
el('kids-entry-mode').addEventListener('change',render);
el('kids-add-hit').addEventListener('click',()=>addHit(el('kids-hit').value));el('kids-add-total').addEventListener('click',addTotal);
el('kids-dartboard').addEventListener('click',e=>{const hit=e.target.closest('[data-hit]');if(hit)addHit(hit.dataset.hit);});
el('kids-miss').addEventListener('click',()=>addHit('MISS'));
el('kids-undo').addEventListener('click',()=>{const b=boards[current];if(b.done){alert('Abgeschlossenes Training kann nicht geändert werden.');return;}b.hits.pop();save();render();});
el('kids-next').addEventListener('click',finish);
el('kids-clear-results').addEventListener('click',()=>{if(confirm('Alle lokal gespeicherten Kids-Ergebnisse löschen?')){results=[];save();renderResults();}});
boardSvg();openBoard(current);
})();
