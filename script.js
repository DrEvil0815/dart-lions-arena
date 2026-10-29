
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
    throws:[0,0], scored:[0,0], last:[null,null], max180:[0,0], highFinishes:[[],[]], shortLegs:[[],[]], legDarts:[0,0], start, bestOf, out:$('out').value, finished:false };
  history = [];
  $('points').value = '';
  $('message').textContent = 'Match gestartet. '+names[0]+' beginnt.';
  $('message').classList.remove('match-finished');
  $('setup-screen').hidden = true;
  $('game-screen').hidden = false;
  $('match-description').textContent = `${start} · ${$('out').selectedOptions[0].text} · ${bestOf===1?'1 Leg':'Best of '+bestOf}`;
  render();
}
function render() {
  if (!state) return;
  for (let i=0;i<2;i++) {
    $('n'+i).textContent = state.names[i];
    $('s'+i).textContent = state.scores[i];
    $('last'+i).textContent = state.last[i]===null?'–':state.last[i];
    $('mn'+i).textContent = state.names[i];
    const chips=[];
    if(state.max180[i]) chips.push('180er × '+state.max180[i]);
    if(state.highFinishes[i].length) chips.push('Highfinish: '+state.highFinishes[i].join(', '));
    if(state.shortLegs[i].length) chips.push('Short Legs: '+state.shortLegs[i].join(', ')+' Darts');
    $('high'+i).replaceChildren(...chips.map(t=>{const el=document.createElement('span');el.textContent=t;return el;}));
    $('high'+i).hidden=chips.length===0;
    $('avg'+i).textContent = state.throws[i] ? (state.scored[i]/state.throws[i]*3).toFixed(2) : '0.00';
    $(i?'b':'a').classList.toggle('active', !state.finished && state.turn===i);
  }
  $('ml0').textContent=state.legs[0]; $('ml1').textContent=state.legs[1];
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
  if (v===180 && remain>=0) state.max180[i]++;
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
