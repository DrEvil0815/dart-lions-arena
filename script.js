'use strict';
const $ = id => document.getElementById(id);
let state, history = [];
function reset() {
  const start = Number($('start').value);
  state = {scores:[start,start], legs:[0,0], names:[$('p1').value.trim()||'Spieler 1',$('p2').value.trim()||'Spieler 2'],turn:0,legStarter:0,throws:[0,0],scored:[0,0],start};
  history=[]; $('points').value=''; $('message').textContent='Neues Spiel gestartet.'; render();
}
function render() {
  for(let i=0;i<2;i++) {
    $('n'+i).textContent=state.names[i]; $('s'+i).textContent=state.scores[i]; $('l'+i).textContent=state.legs[i];
    $('avg'+i).textContent=state.throws[i]?(state.scored[i]/state.throws[i]*3).toFixed(2):'0.00';
    $(i?'b':'a').classList.toggle('active',state.turn===i);
  }
  $('ml0').textContent=state.legs[0]; $('ml1').textContent=state.legs[1];
  $('turn').textContent=state.names[state.turn]+' ist dran';
}
function submit() {
  const raw=$('points').value.trim(),v=Number(raw),i=state.turn,remain=state.scores[i]-v,out=$('out').value;
  if(raw===''||!Number.isInteger(v)||v<0||v>180){$('message').textContent='Bitte 0 bis 180 Punkte eingeben.';return;}
  const finish=remain===0;
  if(finish && out!=='single' && v===1){$('message').textContent='Ein Checkout mit 1 Punkt ist bei Double/Master Out nicht möglich.';return;}
  history.push(JSON.stringify(state));
  if(remain<0 || (remain===1 && out!=='single')){
    state.throws[i]+=3; state.turn=1-i; $('message').textContent='Bust! Aufnahme zählt 0.';
  } else {
    state.scores[i]=remain; state.scored[i]+=v; state.throws[i]+=3;
    if(finish){
      state.legs[i]++; $('message').textContent='Game shot! '+state.names[i]+' gewinnt das Leg.';
      state.scores=[state.start,state.start]; state.legStarter=1-state.legStarter; state.turn=state.legStarter;
    } else {state.turn=1-i; $('message').textContent=state.names[i]+': '+v+' Punkte.';}
  }
  $('points').value=''; render();
}
$('new').addEventListener('click',reset);
$('score-form').addEventListener('submit',e=>{e.preventDefault();submit();});
document.querySelectorAll('[data-digit]').forEach(b=>b.addEventListener('click',()=>{if($('points').value.length<3)$('points').value+=b.dataset.digit;}));
$('clear').addEventListener('click',()=>$('points').value='');
$('backspace').addEventListener('click',()=>$('points').value=$('points').value.slice(0,-1));
window.addEventListener('keydown',e=>{if(e.target.matches('input,select'))return;if(/^\d$/.test(e.key)&&$('points').value.length<3)$('points').value+=e.key;else if(e.key==='Backspace')$('points').value=$('points').value.slice(0,-1);else if(e.key==='Enter')submit();});
$('undo').addEventListener('click',()=>{if(!history.length){$('message').textContent='Nichts rückgängig zu machen.';return;}state=JSON.parse(history.pop());$('message').textContent='Letzte Aufnahme zurückgenommen.';render();});
reset();
