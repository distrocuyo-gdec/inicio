
(function(){
  const overlay = document.getElementById("q1FeedbackOverlay");
  const continueBtn = document.getElementById("q1ContinueBtn");
  const saveBtn = document.getElementById("q1SaveAdvance");
  const title = document.getElementById("q1FeedbackTitle");
  const text = document.getElementById("q1FeedbackText");
  const q1Text = document.getElementById("q1Text");
  const q1Checks = Array.from(document.querySelectorAll('input[name="q1_tipo"]'));
  const nextBtn = document.getElementById("q1Next");

  if(!overlay || !continueBtn || !saveBtn || !title || !text || !nextBtn) return;

  const DEFAULT_TITLE = "Excelente";
  const DEFAULT_TEXT = "Ya completaste esta primera parte del mapa. Podés seguir con la próxima pregunta o guardar tu avance para retomarlo después.";

  function q1Complete(){
    const checked = q1Checks.some(i => i.checked);
    const hasText = q1Text && q1Text.value.trim().length > 0;
    return checked && hasText;
  }

  function resetQ1Feedback(){
    title.textContent = DEFAULT_TITLE;
    text.textContent = DEFAULT_TEXT;
    saveBtn.style.display = "";
    continueBtn.textContent = "Continuar";
  }

  window.openQ1Feedback = function(){
    resetQ1Feedback();
    if(!q1Complete()){
      title.textContent = "Antes de seguir";
      text.textContent = "Marcá una o más opciones y describí el cambio para poder avanzar.";
      saveBtn.style.display = "none";
      continueBtn.textContent = "Entendido";
    }
    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");
  };

  function closeQ1Feedback(){
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
  }

  continueBtn.addEventListener("click", () => {
    closeQ1Feedback();
    if (typeof show === "function") show("pregunta2");
  });

  saveBtn.addEventListener("click", () => {
    try{
      const payload = {
        tipos: q1Checks.filter(i => i.checked).map(i => i.value),
        descripcion: q1Text ? q1Text.value : ""
      };
      localStorage.setItem("gdc_q1_progress", JSON.stringify(payload));
    }catch(err){}
    title.textContent = "Avance guardado";
    text.textContent = "Tu respuesta quedó guardada en este navegador para continuar después.";
    saveBtn.style.display = "none";
    continueBtn.textContent = "Cerrar";
  });

  overlay.addEventListener("click", (e) => {
    if(e.target === overlay) closeQ1Feedback();
  });

  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape" && overlay.classList.contains("active")){
      closeQ1Feedback();
    }
  });

  /* Respaldo: intercepta click si otro script intenta llevar al mapa */
  nextBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    openQ1Feedback();
  }, true);
})();
