
// === MODAL LOGIC (Punto 1) ===
const modal = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");
const modalSave = document.getElementById("modalSave");
const otroRadio = document.getElementById("otroRadio");
const abiertaWrap = document.getElementById("abiertaWrap");
const descripcionCambio = document.getElementById("descripcionCambio");

const modalBody = document.getElementById("modalBody");
const hudPill = document.getElementById("hudPill");
const scrollHint = document.getElementById("scrollHint");

function setHud(text, ok=false){
  if(!hudPill) return;
  hudPill.textContent = text;
  hudPill.classList.toggle("ok", !!ok);
}
function updateChoiceSelectedUI(){
  document.querySelectorAll(".choice").forEach(lbl=>{
    const inp = lbl.querySelector("input");
    lbl.classList.toggle("selected", !!inp?.checked);
  });
}
function maybeShowScrollHint(){
  if(!modalBody || !scrollHint) return;
  const needs = modalBody.scrollHeight > modalBody.clientHeight + 6;
  scrollHint.classList.toggle("show", needs);
}


function resetModalUI(){
  // hide conditional parts
  abiertaWrap.classList.remove("show");
  if(descripcionCambio) descripcionCambio.value = "";
  // keep radios as-is (optional). If you want: clear selection:
  // document.querySelectorAll('input[name="tipoCambio"]').forEach(r=>r.checked=false);
}

function openModal(){
  modal.classList.add("active");
  document.body.classList.add("modalOpen");
  updateChoiceSelectedUI();
  if(otroRadio.checked){
    abiertaWrap.classList.add("show");
    setTimeout(()=>descripcionCambio?.focus(), 80);
    setHud("Completar texto", false);
  }else{
    abiertaWrap.classList.remove("show");
    setHud("Elegí una opción", false);
  }
  setTimeout(maybeShowScrollHint, 120);
}

function closeModal(){
  modal.classList.remove("active");
  document.body.classList.remove("modalOpen");
}

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (e)=>{ if(e.target === modal) closeModal(); });
modalBody?.addEventListener('scroll', ()=>{
  if(!scrollHint) return;
  scrollHint.classList.toggle('show', modalBody.scrollTop < 6 && (modalBody.scrollHeight > modalBody.clientHeight + 6));
});

// Toggle conditional UI on selection
document.querySelectorAll('input[name="tipoCambio"]').forEach(r=>{
  r.addEventListener("change", ()=>{
    updateChoiceSelectedUI();
    if(r.value === "Otro"){
      abiertaWrap.classList.add("show");
      setHud("Completá la frase", false);
      setTimeout(()=>{
        descripcionCambio?.focus();
        // bring the writing area into view smoothly
        abiertaWrap.scrollIntoView({behavior:'smooth', block:'start'});
        maybeShowScrollHint();
      }, 120);
    }else{
      abiertaWrap.classList.remove("show");
      if(descripcionCambio) descripcionCambio.value = "";
      setHud(`Listo: ${r.closest('label')?.innerText?.trim() || r.value}`, true);
      setTimeout(maybeShowScrollHint, 120);
    }
  });
});

modalSave.addEventListener("click", ()=>{
  const selectedInput = document.querySelector('input[name="tipoCambio"]:checked');
  const selected = selectedInput?.value;

  // Soft validation
  if(!selected){
    setHud("Elegí una opción", false);
    return;
  }
  if(selected === "Otro"){
    const val = (descripcionCambio?.value || "").trim();
    if(!val){
      setHud("Te falta escribir la frase", false);
      const card = document.querySelector('.modalCard');
      card?.animate([
        {transform:'translateX(0)'},
        {transform:'translateX(-6px)'},
        {transform:'translateX(6px)'},
        {transform:'translateX(0)'}
      ], {duration:260, easing:'ease-in-out'});
      descripcionCambio?.focus();
      return;
    }
  }

  // Mark "saved" (only on save)
  document.querySelectorAll(".choice").forEach(c=>c.classList.remove("saved"));
  const lbl = selectedInput?.closest("label");
  if(lbl) lbl.classList.add("saved");

  setHud("Guardado ✓", true);
  setTimeout(closeModal, 180);
});

// Hook tile 01 directly (avoid global click side-effects)
function bindTile01(){
  const grid = document.getElementById("mapGrid");
  if(!grid) return;
  const tiles = Array.from(grid.querySelectorAll(".tile"));
  const t01 = tiles.find(t => (t.querySelector(".num")?.textContent.trim() === "01"));
  if(!t01) return;

  // Remove prior handlers that may exist in this build
  t01.addEventListener("click", (e)=>{
    // let the tile gamification click still happen; open modal after a tiny delay
    setTimeout(()=>{}, 60);
  });
}
document.addEventListener("DOMContentLoaded", ()=>{
  // map is built on demand; patch initMapa to call bindTile01 after build
  const originalInit = window.initMapa;
  if(typeof originalInit === "function"){
    window.initMapa = function(){
      const r = originalInit.apply(this, arguments);
      bindTile01();
      return r;
    }
  }
});
