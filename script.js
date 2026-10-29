
'use strict';
const $ = id => document.getElementById(id);
let state = null, history = [];
let inputMode = 'total', multiplier = 1, dartDraft = [], pendingVisit = null;
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function showSetup() {
  $('game-screen').hidden = true;
  $('setup-screen').hidden = false;
  $('points').value = '';
  dartDraft=[]; pendingVisit=null; $('double-overlay').hidden=true;document.body.classList.remove('dialog-open');
}
function startMatch(e) {
  if (e) e.preventDefault();
  const start = Number($('start').value), bestOf = Number($('bestof').value);
  const names = [$('p1').value.trim(), $('p2').value.trim()];
  if (!names[0] || !names[1]) { alert('Bitte beide Spielernamen eingeben.'); return; }
  let config;try{config=handicapConfig();}catch(err){alert(err.message);return;}
  state = { scores:config.starts.slice(), starts:config.starts.slice(), outs:config.outs.slice(), handicap:config.mode, legs:[0,0], names, turn:0, legStarter:0,
    throws:[0,0], scored:[0,0], last:[null,null], max180:[0,0], highFinishes:[[],[]], shortLegs:[[],[]], legDarts:[0,0], visits:[[],[]], hits:[{'40':0,'60':0,'80':0,'100':0,'180':0},{'40':0,'60':0,'80':0,'100':0,'180':0}], doubles:[0,0], doubleHits:[0,0], doubleComplete:[true,true], start, bestOf, out:$('out').value, finished:false, trackDoubles:$('track-doubles').value==='yes' };
  history = []; dartDraft=[]; pendingVisit=null; $('double-overlay').hidden=true;document.body.classList.remove('dialog-open'); inputMode='total'; multiplier=1; syncMode();
  $('points').value = '';
  $('message').textContent = 'Match gestartet. '+names[0]+' beginnt.';
  $('message').classList.remove('match-finished');
  $('setup-screen').hidden = true;
  $('game-screen').hidden = false;
  $('match-description').textContent = `${config.starts[0]} (${outName(config.outs[0])}) vs ${config.starts[1]} (${outName(config.outs[1])}) · ${bestOf===1?'1 Leg':'Best of '+bestOf}`;
  render();
}

