
(function(){
  const advanceOverlay = document.getElementById('genericAdvanceOverlay');
  const advanceTitle = document.getElementById('genericAdvanceTitle');
  const advanceText = document.getElementById('genericAdvanceText');
  const advanceSave = document.getElementById('genericAdvanceSave');
  const advanceContinue = document.getElementById('genericAdvanceContinue');

  const blockOverlay = document.getElementById('genericBlockOverlay');
  const blockTitle = document.getElementById('genericBlockTitle');
  const blockText = document.getElementById('genericBlockText');
  const blockSave = document.getElementById('genericBlockSave');
  const blockContinue = document.getElementById('genericBlockContinue');

  let advanceNext = null;
  let blockNext = null;
  let advanceSaveFn = null;
  let blockSaveFn = null;

  function openAdvance(opts){
    advanceTitle.textContent = opts.title || 'Excelente';
    advanceText.textContent = opts.text || 'Ya completaste esta parte del mapa. Podés seguir con la próxima pregunta o guardar tu avance para retomarlo después.';
    advanceSave.style.display = '';
    advanceContinue.textContent = 'Continuar';
    advanceNext = opts.onContinue || null;
    advanceSaveFn = opts.onSave || null;
    advanceOverlay.classList.add('active');
    advanceOverlay.setAttribute('aria-hidden', 'false');
  }
  function closeAdvance(){ advanceOverlay.classList.remove('active'); advanceOverlay.setAttribute('aria-hidden','true'); }

  function openBlock(opts){
    blockTitle.textContent = opts.title || 'Bloque completado';
    blockText.textContent = opts.text || 'Completaste este bloque del mapa.';
    blockSave.style.display = '';
    blockContinue.textContent = 'Continuar';
    blockNext = opts.onContinue || null;
    blockSaveFn = opts.onSave || null;
    blockOverlay.classList.add('active');
    blockOverlay.setAttribute('aria-hidden', 'false');
  }
  function closeBlock(){ blockOverlay.classList.remove('active'); blockOverlay.setAttribute('aria-hidden','true'); }

  advanceContinue.addEventListener('click', ()=>{ closeAdvance(); if(typeof advanceNext === 'function') advanceNext(); });
  advanceSave.addEventListener('click', ()=>{
    if(typeof advanceSaveFn === 'function') advanceSaveFn();
    advanceTitle.textContent = 'Avance guardado';
    advanceText.textContent = 'Tu respuesta quedó guardada en este navegador para continuar después.';
    advanceSave.style.display = 'none';
    advanceContinue.textContent = 'Cerrar';
  });
  blockContinue.addEventListener('click', ()=>{ closeBlock(); if(typeof blockNext === 'function') blockNext(); });
  blockSave.addEventListener('click', ()=>{
    if(typeof blockSaveFn === 'function') blockSaveFn();
    blockTitle.textContent = 'Avance guardado';
    blockText.textContent = 'Tu respuesta quedó guardada en este navegador para continuar después.';
    blockSave.style.display = 'none';
    blockContinue.textContent = 'Cerrar';
  });

  [advanceOverlay, blockOverlay].forEach(overlay => overlay.addEventListener('click', (e)=>{ if(e.target === overlay) overlay.classList.remove('active'); }));
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){
      if(advanceOverlay.classList.contains('active')) closeAdvance();
      if(blockOverlay.classList.contains('active')) closeBlock();
    }
  });

  function syncDone(index, complete){
    const done = getDone();
    const has = done.includes(index);
    if(complete && !has) done.push(index);
    if(!complete && has) done.splice(done.indexOf(index),1);
    setDone(done);
    paintProgress();
  }

  function bindSimpleQuestion(cfg){
    const field = document.getElementById(cfg.fieldId);
    const next = document.getElementById(cfg.nextId);
    const back = document.getElementById(cfg.backId);
    const key = cfg.storageKey;
    function save(){
      const value = field ? field.value : '';
      localStorage.setItem(key, value);
      syncDone(cfg.index, value.trim().length > 0);
      notifyReviewSync();
    }
    function load(){
      if(field) field.value = localStorage.getItem(key) || '';
      save();
    }
    if(field) field.addEventListener('input', save);
    if(back) back.addEventListener('click', (e)=>{ e.preventDefault(); if (typeof goBackToMap === 'function') goBackToMap(); else show('mapa'); });
    if(next) next.addEventListener('click', (e)=>{
      e.preventDefault();
      save();
      if(!(field && field.value.trim().length > 0)){
        openAdvance({
          title:'Antes de seguir',
          text: cfg.validationText || 'Completá el campo para poder avanzar.',
          onContinue: null,
          onSave: save
        });
        document.getElementById('genericAdvanceSave').style.display = 'none';
        document.getElementById('genericAdvanceContinue').textContent = 'Entendido';
        return;
      }
      openAdvance({ onContinue: ()=> show(cfg.nextScreen), onSave: save });
    });
    load();
    return {save};
  }

  const q4 = bindSimpleQuestion({ index:4, fieldId:'q4Text', nextId:'q4Next', backId:'backFromQ4', storageKey:'gdc_q4_text_v1', nextScreen:'pregunta5', validationText:'Describí a quién impacta el cambio para poder avanzar.' });
  const q5 = bindSimpleQuestion({ index:5, fieldId:'q5Text', nextId:'q5Next', backId:'backFromQ5', storageKey:'gdc_q5_text_v1', nextScreen:'pregunta6', validationText:'Describí la conducta observable para poder avanzar.' });
  const q7 = bindSimpleQuestion({ index:7, fieldId:'q7Text', nextId:'q7Next', backId:'backFromQ7', storageKey:'gdc_q7_text_v1', nextScreen:'pregunta8', validationText:'Describí la narrativa del cambio para poder avanzar.' });
  const q8 = bindSimpleQuestion({ index:8, fieldId:'q8Text', nextId:'q8Next', backId:'backFromQ8', storageKey:'gdc_q8_text_v1', nextScreen:'pregunta9', validationText:'Describí el despliegue del cambio para poder avanzar.' });

  // Q6 cierre bloque 2
  const q6Field = document.getElementById('q6Text');
  function saveQ6(){
    localStorage.setItem('gdc_q6_text_v1', q6Field ? q6Field.value : '');
    syncDone(6, q6Field && q6Field.value.trim().length > 0);
    notifyReviewSync();
  }
  if(q6Field){ q6Field.value = localStorage.getItem('gdc_q6_text_v1') || ''; q6Field.addEventListener('input', saveQ6); saveQ6(); }
  document.getElementById('backFromQ6')?.addEventListener('click', (e)=>{ e.preventDefault(); if (typeof goBackToMap === 'function') goBackToMap(); else show('mapa'); });
  document.getElementById('q6Next')?.addEventListener('click', (e)=>{
    e.preventDefault(); saveQ6();
    if(!(q6Field && q6Field.value.trim().length > 0)){
      openAdvance({ title:'Antes de seguir', text:'Completá el campo de riesgos generales para poder avanzar.', onSave: saveQ6 });
      document.getElementById('genericAdvanceSave').style.display = 'none';
      document.getElementById('genericAdvanceContinue').textContent = 'Entendido';
      return;
    }
    openBlock({ title:'Bloque 2 completado', text:'Entendés el impacto humano y riesgos principales. Ahora definamos los indicadores.', onContinue: ()=> show('pregunta7'), onSave: saveQ6 });
  });

  // Q9 cierre bloque 3
  const q9Impl = document.getElementById('q9Impl');
  const q9Adop = document.getElementById('q9Adop');
  function saveQ9(){
    localStorage.setItem('gdc_q9_impl_v1', q9Impl ? q9Impl.value : '');
    localStorage.setItem('gdc_q9_adop_v1', q9Adop ? q9Adop.value : '');
    syncDone(9, q9Impl && q9Impl.value.trim().length > 0 && q9Adop && q9Adop.value.trim().length > 0);
    notifyReviewSync();
  }
  if(q9Impl) q9Impl.value = localStorage.getItem('gdc_q9_impl_v1') || '';
  if(q9Adop) q9Adop.value = localStorage.getItem('gdc_q9_adop_v1') || '';
  [q9Impl, q9Adop].forEach(el => el && el.addEventListener('input', saveQ9));
  saveQ9();
  document.getElementById('backFromQ9')?.addEventListener('click', (e)=>{ e.preventDefault(); if (typeof goBackToMap === 'function') goBackToMap(); else show('mapa'); });
  document.getElementById('q9Next')?.addEventListener('click', (e)=>{
    e.preventDefault(); saveQ9();
    if(!(q9Impl && q9Impl.value.trim().length > 0 && q9Adop && q9Adop.value.trim().length > 0)){
      openAdvance({ title:'Antes de seguir', text:'Completá ambos indicadores para poder finalizar.', onSave: saveQ9 });
      document.getElementById('genericAdvanceSave').style.display = 'none';
      document.getElementById('genericAdvanceContinue').textContent = 'Entendido';
      return;
    }
    openBlock({ title:'Bloque 3 completado', text:'Tenés un plan de despliegue y medición definido.', onContinue: ()=> show('final'), onSave: saveQ9 });
  });
})();
