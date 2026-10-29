
'use strict';
const $ = id => document.getElementById(id);
let state = null, history = [];
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function showSetup() {
  $('game-screen').hidden = true;
  $('setup-screen').hidden = false;
  $('points').value = '';
}
function startMatch(e) {
  if (e) e.preventDefault();
  const start = Number($('start').value), bestOf = Number($('bestof').value);
  const names = [$('p1').value.trim(), $('p2').value.trim()];
  if (!names[0] || !names[1]) { alert('Bitte beide Spielernamen eingeben.'); return; }
  state = { scores:[start,start], legs:[0,0], names, turn:0, legStarter:0,
    throws:[0,0], scored:[0,0], last:[null,null], max180:[0,0], highFinishes:[[],[]], shortLegs:[[],[]], legDarts:[0,0], visits:[[],[]], hits:[{'40':0,'60':0,'80':0,'100':0,'180':0},{'40':0,'60':0,'80':0,'100':0,'180':0}], start, bestOf, out:$('out').value, finished:false };
  history = [];
  $('points').value = '';
  $('message').textContent = 'Match gestartet. '+names[0]+' beginnt.';
  $('message').classList.remove('match-finished');
  $('setup-screen').hidden = true;
  $('game-screen').hidden = false;
  $('match-description').textContent = `${start} · ${$('out').selectedOptions[0].text} · ${bestOf===1?'1 Leg':'Best of '+bestOf}`;
  render();
}

// Vorschläge: maximal drei Darts, bevorzugt Triple und gängige Doppel.
function checkoutPath(rest, out) {
  if (rest<1 || rest>170) return '';
  const singles=Array.from({length:20},(_,i)=>({n:'S'+(i+1),v:i+1}));
  const doubles=Array.from({length:20},(_,i)=>({n:'D'+(i+1),v:2*(i+1)}));
  const triples=Array.from({length:20},(_,i)=>({n:'T'+(i+1),v:3*(i+1)}));
  const all=[...triples.slice().reverse(),{n:'T20',v:60},...singles.slice().reverse(),...doubles.slice().reverse(),{n:'25',v:25},{n:'BULL',v:50}];
  const finish=out==='single'?all:out==='master'?[...triples,...doubles,{n:'BULL',v:50}]:[...doubles,{n:'BULL',v:50}];
  const first=[...triples.slice().reverse(),...doubles.slice().reverse(),...singles.slice().reverse(),{n:'BULL',v:50},{n:'25',v:25}];
  const preferred=finish.slice().sort((a,b)=>{const rank=x=>x.n==='D20'?100:x.n==='D16'?95:x.n==='D18'?90:x.n==='BULL'?85:x.n.startsWith('D')?70+x.v/10:x.n.startsWith('T')?40+x.v/10:0;return rank(b)-rank(a);});
  for (let count=1;count<=3;count++) {
    if(count===1){const m=preferred.find(x=>x.v===rest);if(m)return m.n;}
    if(count===2){for(const a of first) {const b=preferred.find(x=>x.v===rest-a.v);if(b)return a.n+' · '+b.n;}}
    if(count===3){for(const a of first)for(const b of first){const c=preferred.find(x=>x.v===rest-a.v-b.v);if(c)return a.n+' · '+b.n+' · '+c.n;}}
  }
  // Kein direktes Finish möglich: einen sinnvollen Rest stellen.
  const targets=out==='single'?[50,40,32,20]:[40,32,36,24,16];
  for(const target of targets)for(const a of first){if(rest-a.v===target)return a.n+' → Rest '+target;}
  return 'Finish stellen';
}

