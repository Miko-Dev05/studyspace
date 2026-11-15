/* StudySpace Cloud V1.2 — utilisation facultative, aucune clé privée côté client. */
'use strict';
(() => {
  const cfg=window.STUDYSPACE_SUPABASE||{};
  const ready=Boolean(cfg.url?.startsWith('https://')&&!cfg.url.includes('REMPLACER')&&cfg.publishableKey&&!cfg.publishableKey.includes('REMPLACER'));
  const client=ready&&window.supabase?.createClient(cfg.url,cfg.publishableKey);
  const bridge=()=>window.studyBridge;
  let user=null, active=false, dirty=false, busy=false, lastSeen=null, timer=null, lastError='';
  const tag='studyspace_cloud_user_';
  const status=document.getElementById('status-label');
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateText=s=>s?new Date(s).toLocaleString('fr-FR'):'Jamais';
  function stamp(){if(!user)return;localStorage.setItem(tag+user.id,JSON.stringify({active,lastSeen,dirty}));}
  function loadStamp(){try{const saved=JSON.parse(localStorage.getItem(tag+user.id)||'{}');active=!!saved.active;lastSeen=saved.lastSeen||null;dirty=!!saved.dirty}catch{active=false;lastSeen=null;dirty=false}}
  function setStatus(msg,problem=false){lastError=problem?msg:'';if(status){status.textContent='● '+msg;status.style.color=problem?'#b36a3d':active?'#3c8b6d':'#65748d'}if(document.getElementById('cloud-panel'))render()}
  function errorText(err){return err?.message||String(err)}
  function toMs(s){return s?new Date(s).getTime():0}
  function pending(){return !!(active&&user&&dirty)}
  function schedule(){clearTimeout(timer);timer=setTimeout(()=>{if(pending())push().catch(e=>setStatus('Erreur de synchronisation : '+errorText(e),true))},1600)}
  function markDirty(){if(!active||!user)return;dirty=true;stamp();setStatus('Modifications à envoyer');schedule()}
  async function remote(){const {data,error}=await client.from('studyspace_data').select('content,updated_at').eq('user_id',user.id).maybeSingle();if(error)throw error;return data}
  async function fileUpload(doc){if(doc.bundled||doc.type==='note')return;const blob=await bridge().fileGet(doc.id);
    if(!blob)return; // déjà dans le cloud et non encore téléchargé sur cet appareil
    if(blob.size>50*1024*1024)throw Error('Document trop volumineux (>50 Mo) : '+doc.name);
    const path=user.id+'/'+doc.id;const {error}=await client.storage.from('studyspace-files').upload(path,blob,{upsert:true,contentType:blob.type||'application/octet-stream'});
    if(error)throw Error('Fichier '+doc.name+' : '+errorText(error));
  }
  async function push({force=false}={}){if(!client||!user||!active||busy)return;busy=true;clearTimeout(timer);setStatus('Envoi vers le cloud…');
    try{
      const other=await remote();
      if(!force&&other&&toMs(other.updated_at)>toMs(lastSeen)+1000){dirty=true;stamp();setStatus('Conflit : données plus récentes dans le cloud. Choisis une version dans Synchronisation.',true);return}
      const snapshot=bridge().getState();for(const doc of snapshot.documents)await fileUpload(doc);
      const now=new Date().toISOString();const {error}=await client.from('studyspace_data').upsert({user_id:user.id,content:snapshot,updated_at:now},{onConflict:'user_id'});
      if(error)throw error;dirty=false;lastSeen=now;stamp();setStatus('Synchronisé · '+dateText(now));
    }catch(e){dirty=true;stamp();setStatus('Échec de l’envoi : '+errorText(e),true)}finally{busy=false}
  }
  async function download(id){if(!user||!active)return null;const path=user.id+'/'+id;const {data,error}=await client.storage.from('studyspace-files').download(path);if(error)throw error;await bridge().filePut(id,data);return data}
  async function pull({force=false,quiet=false}={}){if(!client||!user||busy)return;busy=true;setStatus('Vérification du cloud…');
    try{const other=await remote();if(!other){setStatus('Le cloud est vide : envoie les cours de ton appareil');return}
      if(dirty&&!force){setStatus('Changements locaux non envoyés : transfert bloqué pour éviter une perte',true);return}
      if(!force&&toMs(other.updated_at)<=toMs(lastSeen)+1000){setStatus('À jour · '+dateText(lastSeen));return}
      bridge().setState(other.content);lastSeen=other.updated_at;dirty=false;active=true;stamp();setStatus('Cours récupérés · '+dateText(lastSeen));if(!quiet)bridge().toast('Cours du cloud récupérés');
    }catch(e){setStatus('Erreur de réception : '+errorText(e),true)}finally{busy=false}
  }
  async function initializeCloud(){if(!user||busy)return;
    const other=await remote();if(other){if(!confirm('Des cours sont déjà dans le cloud. Remplacer les données locales de cet appareil par les cours du cloud ? Exporte d’abord une sauvegarde si nécessaire.'))return;
      active=true;dirty=false;stamp();await pull({force:true});
    }else{if(!confirm('Ce cloud est vide. Envoyer les cours locaux de cet appareil vers ton compte ? Pense à exporter une sauvegarde avant.'))return;
      active=true;dirty=true;lastSeen=null;stamp();await push();}
    render();
  }
  async function sendNow(){if(!active)return;dirty=true;stamp();await push()}
  async function receiveNow(){if(!active)return;const text=dirty?'Tu as des modifications locales NON synchronisées. Elles seront remplacées par le cloud. Continuer ?':'Récupérer les données du cloud sur cet appareil ? Les données locales différentes seront remplacées.';if(!confirm(text))return;await pull({force:true})}
  async function forceSend(){if(!active)return;if(!confirm('ÉCRASER la version du cloud par les cours de cet appareil ? Les modifications faites ailleurs peuvent être perdues. Es-tu sûr ?'))return;dirty=true;stamp();await push({force:true})}
  async function login(signUp){if(!client){bridge().toast('Configure Supabase dans config.js');return}
    const email=document.getElementById('cloud-email')?.value.trim();const password=document.getElementById('cloud-password')?.value;
    if(!email||!password){bridge().toast('Indique un e-mail et un mot de passe.');return}
    if(password.length<6){bridge().toast('Le mot de passe doit contenir au moins 6 caractères.');return}
    setStatus(signUp?'Création du compte…':'Connexion…');
    const {data,error}=signUp?await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}}):await client.auth.signInWithPassword({email,password});
    if(error){setStatus('Connexion impossible : '+errorText(error),true);return}
    if(signUp&&!data.session){setStatus('Compte créé : vérifie tes e-mails puis connecte-toi.');return}
    await onUser(data.user||data.session?.user);
  }
  async function logout(){if(dirty&&!confirm('Des changements locaux ne sont pas encore envoyés. Te déconnecter quand même ?'))return;await client.auth.signOut();user=null;active=false;dirty=false;lastSeen=null;setStatus('Mode local');render()}
  async function onUser(next){if(!next){user=null;active=false;lastSeen=null;dirty=false;setStatus('Mode local');return}
    if(user?.id===next.id)return;user=next;loadStamp();setStatus(active?'Connecté · vérification…':'Connecté · choisir la première synchronisation');render();if(active&&!dirty)await pull({quiet:true});else if(active&&dirty)schedule()}
  function render(){const panel=document.getElementById('cloud-panel');if(!panel)return;
    if(!ready){panel.innerHTML=`<div class="warning"><b>Cloud non configuré.</b> Crée un projet Supabase, exécute le fichier <code>supabase_setup.sql</code>, puis renseigne <code>config.js</code>. Voir <code>GUIDE_SYNCHRONISATION.md</code>.</div>`;return}
    if(!client){panel.innerHTML='<div class="warning">Bibliothèque Supabase indisponible : vérifie la connexion Internet.</div>';return}
    if(!user){panel.innerHTML=`<div class="panel"><h3>Se connecter</h3><p>Utilise exactement la même adresse e-mail et le même mot de passe sur ton ordinateur et sur ton téléphone.</p><div class="form-field"><label>E-mail</label><input type="email" id="cloud-email" autocomplete="email" placeholder="toi@exemple.fr"></div><div class="form-field"><label>Mot de passe (6 caractères minimum)</label><input type="password" id="cloud-password" autocomplete="current-password"></div><div class="cloud-actions"><button class="primary" id="cloud-login">Connexion</button><button class="secondary" id="cloud-signup">Créer un compte</button></div><p class="cloud-help">Après inscription, il faudra peut-être confirmer ton adresse e-mail.</p></div>`;return}
    panel.innerHTML=`<div class="panel"><h3>Compte connecté</h3><p><strong>${escape(user.email)}</strong></p><div class="cloud-status">● ${escape(lastError|| (active?'Cloud actif':'Première connexion'))}</div><p class="cloud-help">Dernière version connue : ${escape(dateText(lastSeen))}. ${dirty?'⚠ Modifications locales en attente.':'Tes données locales sont conservées pour une utilisation hors ligne.'}</p>${!active?`<p>Avant de commencer, <strong>exporte une sauvegarde</strong>. Puis clique sur « Relier cet appareil ». Si le cloud contient déjà tes cours, ils seront proposés au téléchargement ; sinon tes cours locaux seront envoyés.</p><div class="cloud-actions"><button class="primary" id="cloud-start">Relier cet appareil</button></div>`:`<div class="cloud-actions"><button class="primary" id="cloud-send">Envoyer mes changements</button><button class="secondary" id="cloud-receive">Récupérer depuis le cloud</button><button class="secondary" id="cloud-force">Remplacer le cloud par mes cours locaux</button></div><p class="cloud-help">Les modifications sont aussi envoyées automatiquement après un changement lorsque la connexion fonctionne. Les changements venant de l'autre appareil sont vérifiés au retour sur l'application et environ toutes les 45 secondes.</p>`}<div class="cloud-actions"><button class="secondary" id="cloud-logout">Déconnexion</button><button class="secondary" data-nav="backup">Exporter une sauvegarde</button></div></div>`;
  }
  document.addEventListener('click',e=>{const id=e.target.closest('button')?.id;if(!id?.startsWith('cloud-'))return;
    const task={'cloud-login':()=>login(false),'cloud-signup':()=>login(true),'cloud-start':initializeCloud,'cloud-send':sendNow,'cloud-receive':receiveNow,'cloud-force':forceSend,'cloud-logout':logout}[id];if(task)task().catch(err=>setStatus(errorText(err),true));});
  window.studyCloud={markDirty,download,enabled:()=>Boolean(client&&user&&active),render};
  if(client){client.auth.getUser().then(({data,error})=>{if(!error)onUser(data?.user)}).catch(()=>{});
    client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT')onUser(null);else if(session?.user)setTimeout(()=>onUser(session.user),0)});
    setInterval(()=>{if(user&&active&&!busy){if(dirty)schedule();else if(document.visibilityState==='visible')pull({quiet:true}).catch(()=>{})}},45000);
    window.addEventListener('focus',()=>{if(user&&active&&!busy&&!dirty)pull({quiet:true}).catch(()=>{})});
    window.addEventListener('online',()=>{if(user&&active&&dirty)schedule()});
  }
})();