function outName(out){return out==='single'?'Single Out':out==='master'?'Master Out':'Double Out';}
function handicapConfig(){
 const mode=$('handicap-mode').value,base=Number($('start').value);
 if(mode==='off')return {mode,starts:[base,base],outs:[$('out').value,$('out').value]};
 const outs=[$('out0').value,$('out1').value];
 if(mode==='manual')return {mode,starts:[Number($('start0').value),Number($('start1').value)],outs};
 const avgs=[Number($('rating0').value),Number($('rating1').value)];
 if(avgs.some(v=>!Number.isFinite(v)||v<10||v>150))throw Error('Bitte für beide Spieler einen Average zwischen 10 und 150 eingeben.');
 // Höherer Average => mehr Punkte. Der stärkste Spieler erhält den Basisscore.
 const max=Math.max(...avgs);
 const starts=avgs.map(a=>Math.max(101,Math.min(base,Math.round((base*a/max)/5)*5+1)));
 return {mode,starts,outs};
}
function refreshHandicap(){
 const mode=$('handicap-mode').value;
 $('handicap-fields').hidden=mode==='off';$('shared-out-label').hidden=mode!=='off';
 for(let i=0;i<2;i++){$('manual-label'+i).hidden=mode!=='manual';$('average-label'+i).hidden=mode!=='auto';}
 try{const c=handicapConfig();$('handicap-preview').textContent=`Start: ${c.starts[0]} (${outName(c.outs[0])}) gegen ${c.starts[1]} (${outName(c.outs[1])})`;}catch(e){$('handicap-preview').textContent=e.message;}
}
$('handicap-mode').addEventListener('change',refreshHandicap);
['start','start0','start1','rating0','rating1','out','out0','out1'].forEach(id=>$(id).addEventListener('input',refreshHandicap));
refreshHandicap();
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
    for(let i=0;i<3;i++){
      const cell=document.createElement('span');
      if(i===1){cell.className='history-darts';cell.textContent=String((j+1)*3);}
      else {const player=i===0?0:1;const v=state.visits[player][j];cell.textContent=v===undefined?'–':String(v);if(v===180)cell.className='history-180';}
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
    const restColor=state.scores[i]<=170 ? (canCheckout(state.scores[i],state.outs[i])?'finish-possible':'finish-impossible') : '';
    $('s'+i).classList.remove('finish-possible','finish-impossible');
    if(restColor)$('s'+i).classList.add(restColor);
    const chips=[];
    if(state.max180[i]) chips.push('180er × '+state.max180[i]);
    if(state.highFinishes[i].length) chips.push('Highfinish: '+state.highFinishes[i].join(', '));
    if(state.shortLegs[i].length) chips.push('Short Legs: '+state.shortLegs[i].join(', ')+' Darts');
    $('high'+i).replaceChildren(...chips.map(t=>{const el=document.createElement('span');el.textContent=t;return el;}));
    $('high'+i).hidden=chips.length===0;
    for (const tier of ['40','60','80','100','180']) $('hit'+i+'-'+tier).textContent=state.hits[i][tier];
    const suggestion=checkoutPath(state.scores[i],state.outs[i]);
    $('co-box'+i).hidden=state.finished || state.scores[i]>170 || !suggestion;
    $('co'+i).textContent=suggestion;
    $('dq'+i).textContent=!state.trackDoubles?'AUS':state.doubles[i]?(100*state.doubleHits[i]/state.doubles[i]).toFixed(1)+' %'+(state.doubleComplete[i]?'':' *'):'–';
    $('avg'+i).textContent = state.throws[i] ? (state.scored[i]/state.throws[i]*3).toFixed(2) : '0.00';
    $(i?'b':'a').classList.toggle('active', !state.finished && state.turn===i);
  }
  renderHistory();
  $('turn').textContent = state.finished ? 'MATCH BEENDET' : state.names[state.turn]+' ist dran';
  $('points').disabled = state.finished;
  syncMode();
  document.querySelectorAll('#score-form button').forEach(b=>b.disabled=state.finished);
}
// Der Modus ist nur eine Eingabehilfe; beide Wege verwenden dieselbe Spielwertung.
function syncMode(){
  const single=inputMode==='darts';
  $('mode-total').classList.toggle('selected',!single);
  $('mode-darts').classList.toggle('selected',single);
  $('mode-total').setAttribute('aria-pressed',String(!single));
  $('mode-darts').setAttribute('aria-pressed',String(single));
  $('dart-controls').hidden=!single;
  $('points').placeholder=single?'0–20':'0–180';
  $('submit-score').textContent=single?'DART EINTRAGEN':'AUFNAHME EINTRAGEN';
  document.querySelectorAll('[data-mult]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.mult)===multiplier));
  const total=dartDraft.reduce((a,d)=>a+d.value,0);
  $('dart-progress').textContent=`Dart ${Math.min(3,dartDraft.length+1)} von 3 · ${total} Punkte`+(dartDraft.length?' · '+dartDraft.map(d=>d.name).join(' / '):'');
}
function setMode(mode){
  if(inputMode===mode)return;
  if(dartDraft.length){$('message').textContent='Bitte erst die begonnene Einzeldart-Aufnahme abschließen oder rückgängig machen.';return;}
  inputMode=mode;multiplier=1;syncMode();
  $('message').textContent=mode==='darts'?'Einzeldart-Eingabe aktiviert.':'Gesamtscore-Eingabe aktiviert.';
}
function recordVisit(value,darts,finishingDouble=false,finishingTriple=false,doubleAttempts=0,doubleKnown=true){
  if (!state || state.finished || $('game-screen').hidden) return;
  const i=state.turn,remain=state.scores[i]-value,finish=remain===0;
  if(finish && state.outs[i]==='double' && !finishingDouble){$('message').textContent='Checkout muss auf einem Doppel oder Bull enden.';return false;}
  if(finish && state.outs[i]==='master' && !(finishingDouble||finishingTriple)){$('message').textContent='Checkout muss auf Doppel, Triple oder Bull enden.';return false;}
  if(finish && state.outs[i]!=='single' && value===1){$('message').textContent='1 Punkt ist kein gültiger Double/Master-Out-Checkout.';return false;}
  history.push(clone(state));
  state.doubles[i]+=doubleAttempts; if(!doubleKnown)state.doubleComplete[i]=false;
  const valid=remain>=0 && !(remain===1 && state.outs[i]!=='single');
  const credited=valid?value:0;
  state.last[i]=credited;state.visits[i].push(credited);
  if(valid && value>=40){const tier=value===180?'180':value>=100?'100':value>=80?'80':value>=60?'60':'40';state.hits[i][tier]++;}
  if(valid && value===180)state.max180[i]++;
  state.legDarts[i]+=darts;state.throws[i]+=darts;
  if(!valid){state.turn=1-i;$('message').textContent='Bust! Aufnahme zählt 0.';}
  else{
    state.scores[i]=remain;state.scored[i]+=value;
    if(finish){
      if(state.outs[i]==='double' || (state.outs[i]==='master' && finishingDouble && !finishingTriple))state.doubleHits[i]++;
      if(value>=100)state.highFinishes[i].push(value);
      if(state.legDarts[i]<=18)state.shortLegs[i].push(state.legDarts[i]);
      state.legs[i]++;
      if(state.legs[i]>=Math.ceil(state.bestOf/2)){
        state.finished=true;$('message').textContent='GAME SHOT AND THE MATCH! '+state.names[i]+' gewinnt '+state.legs[0]+':'+state.legs[1]+'.';$('message').classList.add('match-finished');
      }else{
        $('message').textContent='Game shot! '+state.names[i]+' gewinnt das Leg.';
        state.scores=state.starts.slice();state.legDarts=[0,0];state.legStarter=1-state.legStarter;state.turn=state.legStarter;
      }
    }else{state.turn=1-i;$('message').textContent=state.names[i]+': '+value+' Punkte.';}
  }
  $('points').value='';render();return true;
}
function beginDoubleAsk(visit){
 pendingVisit=visit;
 $('double-overlay').hidden=false; document.body.classList.add('dialog-open');
 $('double-error').textContent='';
 $('double-custom').value='';
 $('double-title').textContent=visit.finish?'CHECKOUT BESTÄTIGEN':'DOPPELVERSUCHE';
 $('double-prompt').textContent=visit.finish?'Wie viele Darts in dieser Aufnahme und wie viele Doppelversuche?':'Wie viele Darts wurden in dieser Aufnahme auf Doppel versucht?';
 let dartsEl=$('finish-darts');
 if(!dartsEl){dartsEl=document.createElement('select');dartsEl.id='finish-darts';dartsEl.innerHTML='<option value="1">1 Dart</option><option value="2">2 Darts</option><option value="3" selected>3 Darts</option>';$('double-prompt').after(dartsEl);}
 dartsEl.hidden=!visit.finish;
 $('double-custom').hidden=true;$('double-save').hidden=true;
 $('message').textContent='Bitte Doppelversuche bestätigen.';
}
function completeDoubleAsk(attempts){
 if(!pendingVisit)return;
 const visit=pendingVisit,i=state.turn;
 if(!Number.isInteger(attempts)||attempts<0||attempts>3){$('double-error').textContent='Bitte eine gültige Anzahl zwischen 0 und 3 eingeben.';return;}
 if(visit.finish && state.outs[i]==='double' && attempts<1){$('double-error').textContent='Bei Double Out ist mindestens ein Doppelversuch erforderlich.';return;}
 const darts=visit.finish?Number($('finish-darts').value):3;
 if(visit.finish && attempts>darts){$('double-error').textContent='Mehr Doppelversuche als bisher geworfene Darts sind nicht möglich.';return;}
 pendingVisit=null;$('double-overlay').hidden=true;document.body.classList.remove('dialog-open');
 recordVisit(visit.value,darts,true,state.outs[i]==='master',attempts,true);
}
document.querySelectorAll('[data-double]').forEach(b=>b.addEventListener('click',()=>completeDoubleAsk(Number(b.dataset.double))));
$('double-more').addEventListener('click',()=>{$('double-custom').hidden=false;$('double-save').hidden=false;});
$('double-save').addEventListener('click',()=>{const raw=$('double-custom').value.trim();completeDoubleAsk(raw===''?NaN:Number(raw));});
function submit(){
  if(!state || state.finished || $('game-screen').hidden || pendingVisit)return;
  const raw=$('points').value.trim(),v=Number(raw);
  if(inputMode==='darts'){
    if(raw===''||!Number.isInteger(v)||v<0||v>20){$('message').textContent='Trefferfeld 0 bis 20 eingeben, oder 25 / Bull / Fehlwurf wählen.';return;}
    addDart(v*multiplier,v===0?'MISS':('SDT'[multiplier-1]+v),multiplier===2,multiplier===3);return;
  }
  if(raw===''||!Number.isInteger(v)||v<0||v>180){$('message').textContent='Bitte 0 bis 180 Punkte eingeben.';return;}
  // Im Gesamtscore-Modus bestätigt der Spieler bei exaktem Rest ein regelkonformes Finish.
  const i=state.turn,remaining=state.scores[i],finish=v===remaining;
  if(finish && state.trackDoubles){beginDoubleAsk({value:v,finish:true});return;}
  if(finish){recordVisit(v,3,true,true,0,false);return;}
  if(state.trackDoubles && state.outs[i]!=='single' && remaining<=170 && remaining-v>=0 && (remaining<=100 || remaining-v<=100)){beginDoubleAsk({value:v,finish:false});return;}
  recordVisit(v,3,true,true,0,!(state.outs[i]!=='single' && remaining<=170));
}
function addDart(value,name,isDouble=false,isTriple=false){
  if(!state||state.finished||inputMode!=='darts'||pendingVisit)return;
  const i=state.turn,prior=dartDraft.reduce((a,d)=>a+d.value,0);
  const rest=state.scores[i]-prior-value;
  const validFinish=state.outs[i]==='single'||(state.outs[i]==='double'&&isDouble)||(state.outs[i]==='master'&&(isDouble||isTriple));
  // Ein ungültiger Checkout ist ein Bust und beendet die Aufnahme sofort.
  const bust=rest<0||(rest===1&&state.outs[i]!=='single')||(rest===0&&!validFinish);
  dartDraft.push({value,name,isDouble,isTriple,doubleAttempt:isDouble && state.outs[i]!=='single' && state.scores[i]-prior<=50});
  $('points').value='';
  if(bust||rest===0||dartDraft.length===3){
    const darts=dartDraft.length,total=dartDraft.reduce((a,d)=>a+d.value,0);
    const last=dartDraft[dartDraft.length-1], attempts=dartDraft.filter(d=>d.doubleAttempt).length;dartDraft=[];
    // Ungültige Finish-Darts zählen als Bust, statt die Eingabe zurückzuweisen.
    const result=bust?recordVisit(state.scores[i]+1,darts,false,false,attempts,false):recordVisit(total,darts,last.isDouble,last.isTriple,attempts,false);
    if(result&&bust)$('message').textContent='Bust! Aufnahme zählt 0.';
  }else{$('message').textContent=name+' getroffen. Nächster Dart.';}
  syncMode();
}
$('setup-form').addEventListener('submit',startMatch);
$('new').addEventListener('click',()=>{ if(pendingVisit)return; if(confirm('Aktuelles Match verlassen und neues Match vorbereiten?')) showSetup(); });
$('score-form').addEventListener('submit',e=>{e.preventDefault();submit();});
$('mode-total').addEventListener('click',()=>{if(!pendingVisit)setMode('total')});
$('mode-darts').addEventListener('click',()=>{if(!pendingVisit)setMode('darts')});
document.querySelectorAll('[data-mult]').forEach(b=>b.addEventListener('click',()=>{multiplier=Number(b.dataset.mult);syncMode();}));
$('dart-25').addEventListener('click',()=>addDart(25,'25'));
$('dart-bull').addEventListener('click',()=>addDart(50,'BULL',true));
$('dart-miss').addEventListener('click',()=>addDart(0,'MISS'));
document.querySelectorAll('[data-digit]').forEach(b=>b.addEventListener('click',()=>{
  if (!pendingVisit && !state?.finished && $('points').value.length<(inputMode==='darts'?2:3)) $('points').value+=b.dataset.digit;
}));
$('clear').addEventListener('click',()=>{if(!pendingVisit)$('points').value='';});
$('backspace').addEventListener('click',()=>{if(!pendingVisit)$('points').value=$('points').value.slice(0,-1);});
// Globale Tastatureingabe funktioniert auch nach Klicks auf Undo, Buttons und andere Bereiche.
window.addEventListener('keydown',e=>{
  if (!state || state.finished || $('game-screen').hidden || pendingVisit || e.ctrlKey || e.altKey || e.metaKey) return;
  // Die Namenseingabe im Match-Setup bleibt unberührt; im Scorer ist das Punktefeld readonly.
  if (e.target.matches('input:not(#points),textarea,select,[contenteditable="true"]')) return;
  const field=$('points');
  if (/^\d$/.test(e.key)) {
    e.preventDefault();
    if (field.value.length<(inputMode==='darts'?2:3)) field.value+=e.key;
  } else if (e.key==='Backspace') {
    e.preventDefault(); field.value=field.value.slice(0,-1);
  } else if (e.key==='Enter') {
    // Bei fokussiertem Submit-Button erledigt dessen Standardaktion das Absenden.
    if (e.target.matches('button[type="submit"]')) return;
    e.preventDefault(); submit();
  }
});
$('undo').addEventListener('click',()=>{
  if(pendingVisit){$('double-error').textContent='Bitte die Doppelversuche bestätigen, bevor das Spiel weitergeht.';return;}
  if(dartDraft.length){dartDraft.pop();$('points').value='';syncMode();$('message').textContent='Letzten Dart zurückgenommen.';return;}
  if (!history.length) { $('message').textContent='Nichts rückgängig zu machen.'; return; }
  state=history.pop(); $('message').classList.remove('match-finished');
  $('message').textContent='Letzte Aufnahme zurückgenommen.'; render();
});
showSetup();