function canCheckout(rest, out) {
  if(rest<1 || rest>170) return false;
  // checkoutPath liefert nur bei einem echten Finish einen Pfad ohne Resthinweis.
  const path=checkoutPath(rest,out);
  return Boolean(path) && !path.includes('Rest ') && path!=='Finish stellen';
}
function renderHistory() {
  const rows=$('history-rows'); rows.replaceChildren();
  const n=Math.max(state.visits[0].length,state.visits[1].length);
  for(let j=n-1;j>=0;j--){
    const row=document.createElement('div');row.className='history-row';
    for(let i=0;i<2;i++){
      const cell=document.createElement('span');
      const v=state.visits[i][j];cell.textContent=v===undefined?'–':String(v);
      if(v===180)cell.className='history-180';
      row.appendChild(cell);
    }
    rows.appendChild(row);
  }
  if(!n){const empty=document.createElement('div');empty.className='history-empty';empty.textContent='Noch keine Aufnahmen';rows.appendChild(empty);}
}
function render() {
  if (!state) return;
  for (let i=0;i<2;i++) {
    $('n'+i).textContent = state.names[i];
    $('s'+i).textContent = state.scores[i];
    $('last'+i).textContent = state.last[i]===null?'–':state.last[i];
    $('mn'+i).textContent = state.names[i];
    $('pl'+i).textContent = state.legs[i];
    const restColor=state.scores[i]<=170 ? (canCheckout(state.scores[i],state.out)?'finish-possible':'finish-impossible') : '';
    $('s'+i).classList.remove('finish-possible','finish-impossible');
    if(restColor)$('s'+i).classList.add(restColor);
    const chips=[];
    if(state.max180[i]) chips.push('180er × '+state.max180[i]);
    if(state.highFinishes[i].length) chips.push('Highfinish: '+state.highFinishes[i].join(', '));
    if(state.shortLegs[i].length) chips.push('Short Legs: '+state.shortLegs[i].join(', ')+' Darts');
    $('high'+i).replaceChildren(...chips.map(t=>{const el=document.createElement('span');el.textContent=t;return el;}));
    $('high'+i).hidden=chips.length===0;
    for (const tier of ['40','60','80','100','180']) $('hit'+i+'-'+tier).textContent=state.hits[i][tier];
    const suggestion=checkoutPath(state.scores[i],state.out);
    $('co-box'+i).hidden=state.finished || state.scores[i]>170 || !suggestion;
    $('co'+i).textContent=suggestion;
    $('avg'+i).textContent = state.throws[i] ? (state.scored[i]/state.throws[i]*3).toFixed(2) : '0.00';
    $(i?'b':'a').classList.toggle('active', !state.finished && state.turn===i);
  }
  renderHistory();
  $('turn').textContent = state.finished ? 'MATCH BEENDET' : state.names[state.turn]+' ist dran';
  $('points').disabled = state.finished;
  document.querySelectorAll('#score-form button').forEach(b=>b.disabled=state.finished);
}
function submit() {
  if (!state || state.finished || $('game-screen').hidden) return;
  const raw=$('points').value.trim(), v=Number(raw), i=state.turn;
  if (raw==='' || !Number.isInteger(v) || v<0 || v>180) { $('message').textContent='Bitte 0 bis 180 Punkte eingeben.'; return; }
  const remain=state.scores[i]-v, finish=remain===0;
  if (finish && state.out!=='single' && v===1) { $('message').textContent='1 Punkt ist bei Double/Master Out kein gültiger Checkout.'; return; }
  history.push(clone(state));
  state.last[i] = (remain<0 || (remain===1 && state.out!=='single')) ? 0 : v;
  state.visits[i].push(state.last[i]);
  const valid=remain>=0 && !(remain===1 && state.out!=='single');
  if (valid && v>=40) { const tier=v===180?'180':v>=100?'100':v>=80?'80':v>=60?'60':'40'; state.hits[i][tier]++; }
  if (v===180 && valid) state.max180[i]++;
  state.legDarts[i]+=3;
  if (remain<0 || (remain===1 && state.out!=='single')) {
    state.throws[i]+=3; state.turn=1-i;
    $('message').textContent='Bust! Aufnahme zählt 0.';
  } else {
    state.scores[i]=remain; state.scored[i]+=v; state.throws[i]+=3;
    if (finish) {
      if(v>=100) state.highFinishes[i].push(v);
      if(state.legDarts[i]<=18) state.shortLegs[i].push(state.legDarts[i]);
      state.legs[i]++;
      if (state.legs[i] >= Math.ceil(state.bestOf/2)) {
        state.finished=true;
        $('message').textContent='GAME SHOT AND THE MATCH! '+state.names[i]+' gewinnt '+state.legs[0]+':'+state.legs[1]+'.';
        $('message').classList.add('match-finished');
      } else {
        $('message').textContent='Game shot! '+state.names[i]+' gewinnt das Leg.';
        state.scores=[state.start,state.start];
        state.legDarts=[0,0];
        state.legStarter=1-state.legStarter; state.turn=state.legStarter;
      }
    } else { state.turn=1-i; $('message').textContent=state.names[i]+': '+v+' Punkte.'; }
  }
  $('points').value=''; render();
}
$('setup-form').addEventListener('submit',startMatch);
$('new').addEventListener('click',()=>{ if(confirm('Aktuelles Match verlassen und neues Match vorbereiten?')) showSetup(); });
$('score-form').addEventListener('submit',e=>{e.preventDefault();submit();});
document.querySelectorAll('[data-digit]').forEach(b=>b.addEventListener('click',()=>{
  if (!state?.finished && $('points').value.length<3) $('points').value+=b.dataset.digit;
}));
$('clear').addEventListener('click',()=>$('points').value='');
$('backspace').addEventListener('click',()=>$('points').value=$('points').value.slice(0,-1));
window.addEventListener('keydown',e=>{
  if (!state || state.finished || $('game-screen').hidden || e.target.matches('input,select,button')) return;
  if (/^\d$/.test(e.key) && $('points').value.length<3) $('points').value+=e.key;
  else if(e.key==='Backspace') $('points').value=$('points').value.slice(0,-1);
  else if(e.key==='Enter') submit();
});
$('undo').addEventListener('click',()=>{
  if (!history.length) { $('message').textContent='Nichts rückgängig zu machen.'; return; }
  state=history.pop(); $('message').classList.remove('match-finished');
  $('message').textContent='Letzte Aufnahme zurückgenommen.'; render();
});
showSetup();
