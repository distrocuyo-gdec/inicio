
  const screens = {
    login: document.getElementById("screen-login"),
    mapa: document.getElementById("screen-mapa"),
    pregunta1: document.getElementById("screen-pregunta-1"),
    pregunta2: document.getElementById("screen-pregunta-2"),
    pregunta3: document.getElementById("screen-pregunta-3"),
    pregunta4: document.getElementById("screen-pregunta-4"),
    pregunta5: document.getElementById("screen-pregunta-5"),
    pregunta6: document.getElementById("screen-pregunta-6"),
    pregunta7: document.getElementById("screen-pregunta-7"),
    pregunta8: document.getElementById("screen-pregunta-8"),
    pregunta9: document.getElementById("screen-pregunta-9"),
    final: document.getElementById("screen-final")
  };

  const card = document.querySelector('.card');
  window.show = function show(which){
    if(which !== 'login'){
      try { syncQuestionFieldsFromStorage(); } catch(e){}
    }
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[which].classList.add('active');
    card.classList.toggle('mapMode', which === 'mapa');
    card.classList.toggle('questionMode', /^pregunta[1-9]$/.test(which));
    card.classList.toggle('finalMode', which === 'final');
  }

  const form = document.getElementById("loginForm");
  const startBtn = document.getElementById("startBtn");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");

  const TITLES = [
    "¿Qué cambia?",
    "¿Por qué cambia?",
    "¿Para qué cambia?",
    "¿A quién impacta?",
    "¿Qué harán distinto?",
    "Riesgos generales",
    "Narrativa del cambio",
    "¿Cómo lo vas a desplegar?",
    "Indicadores de adopción"
  ];

  
  let mapaBuilt = false;
  const KEY_DONE = "gdc_map_done_v1"; // array of numbers 1..9

  function getDone(){
    try { return JSON.parse(localStorage.getItem(KEY_DONE) || "[]"); }
    catch(e){ return []; }
  }
  function setDone(arr){
    localStorage.setItem(KEY_DONE, JSON.stringify(arr));
  }

  function paintProgress(){
    const done = getDone();
    const pct = Math.round((done.length/9)*100);
    const txt = document.getElementById("gamiText");
    const fill = document.getElementById("gamiFill");
    if(txt) txt.textContent = `${done.length}/9`;
    if(fill) fill.style.width = pct + "%";

    const dots = Array.from(document.querySelectorAll("#gamiDots span"));
    dots.forEach((d, i) => d.classList.toggle("on", done.includes(i+1)));
  }

  const gdcSyncChannel = (() => { try { return new BroadcastChannel('gdc_sync_channel_v2'); } catch (e) { return null; } })();
  function notifyReviewSync(){
    const payload = { type:'gdc_review_sync_v2', at: Date.now() };
    try { if (gdcSyncChannel) gdcSyncChannel.postMessage(payload); } catch(e){}
    try { window.postMessage(payload, '*'); } catch(e){}
  }
  function recomputeMapDoneAndUI(){
    const done = [];
    const q1ChecksCurrent = Array.from(document.querySelectorAll('input[name="q1_tipo"]:checked'));
    const q2ChecksCurrent = Array.from(document.querySelectorAll('input[name="q2_tipo"]:checked'));
    const q1Value = (document.getElementById('q1Text')?.value || '').trim();
    const q2Value = (document.getElementById('q2Text')?.value || '').trim();
    const q3a = (document.getElementById('q3Short')?.value || '').trim();
    const q3b = (document.getElementById('q3Medium')?.value || '').trim();
    const q3c = (document.getElementById('q3Long')?.value || '').trim();
    const q4v = (document.getElementById('q4Text')?.value || '').trim();
    const q5v = (document.getElementById('q5Text')?.value || '').trim();
    const q6v = (document.getElementById('q6Text')?.value || '').trim();
    const q7v = (document.getElementById('q7Text')?.value || '').trim();
    const q8v = (document.getElementById('q8Text')?.value || '').trim();
    const q9a = (document.getElementById('q9Impl')?.value || '').trim();
    const q9b = (document.getElementById('q9Adop')?.value || '').trim();
    if(q1ChecksCurrent.length && q1Value) done.push(1);
    if(q2ChecksCurrent.length && q2Value) done.push(2);
    if(q3a && q3b && q3c) done.push(3);
    if(q4v) done.push(4);
    if(q5v) done.push(5);
    if(q6v) done.push(6);
    if(q7v) done.push(7);
    if(q8v) done.push(8);
    if(q9a && q9b) done.push(9);
    setDone(done);
    paintProgress();
    try { updateChoiceSelectedUI(); } catch(e){}
    try {
      document.querySelectorAll('input[name="q1_tipo"]').forEach((el) => {
        const lbl = el.closest('.q1Choice');
        if(lbl) lbl.classList.toggle('selected', !!el.checked);
      });
      document.querySelectorAll('input[name="q2_tipo"]').forEach((el) => {
        const lbl = el.closest('.q1Choice');
        if(lbl) lbl.classList.toggle('selected', !!el.checked);
      });
    } catch(e){}
  }
  function syncQuestionFieldsFromStorage(){
    const hello = document.getElementById("hello");
    const storedName = localStorage.getItem("gdc_user_name") || "";
    const storedEmail = localStorage.getItem("gdc_user_email") || "";
    if(hello && storedName) hello.textContent = `Hola ${storedName}`;
    if(nameInput && document.activeElement !== nameInput) nameInput.value = storedName;
    if(emailInput && document.activeElement !== emailInput) emailInput.value = storedEmail;

    const q1Checks = (() => { try { return JSON.parse(localStorage.getItem("gdc_q1_checks_v1") || "[]"); } catch(e){ return []; } })();
    document.querySelectorAll('input[name="q1_tipo"]').forEach(el => { el.checked = q1Checks.includes(el.value); });
    const q1TextField = document.getElementById("q1Text");
    if(q1TextField && document.activeElement !== q1TextField){
      q1TextField.value = localStorage.getItem("gdc_q1_text_v1") || "";
      q1TextField.disabled = q1Checks.length === 0;
    }

    const q2Checks = (() => { try { return JSON.parse(localStorage.getItem("gdc_q2_checks_v1") || "[]"); } catch(e){ return []; } })();
    document.querySelectorAll('input[name="q2_tipo"]').forEach(el => { el.checked = q2Checks.includes(el.value); });
    const q2TextField = document.getElementById("q2Text");
    if(q2TextField && document.activeElement !== q2TextField){
      q2TextField.value = localStorage.getItem("gdc_q2_text_v1") || "";
      q2TextField.disabled = q2Checks.length === 0;
    }

    const fieldMap = { q3Short:"gdc_q3_short_v1", q3Medium:"gdc_q3_medium_v1", q3Long:"gdc_q3_long_v1", q4Text:"gdc_q4_text_v1", q5Text:"gdc_q5_text_v1", q6Text:"gdc_q6_text_v1", q7Text:"gdc_q7_text_v1", q8Text:"gdc_q8_text_v1", q9Impl:"gdc_q9_impl_v1", q9Adop:"gdc_q9_adop_v1" };
    Object.entries(fieldMap).forEach(([id,key]) => {
      const el = document.getElementById(id);
      if(el && document.activeElement !== el) el.value = localStorage.getItem(key) || "";
    });

    try { updateChoiceSelectedUI(); } catch(e){}
    document.querySelectorAll('input[name="q1_tipo"]').forEach((el) => {
      const lbl = el.closest('.q1Choice');
      if(lbl) lbl.classList.toggle('selected', !!el.checked);
    });
    document.querySelectorAll('input[name="q2_tipo"]').forEach((el) => {
      const lbl = el.closest('.q1Choice');
      if(lbl) lbl.classList.toggle('selected', !!el.checked);
    });

    paintProgress();
  }
  function handleExternalSync(){
    syncQuestionFieldsFromStorage();
    recomputeMapDoneAndUI();
  }
  window.addEventListener("message", (event) => { if(event && event.data && event.data.type === "gdc_review_sync_v2") handleExternalSync(); });
  window.addEventListener("storage", (event) => { if(!event.key || String(event.key).startsWith("gdc_")) handleExternalSync(); });
  window.addEventListener("focus", handleExternalSync);
  document.addEventListener("visibilitychange", () => { if(!document.hidden) handleExternalSync(); });
  if(gdcSyncChannel){ gdcSyncChannel.addEventListener("message", (event) => { if(event && event.data && event.data.type === "gdc_review_sync_v2") handleExternalSync(); }); }

  function initMapa(){
    if(mapaBuilt) return;
    mapaBuilt = true;

    const grid = document.getElementById("mapGrid");
    grid.innerHTML = "";

    const blocks = [
      { title: "Bloque 1: Direccionalidad estratégica", cls: "block-1", items: [0,1,2] },
      { title: "Bloque 2: Impacto humano", cls: "block-2", items: [3,4,5] },
      { title: "Bloque 3: Indicadores", cls: "block-3", items: [6,7,8] }
    ];

    // Dots
    const dotsWrap = document.getElementById("gamiDots");
    dotsWrap.innerHTML = "";
    for(let i=0;i<9;i++){
      const s = document.createElement("span");
      dotsWrap.appendChild(s);
    }

    blocks.forEach((block, blockIndex) => {
      const wrap = document.createElement("section");
      wrap.className = `mapBlock ${block.cls}`;

      const title = document.createElement("h4");
      title.className = "blockTitle";
      title.textContent = block.title;

      const blockGrid = document.createElement("div");
      blockGrid.className = "blockGrid";

      block.items.forEach((titleIndex, innerIndex) => {
        const t = TITLES[titleIndex];
        const n = titleIndex + 1;
        const nn = String(n).padStart(2,"0");

        const tile = document.createElement("div");
        tile.className = "tile";
        tile.style.textAlign = "left";
        tile.style.animation = "screenIn .35s ease both";
        tile.style.animationDelay = ((blockIndex*3 + innerIndex)*0.03) + "s";
        tile.setAttribute("role","button");
        tile.setAttribute("tabindex","0");
        tile.innerHTML = `<span class="ring" aria-hidden="true"></span><div class="num">${nn}</div><h4>${t}</h4>`;

        const click = () => {
          show("pregunta" + n);
          tile.animate([
            { transform:"translateY(-4px) scale(1.015)" },
            { transform:"translateY(0) scale(1)" }
          ], { duration: 240, easing:"ease-out" });
        };

        tile.addEventListener("click", click);
        tile.addEventListener("keydown", (e) => {
          if(e.key === "Enter" || e.key === " "){ e.preventDefault(); click(); }
        });

        blockGrid.appendChild(tile);
      });

      wrap.appendChild(title);
      wrap.appendChild(blockGrid);
      grid.appendChild(wrap);
    });

    const hello = document.getElementById("hello");
    const name = localStorage.getItem("gdc_user_name");
    if(name) hello.textContent = `Hola ${name}`;

    paintProgress();
  }

  function submitLogin(){
    const name = (nameInput?.value || '').trim();
    const email = (emailInput?.value || '').trim();
    const okEmail = /^\S+@\S+\.\S+$/.test(email);

    if(!name){ if(nameInput) nameInput.focus(); return; }
    if(!okEmail){ if(emailInput) emailInput.focus(); return; }

    localStorage.setItem('gdc_user_name', name);
    localStorage.setItem('gdc_user_email', email);
    notifyReviewSync();

    startBtn.disabled = true;
    startBtn.textContent = 'Entrando…';
    initMapa();
    syncQuestionFieldsFromStorage();
    show('mapa');
    setTimeout(() => {
      startBtn.disabled = false;
      startBtn.textContent = 'Comenzar';
    }, 220);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitLogin();
  });
  startBtn.addEventListener('click', (e) => {
    e.preventDefault();
    submitLogin();
  });

  document.getElementById("backBtn").addEventListener("click", () => show("login"));

  function goToMapaIfReady(){
    initMapa();
    syncQuestionFieldsFromStorage();
    show("mapa");
  }

  window.addEventListener('message', (event) => {
    if(event && event.data && event.data.type === 'gdc_go_to_map_v1'){
      goToMapaIfReady();
    }
  });

  if(window.location.hash === '#mapa' && localStorage.getItem('gdc_user_name') && localStorage.getItem('gdc_user_email')){
    goToMapaIfReady();
  }

  // Prefill if exists
  const existingName = localStorage.getItem("gdc_user_name");
  const existingEmail = localStorage.getItem("gdc_user_email");
  if(existingName) document.getElementById("name").value = existingName;
  if(existingEmail) document.getElementById("email").value = existingEmail;

  const q1Checks = Array.from(document.querySelectorAll('input[name="q1_tipo"]'));
  const q1Text = document.getElementById("q1Text");
  const q1StoredChecks = "gdc_q1_checks_v1";
  const q1StoredText = "gdc_q1_text_v1";

  function syncQ1State(){
    const hasChecked = q1Checks.some(ch => ch.checked);
    q1Text.disabled = !hasChecked;
  }

  function saveQ1(){
    const checks = q1Checks.filter(ch => ch.checked).map(ch => ch.value);
    localStorage.setItem(q1StoredChecks, JSON.stringify(checks));
    localStorage.setItem(q1StoredText, q1Text.value || "");
    const done = getDone();
    const isComplete = checks.length > 0 && (q1Text.value || "").trim().length > 0;
    const has1 = done.includes(1);
    if(isComplete && !has1) done.push(1);
    if(!isComplete && has1){
      const idx = done.indexOf(1);
      done.splice(idx,1);
    }
    setDone(done);
    paintProgress();
    notifyReviewSync();
  }

  function restoreQ1(){
    let checks = [];
    try{ checks = JSON.parse(localStorage.getItem(q1StoredChecks) || "[]"); }catch(e){}
    q1Checks.forEach(ch => ch.checked = checks.includes(ch.value));
    q1Text.value = localStorage.getItem(q1StoredText) || "";
    syncQ1State();
    saveQ1();
    notifyReviewSync();
  }

  q1Checks.forEach(ch => ch.addEventListener("change", () => { syncQ1State(); saveQ1(); }));
  q1Text.addEventListener("input", saveQ1);

  function goBackToMap(){
    try { closeQ1Feedback(); } catch(e){}
    try { closeQ2Modal(); } catch(e){}
    try { closeQ3Modal(); } catch(e){}
    try { closeAdvance(); } catch(e){}
    try { closeBlock(); } catch(e){}
    handleExternalSync();
    show("mapa");
  }
  document.getElementById("backFromQ1").addEventListener("click", (e) => { e.preventDefault(); goBackToMap(); });
  document.getElementById("q1Next").addEventListener("click", () => {
    saveQ1();
    openQ1Feedback();
  });

  restoreQ1();

