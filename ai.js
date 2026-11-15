/* StudySpace V2 — aide aux révisions avec clé personnelle en mémoire temporaire. */
'use strict';
(() => {
  let apiKey = '', result = '', currentChapter = '', working = false;
  let lastPrompt = '', lastMode = 'fiche', lastSource = '';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $ = s => document.querySelector(s);
  const notice = m => { const el = $('#ai-status'); if (el) el.textContent = m; };
  const bridge = () => window.studyBridge;
  const course = () => bridge().getState();
  const fname = t => (t || 'fiche-de-revision').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').slice(0,75);

  function render() {
    const panel = $('#ai-panel'); if (!panel) return;
    const subjects = course().subjects;
    const chapters = course().chapters;
    const options = chapters.map(c => `<option value="${esc(c.id)}" ${currentChapter === c.id ? 'selected':''}>${esc(subjects.find(s=>s.id===c.subjectId)?.name||'Matière')} · ${esc(c.name)}</option>`).join('');
    if (!currentChapter || !chapters.find(c=>c.id===currentChapter)) currentChapter = chapters[0]?.id || '';
    const docs = course().documents.filter(d=>d.chapterId===currentChapter);
    panel.innerHTML = `<div class="warning"><b>À savoir :</b> l'API OpenAI est facturée séparément de ChatGPT. Ta clé n'est pas sauvegardée dans StudySpace : elle reste uniquement en mémoire jusqu'au rechargement ou à la fermeture de la page. Pour activer l'IA, il faut publier la fonction Supabase <code>studyspace-ai</code> (instructions dans le ZIP).</div>
    <div class="ai-layout">
      <section class="ai-panel"><h3>✦ Ta demande</h3>
        <div class="form-field"><label for="ai-key">Clé personnelle OpenAI (non enregistrée)</label><input type="password" id="ai-key" autocomplete="off" placeholder="sk-..." value="" /><small class="hint">${apiKey?'Clé présente dans cette session.':'Nécessaire pour utiliser l’IA.'}</small></div>
        <div class="ai-grid">
          <div class="form-field"><label for="ai-chapter">Chapitre de destination</label><select id="ai-chapter">${options}</select></div>
          <div class="form-field"><label for="ai-mode">Type de demande</label><select id="ai-mode"><option value="fiche">Fiche de révision</option><option value="resume">Résumé court</option><option value="quiz">Quiz avec correction</option><option value="explication">Explication du cours</option></select></div>
        </div>
        <div class="form-field"><label for="ai-document">Document déjà enregistré (facultatif)</label><select id="ai-document"><option value="">Aucun document</option>${docs.map(d=>`<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('')}</select></div>
        <div class="form-field"><label for="ai-file">Ou joindre un nouveau PDF, une image ou un texte</label><input id="ai-file" type="file" accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp,application/pdf,image/*,text/plain" /><small class="hint">PDF ou image : 8 Mo maximum. Les documents envoyés sont transmis à OpenAI uniquement à ta demande.</small></div>
        <div class="form-field"><label for="ai-prompt">Instructions supplémentaires</label><textarea id="ai-prompt" rows="6" placeholder="Ex. : je veux 3 niveaux de lecture, les auteurs et des exemples concrets…"></textarea></div>
        <div class="ai-actions"><button class="secondary" id="ai-clear">Annuler</button><button class="primary" id="ai-generate">✦ Générer avec l'IA</button></div>
        <p id="ai-status" class="ai-status" aria-live="polite"></p>
      </section>
      <section class="ai-panel"><h3>Ta fiche générée</h3><div class="form-field"><label for="ai-title">Titre du document</label><input id="ai-title" maxlength="150" value="Ma fiche de révision" /></div><div class="form-field"><label for="ai-output">Contenu (modifiable avant sauvegarde)</label><textarea id="ai-output" class="ai-output" placeholder="Ta fiche apparaîtra ici. Tu peux aussi rédiger ou coller une fiche toi-même et la sauvegarder gratuitement."></textarea></div>
        <div class="ai-actions"><button class="secondary" id="ai-download-pdf">↓ Télécharger PDF</button><button class="secondary" id="ai-save-pdf">Enregistrer PDF dans le chapitre</button><button class="primary" id="ai-save-note">Sauvegarder la fiche</button></div>
        <p class="ai-note">« Sauvegarder la fiche » ajoute une note dans ce chapitre, puis déclenche la synchronisation Supabase si elle est activée. « Enregistrer PDF » ajoute aussi un fichier PDF dans ce chapitre.</p>
      </section>
    </div>`;
    $('#ai-chapter').value = currentChapter;
    $('#ai-mode').value = lastMode;
    $('#ai-prompt').value = lastPrompt;
    $('#ai-output').value = result;
    $('#ai-document').value = docs.some(d=>d.id===lastSource)?lastSource:'';
  }

  async function encodeFile(file) {
    if (file.size > 8*1024*1024) throw Error('Fichier trop volumineux : 8 Mo maximum pour l’IA.');
    const dataUrl=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=()=>reject(fr.error);fr.readAsDataURL(file)});
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    let mime=file.type || (ext==='pdf'?'application/pdf':ext==='txt'?'text/plain':ext==='md'?'text/markdown':'image/jpeg');
    if(mime.startsWith('image/'))return {kind:'image',name:file.name,mime,data:dataUrl};
    if(mime==='application/pdf'||ext==='pdf')return {kind:'pdf',name:file.name,mime:'application/pdf',data:dataUrl};
    if(/^(txt|md)$/.test(ext)||mime.startsWith('text/'))return {kind:'text',name:file.name,text:await file.text()};
    throw Error('Format non pris en charge : utilise PDF, image, TXT ou MD.');
  }

  function updateDocumentList() {
    const dropdown=$('#ai-document');if(!dropdown)return;
    const docs=course().documents.filter(d=>d.chapterId===currentChapter);
    dropdown.innerHTML='<option value="">Aucun document</option>'+docs.map(d=>`<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('');
    lastSource='';
  }
  async function generate() {
    if(working)return;
    const userKey=String($('#ai-key')?.value||apiKey).trim();
    if(!userKey.startsWith('sk-')){notice('Entre d’abord une clé API OpenAI valide (sk-...).');return;}
    apiKey=userKey;
    const cloud=window.studyCloud;
    const client=cloud?.client;
    if(!client){notice('Supabase n’est pas configuré. Vérifie config.js.');return;}
    const {data:{session}}=await client.auth.getSession();
    if(!session?.access_token){notice('Connecte-toi d’abord dans Synchronisation.');return;}
    const mode=$('#ai-mode').value;
    const prompt=$('#ai-prompt').value.trim();
    const docId=$('#ai-document').value;
    const picked=$('#ai-file').files[0];
    if(!prompt && !docId && !picked){notice('Ajoute un document ou écris une consigne.');return;}
    let source=null;
    working=true;
    $('#ai-generate').disabled=true;
    notice('Analyse du cours en cours…');
    try {
      if(picked)source=await encodeFile(picked);
      else if(docId){const d=course().documents.find(x=>x.id===docId);if(!d)throw Error('Document introuvable');
        if(d.type==='note')source={kind:'text',name:d.name,text:d.body||''};
        else source=await encodeFile(new File([await bridge().resolveDoc(d)],d.name,{type:d.type==='pdf'?'application/pdf':d.type==='image'?'image/png':'text/plain'}));
      }
      const url=(window.STUDYSPACE_SUPABASE?.url||'').replace(/\/$/,'')+'/functions/v1/studyspace-ai';
      const response=await fetch(url, {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token,'apikey':window.STUDYSPACE_SUPABASE.publishableKey},body:JSON.stringify({apiKey,mode,prompt,source})});
      const payload=await response.json().catch(()=>({error:'Réponse serveur illisible'}));
      if(!response.ok)throw Error(payload.error||`Erreur HTTP ${response.status}`);
      result=String(payload.text||'').trim();
      if(!result)throw Error('L’IA a renvoyé une réponse vide.');
      $('#ai-output').value=result;
      $('#ai-title').value=mode==='quiz'?'Quiz de révision':mode==='resume'?'Résumé de cours':mode==='explication'?'Explication du cours':'Fiche de révision';
      notice('Fiche générée. Relis-la avant de l’enregistrer : une IA peut commettre des erreurs.');
    } catch(err){notice('Erreur : '+err.message)}
    finally{working=false;const btn=$('#ai-generate');if(btn)btn.disabled=false;}
  }

  function pdfBlob(title,text) {
    const PDF=window.jspdf?.jsPDF;
    if(!PDF)throw Error('Bibliothèque PDF indisponible : vérifie la connexion Internet.');
    const doc=new PDF({orientation:'portrait',unit:'mm',format:'a4'});
    const margin=18,maxWidth=174,pageHeight=297;let y=23;
    doc.setFont('helvetica','bold');doc.setFontSize(17);
    for(const line of doc.splitTextToSize(title,maxWidth)) {doc.text(line,margin,y);y+=8;}
    y+=6;doc.setFont('helvetica','normal');doc.setFontSize(11);
    // Les polices standard PDF ne couvrent pas tous les symboles (mathématiques avancées, emoji).
    for(const paragraph of text.replace(/\r/g,'').split('\n')) {
      const lines=doc.splitTextToSize(paragraph||' ',maxWidth);
      for(const line of lines){if(y>pageHeight-18){doc.addPage();y=20;}doc.text(line,margin,y);y+=6;}
      y+=paragraph?2:3;
    }
    return doc.output('blob');
  }
  function snapshotForm(){return {title:$('#ai-title')?.value.trim()||'Fiche de révision',text:$('#ai-output')?.value.trim()||'',chapterId:$('#ai-chapter')?.value};}
  async function save(type){const {title,text,chapterId}=snapshotForm();
    if(!text){notice('Écris ou génère une fiche avant de la sauvegarder.');return;}
    if(!chapterId){notice('Crée d’abord un chapitre.');return;}
    try{
      if(type==='note'){await bridge().addGeneratedNote(chapterId,title,text);notice('Fiche enregistrée localement. La synchro se lance si ton cloud est actif.');}
      else{const blob=pdfBlob(title,text);
        if(type==='download'){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=fname(title)+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);notice('PDF téléchargé.');}
        else{await bridge().addGeneratedPdf(chapterId,fname(title)+'.pdf',blob);notice('PDF enregistré dans le chapitre. Synchronisation lancée si activée.');}
      }
    }catch(err){notice('Erreur : '+err.message)}
  }
  document.addEventListener('click',e=>{
    const id=e.target.closest('button')?.id;
    if(!id||!id.startsWith('ai-'))return;
    if(id==='ai-generate')generate();
    else if(id==='ai-save-note')save('note');
    else if(id==='ai-save-pdf')save('pdf');
    else if(id==='ai-download-pdf')save('download');
    else if(id==='ai-clear'){
      if(!confirm('Annuler la saisie et effacer les modifications non enregistrées ?'))return;
      result='';lastPrompt='';lastSource='';render();notice('Saisie annulée.');
    }
  });
  document.addEventListener('input',e=>{if(e.target.id==='ai-output')result=e.target.value;if(e.target.id==='ai-prompt')lastPrompt=e.target.value;if(e.target.id==='ai-key')apiKey=e.target.value.trim();});
  document.addEventListener('change',e=>{if(e.target.id==='ai-chapter'){currentChapter=e.target.value;updateDocumentList();}if(e.target.id==='ai-mode')lastMode=e.target.value;if(e.target.id==='ai-document')lastSource=e.target.value;});
  window.studyAi={render};
  if(location.hash.startsWith('#ai'))render();
})();
