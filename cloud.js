/* Dart Lions Arena – Supabase connection (public publishable key only) */
'use strict';
window.ArenaCloud=(()=>{
 const url='https://bdksasxpkyedqsiwhdrv.supabase.co';
 const key='sb_publishable_LeFzQgloy5_uTM7dBBB7YA_k6qbOO7o';
 const $=id=>document.getElementById(id);
 const client=window.supabase?.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 let user=null, profiles=[],selected=null,registerMode=false;
 const gate=()=>{document.documentElement.classList.toggle('auth-locked',!user);document.documentElement.classList.remove('auth-pending');if(user){const otherPageOpen=['choice-screen','setup-screen','game-screen','kids-screen'].some(id=>!$(id).hidden);if(!otherPageOpen){document.documentElement.classList.add('dash-home');$('dashboard').hidden=false;}else{document.documentElement.classList.remove('dash-home');$('dashboard').hidden=true;}}else{document.documentElement.classList.remove('dash-home');$('dashboard').hidden=true;}$('return-dashboard').hidden=!user||!$('dashboard').hidden;};
 const note=(s)=>{$('cloud-message').textContent=s;};
 const state=s=>{$('cloud-state').textContent=s;};
 async function refresh(){
   if(!client||!user)return;
   const {data,error}=await client.from('profiles').select('id,display_name,is_child,first_name,last_name,avatar_path').eq('owner_id',user.id).order('created_at');
   if(error){note('Profile nicht ladbar: '+error.message);return;}
   profiles=data||[];
   const sel=$('cloud-profile');const previous=selected;
   sel.replaceChildren();
   for(const p of profiles){const o=document.createElement('option');o.value=p.id;o.textContent=p.display_name+(p.is_child?' (Kids)':'');sel.append(o);}
   selected=profiles.some(p=>p.id===previous)?previous:(profiles[0]?.id||null);
   if(selected)sel.value=selected;
   sel.hidden=!profiles.length;
   updateName();await updateDashboard();
   note(profiles.length?'Profil bereit. Neue Trainings werden in Supabase gespeichert.':'Kein Spielerprofil vorhanden. Bitte Profilanlage prüfen.');
 }
 function activeProfile(){return profiles.find(p=>p.id===selected)||null;}
 function updateName(){const p=activeProfile();const name=p?.display_name||'';const shown=$('cloud-player-name');if(shown)shown.textContent=name?('SPIELER: '+name):'';const input=$('cloud-display-name');if(input)input.value=name;const editor=$('cloud-name-editor');if(editor)editor.hidden=!user||!p;const kids=$('kids-name');if(kids&&name&&(!kids.value.trim()||kids.dataset.profileAutofill==='true')){kids.value=name;kids.dataset.profileAutofill='true';kids.dispatchEvent(new Event('change'));}if($('dash-name'))$('dash-name').textContent=name||'Spieler';if($('dash-fullname'))$('dash-fullname').textContent=[p?.first_name,p?.last_name].filter(Boolean).join(' ');const p1=$('p1');if(p1){p1.value=name||'Spieler 1';p1.readOnly=true;}window.dispatchEvent(new CustomEvent('arena-profile-changed',{detail:{name,profileId:selected}}));}
 async function rename(){const p=activeProfile();if(!client||!user||!p)return;const input=$('cloud-display-name');const name=input.value.trim();if(name.length<3||Array.from(name).length>20){note('Spielername: Bitte 3 bis 20 Zeichen eingeben.');return;}const {error}=await client.from('profiles').update({display_name:name}).eq('id',p.id).eq('owner_id',user.id);if(error){note('Name nicht gespeichert: '+error.message);return;}p.display_name=name;const opt=Array.from($('cloud-profile').options).find(o=>o.value===p.id);if(opt)opt.textContent=name+(p.is_child?' (Kids)':'');updateName();note('Spielername gespeichert.');}
 async function setUser(next){user=next;gate();$('cloud-email').hidden=!!user;$('cloud-password').hidden=!!user;$('cloud-login').hidden=!!user;$('cloud-signup').hidden=!!user;$('cloud-logout').hidden=!user;$('cloud-refresh').hidden=!user;
   if(user){registerMode=false;setRegisterUI();state('Angemeldet: '+(user.email||'Benutzer'));await refresh();}
   else{state('Bitte anmelden oder registrieren');selected=null;profiles=[];$('cloud-profile').hidden=true;updateName();note('');}
 }
 async function authenticate(register){if(!client){note('Supabase-Bibliothek nicht geladen. Internetverbindung prüfen.');return;}
   const email=$('cloud-email').value.trim(),password=$('cloud-password').value;
   if(!email||!password){note('Bitte E-Mail und Passwort eingeben.');return;}
   note('Bitte warten …');
   let options; if(register){const first=$('reg-first').value.trim(),last=$('reg-last').value.trim(),name=$('reg-name').value.trim();if(!first||!last||!name){note('Bitte Vorname, Nachname und Spielernamen eingeben.');return;}if(Array.from(name).length<3||Array.from(name).length>20||/[\x00-\x1f\x7f]/.test(name)){note('Spielername muss 3–20 sichtbare Zeichen haben.');return;}if(password.length<8||password!==$('reg-repeat').value){note('Passwörter müssen übereinstimmen und mindestens 8 Zeichen lang sein.');return;}options={data:{first_name:first,last_name:last,display_name:name}};/* The database unique index, not a client-side lookup, enforces uniqueness. */}const {data,error}=register?await client.auth.signUp({email,password,options}):await client.auth.signInWithPassword({email,password});
   if(error){note('Anmeldung fehlgeschlagen: '+error.message);return;}
   if(register&&!data.session){registerMode=false;setRegisterUI();note('Registrierung eingegangen. Bitte Bestätigungs-E-Mail öffnen und danach anmelden.');return;}
   await setUser(data.user||null);
 }
 function setRegisterUI(){const on=registerMode;$('registration-fields').hidden=!on;$('reg-repeat').hidden=!on;$('cloud-login').hidden=on;$('cloud-signup').hidden=on;$('cloud-register-submit').hidden=!on;$('cloud-register-back').hidden=!on;$('cloud-password').autocomplete=on?'new-password':'current-password';}
 $('cloud-login').addEventListener('click',()=>authenticate(false));$('cloud-signup').addEventListener('click',()=>{registerMode=true;setRegisterUI();note('Bitte alle Felder ausfüllen.');});$('cloud-register-back').addEventListener('click',()=>{registerMode=false;setRegisterUI();note('');});$('cloud-register-submit').addEventListener('click',()=>authenticate(true));
 $('cloud-logout').addEventListener('click',async()=>{if(client){const {error}=await client.auth.signOut();if(error){note(error.message);return;}}await setUser(null);});
 $('cloud-profile').addEventListener('change',()=>{selected=$('cloud-profile').value;updateName();});
 $('cloud-save-name').addEventListener('click',rename);$('cloud-display-name').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();rename();}});
 $('dash-logout').addEventListener('click',()=> $('cloud-logout').click());
 $('dash-local').addEventListener('click',()=>{document.documentElement.classList.remove('dash-home');$('dashboard').hidden=true;$('choice-screen').hidden=false;document.querySelector('[data-game-type="human"]')?.click();});
 $('dash-training').addEventListener('click',()=>{document.documentElement.classList.remove('dash-home');$('dashboard').hidden=true;$('choice-screen').hidden=false;document.querySelector('[data-game-type="bot"]')?.click();});
 $('dash-kids').addEventListener('click',()=>{document.documentElement.classList.remove('dash-home');$('dashboard').hidden=true;$('choice-screen').hidden=false;$('open-kids')?.click();});
 $('return-dashboard').addEventListener('click',()=>{const game=$('game-screen');if(!game.hidden&&!confirm('Laufendes Match verlassen? Nicht gespeicherte Matchdaten gehen verloren.'))return;window.ArenaReturnDashboard?.();});
 $('dash-avatar-file').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file||!user||!selected)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2*1024*1024){note('Nur JPG, PNG oder WebP bis 2 MB.');return;}const path=user.id+'/'+selected+'.'+({ 'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[file.type]);const {error}=await client.storage.from('avatars').upload(path,file,{upsert:true,contentType:file.type});if(error){note('Bild nicht gespeichert: '+error.message+' (Storage-Bucket avatars prüfen)');return;}const {error:upErr}=await client.from('profiles').update({avatar_path:path}).eq('id',selected).eq('owner_id',user.id);if(upErr){note(upErr.message);return;}activeProfile().avatar_path=path;await updateDashboard();note('Profilbild gespeichert.');});
 async function updateDashboard(){const p=activeProfile();if(!p||!client)return;const avatar=$('dash-avatar');avatar.src='dart-lions-logo.png';if(p.avatar_path){const {data}=await client.storage.from('avatars').createSignedUrl(p.avatar_path,3600);if(data?.signedUrl)avatar.src=data.signedUrl;}['stat-average','stat-matches','stat-wins','stat-losses','stat-180'].forEach(id=>$(id).textContent='—');$('dash-status').textContent='Matchstatistiken werden angezeigt, sobald die Match-Erfassung mit der Cloud verbunden ist. Trainingsdaten sind bereits separat gespeichert.';}
 $('cloud-refresh').addEventListener('click',async()=>{await refresh();window.dispatchEvent(new Event('arena-cloud-results-refresh'));});
 if(client){client.auth.getUser().then(({data,error})=>{if(!error)setUser(data.user||null);else {gate();note('Anmeldestatus nicht verfügbar. Bitte erneut anmelden.');}});client.auth.onAuthStateChange((_event,session)=>{const id=session?.user?.id||null;if(id!==user?.id)setTimeout(()=>setUser(session?.user||null),0);});}
 else {gate();note('Anmeldung derzeit nicht verfügbar. Bitte Internetverbindung prüfen und Seite neu laden.');}
 async function saveTraining({name,board,game,points,darts,hits}){
   if(!client||!user||!selected)return {saved:false,reason:'Nicht angemeldet oder kein Profil ausgewählt'};
   const start=new Date().toISOString();
   const {data,error}=await client.from('training_sessions').insert({owner_id:user.id,profile_id:selected,game_mode:game,status:'completed',started_at:start,finished_at:start,settings:{board,name},result_data:{points,darts,hits,board,name,average:darts?Number((points*3/darts).toFixed(2)):0}}).select('id').single();
   if(error)return {saved:false,reason:error.message};
   // Each three-dart visit is preserved; TOTAL scores are represented by TOTAL:n + two placeholders.
   const score=h=>h==='BULL'?50:h==='SB'?25:h==='MISS'?0:h.startsWith('TOTAL:')?Number(h.slice(6)):Number(h.slice(1))*(h[0]==='T'?3:h[0]==='D'?2:1);
   const rows=[];for(let i=0;i<hits.length;i+=3){rows.push({owner_id:user.id,session_id:data.id,turn_number:rows.length+1,points:hits.slice(i,i+3).reduce((a,h)=>a+score(h),0),darts_used:Math.min(3,hits.length-i)});}
   if(rows.length){const {error:throwError}=await client.from('training_throws').insert(rows);if(throwError)return {saved:false,reason:'Training gespeichert, Aufnahmen fehlgeschlagen: '+throwError.message};}
   return {saved:true};
 }
 async function getTrainings(){if(!client||!user||!selected)return {data:[],error:null};return client.from('training_sessions').select('id,game_mode,finished_at,result_data').eq('owner_id',user.id).eq('profile_id',selected).eq('status','completed').order('finished_at',{ascending:false}).limit(100);}
 return {saveTraining,getTrainings,isLoggedIn:()=>!!user,selectedProfile:()=>selected,playerName:()=>activeProfile()?.display_name||'',note};
})();
