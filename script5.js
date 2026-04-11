
(function(){
  const q2Checks = Array.from(document.querySelectorAll('input[name="q2_tipo"]'));
  const q2Text = document.getElementById("q2Text");
  const q2Next = document.getElementById("q2Next");
  const backFromQ2 = document.getElementById("backFromQ2");

  const q2StoredChecks = "gdc_q2_checks_v1";
  const q2StoredText = "gdc_q2_text_v1";

  const q2Overlay = document.getElementById("q2FeedbackOverlay");
  const q2ContinueBtn = document.getElementById("q2ContinueBtn");
  const q2SaveAdvance = document.getElementById("q2SaveAdvance");
  const q2FeedbackTitle = document.getElementById("q2FeedbackTitle");
  const q2FeedbackText = document.getElementById("q2FeedbackText");

  function syncQ2State(){
    const hasChecked = q2Checks.some(ch => ch.checked);
    if(q2Text) q2Text.disabled = !hasChecked;
  }

  function saveQ2(){
    const checks = q2Checks.filter(ch => ch.checked).map(ch => ch.value);
    try{
      localStorage.setItem(q2StoredChecks, JSON.stringify(checks));
      localStorage.setItem(q2StoredText, q2Text ? q2Text.value : "");
    }catch(e){}
    syncDone(2, checks.length > 0 && q2Text && q2Text.value.trim().length > 0);
    notifyReviewSync();
  }

  function loadQ2(){
    try{
      const checks = JSON.parse(localStorage.getItem(q2StoredChecks) || "[]");
      q2Checks.forEach(ch => ch.checked = checks.includes(ch.value));
    }catch(e){}
    if(q2Text) q2Text.value = localStorage.getItem(q2StoredText) || "";
    syncQ2State();
    syncDone(2, q2Checks.some(ch => ch.checked) && q2Text && q2Text.value.trim().length > 0);
    notifyReviewSync();
  }

  function q2Complete(){
    const hasChecked = q2Checks.some(ch => ch.checked);
    const hasText = q2Text && q2Text.value.trim().length > 0;
    return hasChecked && hasText;
  }

  function resetQ2Modal(){
    if(q2FeedbackTitle) q2FeedbackTitle.textContent = "Excelente";
    if(q2FeedbackText) q2FeedbackText.textContent = "Ya completaste esta segunda parte del mapa. Podés seguir con la próxima pregunta o guardar tu avance para retomarlo después.";
    if(q2SaveAdvance) q2SaveAdvance.style.display = "";
    if(q2ContinueBtn) q2ContinueBtn.textContent = "Continuar";
  }

  function openQ2Modal(){
    if(!q2Overlay) return;
    resetQ2Modal();
    if(!q2Complete()){
      if(q2FeedbackTitle) q2FeedbackTitle.textContent = "Antes de seguir";
      if(q2FeedbackText) q2FeedbackText.textContent = "Marcá una o más opciones y describí el motivo del cambio para poder avanzar.";
      if(q2SaveAdvance) q2SaveAdvance.style.display = "none";
      if(q2ContinueBtn) q2ContinueBtn.textContent = "Entendido";
    }
    q2Overlay.classList.add("active");
    q2Overlay.setAttribute("aria-hidden", "false");
  }

  function closeQ2Modal(){
    if(!q2Overlay) return;
    q2Overlay.classList.remove("active");
    q2Overlay.setAttribute("aria-hidden", "true");
  }

  q2Checks.forEach(ch => ch.addEventListener("change", () => {
    syncQ2State();
    try { updateChoiceSelectedUI(); } catch(e){}
    saveQ2();
  }));
  if(q2Text){
    q2Text.addEventListener("input", saveQ2);
  }

  if(backFromQ2){
    backFromQ2.addEventListener("click", function(e){
      e.preventDefault();
      if (typeof goBackToMap === "function") goBackToMap(); else if (typeof show === "function") show("mapa");
    });
  }

  if(q2Next){
    q2Next.addEventListener("click", function(e){
      e.preventDefault();
      saveQ2();
      openQ2Modal();
    });
  }

  if(q2ContinueBtn){
    q2ContinueBtn.addEventListener("click", function(){
      if(!q2Complete()) return;
      closeQ2Modal();
      if (typeof show === "function") show("pregunta3");
    });
  }

  if(q2SaveAdvance){
    q2SaveAdvance.addEventListener("click", function(){
      saveQ2();
      if(q2FeedbackTitle) q2FeedbackTitle.textContent = "Avance guardado";
      if(q2FeedbackText) q2FeedbackText.textContent = "Tu respuesta quedó guardada en este navegador para continuar después.";
      if(q2SaveAdvance) q2SaveAdvance.style.display = "none";
      if(q2ContinueBtn) q2ContinueBtn.textContent = "Cerrar";
    });
  }

  if(q2Overlay){
    q2Overlay.addEventListener("click", function(e){
      if(e.target === q2Overlay) closeQ2Modal();
    });
  }

  document.addEventListener("keydown", function(e){
    if(e.key === "Escape" && q2Overlay && q2Overlay.classList.contains("active")){
      closeQ2Modal();
    }
  });

  loadQ2();
})();
