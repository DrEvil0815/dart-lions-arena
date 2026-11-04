/* V4.21: Nur Berechtigungsprüfung. Keine Kidskonto-Erstellung. */
(() => {
  'use strict';
  const url = 'https://bdksasxpkyedqsiwhdrv.supabase.co';
  const key = 'sb_publishable_LeFzQgloy5_uTM7dBBB7YA_k6qbOO7o';
  if (!window.supabase) return;
  const client = window.supabase.createClient(url, key, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  let container;
  async function show() {
    const dashboard = document.getElementById('dashboard');
    if (!dashboard) return;
    const {data:{user},error:authError} = await client.auth.getUser();
    if (authError || !user) {container?.remove();container=null;return;}
    const {data:roles,error:roleError} = await client.from('app_roles').select('role').eq('user_id',user.id).in('role',['admin','trainer']);
    if (roleError || !roles?.length) {container?.remove();container=null;return;}
    if (!container) {
      container = document.createElement('div');
      container.className='kids-admin-check';
      container.innerHTML='<button type="button" id="kids-admin-check-button">KIDS-VERWALTUNG · BERECHTIGUNG TESTEN</button><span id="kids-admin-check-result" role="status" aria-live="polite"></span>';
      const main = dashboard.querySelector('.dl-dashboard-main') || dashboard;
      main.appendChild(container);
      container.querySelector('button').addEventListener('click', async (event) => {
        const button=event.currentTarget;
        const output=container.querySelector('#kids-admin-check-result');
        button.disabled=true;output.textContent='Berechtigung wird geprüft …';
        try {
          const {data:{session}}=await client.auth.getSession();
          if (!session?.access_token) throw new Error('Bitte erneut anmelden.');
          const response=await fetch(url+'/functions/v1/kids-account-admin',{method:'POST',headers:{'Content-Type':'application/json','apikey':key,'Authorization':'Bearer '+session.access_token},body:'{}'});
          const body=await response.json().catch(()=>({}));
          output.textContent=response.ok&&body.success?'✓ Berechtigung bestätigt: '+(body.roles||[]).join(', '):'Prüfung fehlgeschlagen ('+response.status+'): '+(body.error||body.message||'Unbekannter Fehler');
        }catch(error){output.textContent='Verbindung fehlgeschlagen: '+error.message;}
        finally{button.disabled=false;}
      });
    }
  }
  client.auth.onAuthStateChange(()=>setTimeout(show,0));
  document.addEventListener('DOMContentLoaded',show);
  if(document.readyState!=='loading')show();
})();
