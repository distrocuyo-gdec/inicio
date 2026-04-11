
(function(){
  const backFromQ3 = document.getElementById("backFromQ3");
  const q3Next = document.getElementById("q3Next");
  const q3Short = document.getElementById("q3Short");
  const q3Medium = document.getElementById("q3Medium");
  const q3Long = document.getElementById("q3Long");

  const q3Overlay = document.getElementById("q3FeedbackOverlay");
  const q3ContinueBtn = document.getElementById("q3ContinueBtn");
  const q3SaveAdvance = document.getElementById("q3SaveAdvance");
  const q3FeedbackTitle = document.getElementById("q3FeedbackTitle");
  const q3FeedbackText = document.getElementById("q3FeedbackText");

  const KEY_Q3_SHORT = "gdc_q3_short_v1";
  const KEY_Q3_MEDIUM = "gdc_q3_medium_v1";
  const KEY_Q3_LONG = "gdc_q3_long_v1";

  function saveQ3(){
    try{
      localStorage.setItem(KEY_Q3_SHORT, q3Short ? q3Short.value : "");
      localStorage.setItem(KEY_Q3_MEDIUM, q3Medium ? q3Medium.value : "");
      localStorage.setItem(KEY_Q3_LONG, q3Long ? q3Long.value : "");
      const done = getDone();
      const complete = q3Complete();
      const has3 = done.includes(3);
      if(complete && !has3) done.push(3);
      if(!complete && has3){
        const idx = done.indexOf(3);
        done.splice(idx,1);
      }
      setDone(done);
      paintProgress();
    }catch(err){}
  }

  function loadQ3(){
    if(q3Short) q3Short.value = localStorage.getItem(KEY_Q3_SHORT) || "";
    if(q3Medium) q3Medium.value = localStorage.getItem(KEY_Q3_MEDIUM) || "";
    if(q3Long) q3Long.value = localStorage.getItem(KEY_Q3_LONG) || "";
    saveQ3();
  }

  function q3Complete(){
    const a = q3Short && q3Short.value.trim().length > 0;
    const b = q3Medium && q3Medium.value.trim().length > 0;
    const c = q3Long && q3Long.value.trim().length > 0;
    return a && b && c;
  }

  function resetQ3Modal(){
    if(q3FeedbackTitle) q3FeedbackTitle.textContent = "Bloque 1 completado";
    if(q3FeedbackText) q3FeedbackText.textContent = "El cambio tiene sentido y dirección clara. Ahora analicemos el impacto humano.";
    if(q3SaveAdvance) q3SaveAdvance.style.display = "";
    if(q3ContinueBtn) q3ContinueBtn.textContent = "Continuar";
  }

  function openQ3Modal(){
    if(!q3Overlay) return;
    resetQ3Modal();
    if(!q3Complete()){
      if(q3FeedbackTitle) q3FeedbackTitle.textContent = "Antes de seguir";
      if(q3FeedbackText) q3FeedbackText.textContent = "Completá los tres campos para poder avanzar.";
      if(q3SaveAdvance) q3SaveAdvance.style.display = "none";
      if(q3ContinueBtn) q3ContinueBtn.textContent = "Entendido";
    }
    q3Overlay.classList.add("active");
    q3Overlay.setAttribute("aria-hidden", "false");
  }

  function closeQ3Modal(){
    if(!q3Overlay) return;
    q3Overlay.classList.remove("active");
    q3Overlay.setAttribute("aria-hidden", "true");
  }

  [q3Short, q3Medium, q3Long].forEach(el => {
    if(el) el.addEventListener("input", saveQ3);
  });

  if(backFromQ3){
    backFromQ3.addEventListener("click", function(e){
      e.preventDefault();
      if (typeof goBackToMap === "function") goBackToMap(); else if (typeof show === "function") show("mapa");
    });
  }

  if(q3Next){
    q3Next.addEventListener("click", function(e){
      e.preventDefault();
      saveQ3();
      openQ3Modal();
    });
  }

  if(q3ContinueBtn){
    q3ContinueBtn.addEventListener("click", function(){
      closeQ3Modal();
      if (typeof show === "function") show("pregunta4");
    });
  }

  if(q3SaveAdvance){
    q3SaveAdvance.addEventListener("click", function(){
      saveQ3();
      if(q3FeedbackTitle) q3FeedbackTitle.textContent = "Avance guardado";
      if(q3FeedbackText) q3FeedbackText.textContent = "Tu respuesta quedó guardada en este navegador para continuar después.";
      if(q3SaveAdvance) q3SaveAdvance.style.display = "none";
      if(q3ContinueBtn) q3ContinueBtn.textContent = "Cerrar";
    });
  }

  if(q3Overlay){
    q3Overlay.addEventListener("click", function(e){
      if(e.target === q3Overlay) closeQ3Modal();
    });
  }

  document.addEventListener("keydown", function(e){
    if(e.key === "Escape" && q3Overlay && q3Overlay.classList.contains("active")){
      closeQ3Modal();
    }
  });

  loadQ3();
})();
