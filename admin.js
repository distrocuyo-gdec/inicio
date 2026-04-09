const ADMIN_STORAGE_KEY = 'gdc_admin_auth_v1';
if (sessionStorage.getItem(ADMIN_STORAGE_KEY) !== '1') {
  window.location.replace('admin-login.html');
}


const SUPABASE_URL = 'https://ngqmysactwwhqtbjeyys.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncW15c2FjdHd3aHF0YmpleXlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjM4NzgsImV4cCI6MjA5MDk5OTg3OH0.uKoBUShuofGL7w6mE28zFL4rMW2QRTB49LiEvs3mpQ8';
const TABLE = 'gdc_projects';
const ADMIN_DELETE_CONFIRM = 'Esta acción borrará el proyecto de forma permanente. ¿Querés continuar?';

let allProjects = [];
let groupedPeople = [];
let selectedProjectId = null;

const els = {
  statPeople: document.getElementById('statPeople'),
  statPeopleMeta: document.getElementById('statPeopleMeta'),
  statProjects: document.getElementById('statProjects'),
  statProjectsMeta: document.getElementById('statProjectsMeta'),
  statCompleted: document.getElementById('statCompleted'),
  statCompletedMeta: document.getElementById('statCompletedMeta'),
  statRecent: document.getElementById('statRecent'),
  statRecentMeta: document.getElementById('statRecentMeta'),
  searchInput: document.getElementById('searchInput'),
  statusFilter: document.getElementById('statusFilter'),
  sortFilter: document.getElementById('sortFilter'),
  scopeFilter: document.getElementById('scopeFilter'),
  clearFiltersBtn: document.getElementById('clearFiltersBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  exportCsvBtn: document.getElementById('exportCsvBtn'),
  exportJsonBtn: document.getElementById('exportJsonBtn'),
  peopleList: document.getElementById('peopleList'),
  resultCount: document.getElementById('resultCount'),
  listTitle: document.getElementById('listTitle'),
  listSubtitle: document.getElementById('listSubtitle'),
  detailModal: document.getElementById('detailModal'),
  modalDetailBody: document.getElementById('modalDetailBody'),
  modalTitle: document.getElementById('modalTitle'),
  modalSubtitle: document.getElementById('modalSubtitle'),
  closeDetailModal: document.getElementById('closeDetailModal')
};

function normalize(value){ return String(value || '').trim().toLowerCase(); }
function escapeHtml(str){ return String(str || '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function fmtDate(value){
  if(!value) return 'Sin fecha';
  const d = new Date(value);
  if(Number.isNaN(d.getTime())) return 'Sin fecha';
  return d.toLocaleString('es-AR', { dateStyle:'short', timeStyle:'short' });
}
function timeAgo(value){
  if(!value) return 'sin fecha';
  const d = new Date(value);
  const diff = Date.now() - d.getTime();
  const hours = Math.round(diff / 36e5);
  if(hours < 1) return 'hace instantes';
  if(hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if(days < 30) return `hace ${days} día${days===1?'':'s'}`;
  const months = Math.round(days / 30);
  return `hace ${months} mes${months===1?'':'es'}`;
}
function safeObject(v){ return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
function parseMaybeJsonArray(value){
  if(Array.isArray(value)) return value.filter(Boolean);
  if(typeof value !== 'string' || !value.trim()) return [];
  try{ const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter(Boolean) : []; }catch(_){ return []; }
}
function joinParts(parts){
  return parts.map(v => String(v || '').trim()).filter(Boolean).join('\n\n');
}
function pickFirstText(...values){
  for(const value of values){
    if(typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}
function collectChecks(review, answers, keys){
  return Array.from(new Set((keys || []).flatMap(key => [
    ...parseMaybeJsonArray(review[key]),
    ...parseMaybeJsonArray(answers[key])
  ]))).filter(Boolean);
}
const DETAIL_DEFS = [
  {
    key:'q1',
    label:'Pregunta 1 · Direccionalidad estratégica',
    subquestions:[
      { key:'q1_types', label:'Subpregunta 1.1 · Tipo de cambio', type:'checks', keys:['q1_checks','gdc_q1_checks_v1'] },
      { key:'q1_desc', label:'Subpregunta 1.2 · Descripción del cambio', type:'text', keys:['q1_text','gdc_q1_text_v1'] }
    ]
  },
  {
    key:'q2',
    label:'Pregunta 2 · Impacto humano',
    subquestions:[
      { key:'q2_types', label:'Subpregunta 2.1 · Tipo de impacto', type:'checks', keys:['q2_checks','gdc_q2_checks_v1'] },
      { key:'q2_desc', label:'Subpregunta 2.2 · Desarrollo del impacto', type:'text', keys:['q2_text','gdc_q2_text_v1'] }
    ]
  },
  {
    key:'q3',
    label:'Pregunta 3 · Alcance y temporalidad',
    subquestions:[
      { key:'q3_short', label:'Subpregunta 3.1 · Corto plazo', type:'text', keys:['q3_short','gdc_q3_short_v1'] },
      { key:'q3_medium', label:'Subpregunta 3.2 · Mediano plazo', type:'text', keys:['q3_medium','gdc_q3_medium_v1'] },
      { key:'q3_long', label:'Subpregunta 3.3 · Largo plazo', type:'text', keys:['q3_long','gdc_q3_long_v1'] }
    ]
  },
  { key:'q4', label:'Pregunta 4', subquestions:[{ key:'q4_main', label:'Subpregunta 4.1 · Desarrollo', type:'text', keys:['q4','gdc_q4_text_v1'] }] },
  { key:'q5', label:'Pregunta 5', subquestions:[{ key:'q5_main', label:'Subpregunta 5.1 · Desarrollo', type:'text', keys:['q5','gdc_q5_text_v1'] }] },
  { key:'q6', label:'Pregunta 6', subquestions:[{ key:'q6_main', label:'Subpregunta 6.1 · Desarrollo', type:'text', keys:['q6','gdc_q6_text_v1'] }] },
  { key:'q7', label:'Pregunta 7', subquestions:[{ key:'q7_main', label:'Subpregunta 7.1 · Desarrollo', type:'text', keys:['q7','gdc_q7_text_v1'] }] },
  { key:'q8', label:'Pregunta 8', subquestions:[{ key:'q8_main', label:'Subpregunta 8.1 · Desarrollo', type:'text', keys:['q8','gdc_q8_text_v1'] }] },
  {
    key:'q9',
    label:'Pregunta 9 · Indicadores',
    subquestions:[
      { key:'q9_adop', label:'Subpregunta 9.1 · Adopción', type:'text', keys:['q9_adop','gdc_q9_adop_v1'] },
      { key:'q9_impl', label:'Subpregunta 9.2 · Implementación', type:'text', keys:['q9_impl','gdc_q9_impl_v1'] }
    ]
  }
];
function getProjectState(project){
  const answers = safeObject(project.answers);
  const review = safeObject(project.review_answers);
  const direct = safeObject(answers.project_state && typeof answers.project_state === 'object' ? answers.project_state : null);
  const directReview = safeObject(review.project_state && typeof review.project_state === 'object' ? review.project_state : null);
  const state = Object.keys(direct).length ? direct : directReview;
  if(Object.keys(state).length) return state;
  const doneList = parseMaybeJsonArray(answers.gdc_map_done_v1);
  const doneCount = doneList.length;
  return {
    done_questions: doneCount,
    total_questions: 9,
    completion_percent: Math.round((doneCount / 9) * 100),
    is_complete: doneCount === 9,
    status_label: doneCount === 9 ? 'completo' : (doneCount > 0 ? 'en_progreso' : 'nuevo')
  };
}
function getMergedQuestions(project){
  const answers = safeObject(project.answers);
  const review = safeObject(project.review_answers);
  return DETAIL_DEFS.map(def => {
    const subquestions = (def.subquestions || []).map(sub => {
      if(sub.type === 'checks'){
        const checks = collectChecks(review, answers, sub.keys);
        return { key:sub.key, label:sub.label, type:'checks', value:checks, display:checks.join(' · ') };
      }
      const text = pickFirstText(...(sub.keys || []).map(key => review[key] ?? answers[key]));
      return { key:sub.key, label:sub.label, type:'text', value:text, display:text };
    });
    const hasContent = subquestions.some(sub => Array.isArray(sub.value) ? sub.value.length : String(sub.value || '').trim());
    const checks = subquestions.filter(sub => sub.type === 'checks').flatMap(sub => sub.value || []);
    const text = joinParts(subquestions.filter(sub => sub.type === 'text').map(sub => sub.value));
    return { key:def.key, label:def.label, checks, text, subquestions, hasContent };
  }).filter(q => q.hasContent);
}
function getNormalizedProjectDetail(project){
  const questions = getMergedQuestions(project);
  return {
    project_id: project.project_id || '',
    project_title: project.project_title || '',
    owner_name: project.owner_name || '',
    owner_email: project.owner_email || '',
    updated_at: project.updated_at || '',
    status: getProjectStatus(project),
    completion: getCompletion(project),
    questions: questions.map(q => ({
      key: q.key,
      title: q.label,
      subquestions: q.subquestions.map(sub => ({
        key: sub.key,
        title: sub.label,
        type: sub.type,
        value: sub.value
      }))
    }))
  };
}
function subquestionValueToText(sub){
  return Array.isArray(sub.value) ? sub.value.join(' | ') : String(sub.value || '').trim();
}
function renderQuestionBlocksFromNormalized(detail){
  const questions = Array.isArray(detail?.questions) ? detail.questions : [];
  if(!questions.length) return '<div class="emptyState">Este proyecto todavía no tiene información desarrollada.</div>';
  return questions.map(q => `<section class="block">
      <h3>${escapeHtml(q.title || q.key || '')}</h3>
      ${(q.subquestions || []).map(sub => `<div class="subBlock"><div class="labelMini">${escapeHtml(sub.title || '')}</div>${sub.type === 'checks' ? (Array.isArray(sub.value) && sub.value.length ? `<div class="checkList">${sub.value.map(tag => `<span class="checkTag">${escapeHtml(tag)}</span>`).join('')}</div>` : `<p>Sin desarrollo</p>`) : `<p>${escapeHtml(subquestionValueToText(sub) || 'Sin desarrollo')}</p>`}</div>`).join('')}
    </section>`).join('');
}
function getCompletion(project){
  const state = getProjectState(project);
  const merged = getMergedQuestions(project);
  const answered = Number(state.done_questions ?? merged.length ?? 0);
  const total = Number(state.total_questions ?? 9) || 9;
  return { answered, total, isComplete: Boolean(state.is_complete) || answered >= total };
}
function getProjectStatus(project){
  const state = getProjectState(project);
  const label = String(state.status_label || '').toLowerCase();
  if(label === 'completo' || label === 'complete') return { key:'complete', label:'Completo' };
  if(label === 'en_progreso' || label === 'in_progress') return { key:'in_progress', label:'En proceso' };
  const { answered, isComplete } = getCompletion(project);
  if(isComplete) return { key:'complete', label:'Completo' };
  if(answered <= 0) return { key:'empty', label:'Sin desarrollo' };
  return { key:'in_progress', label:'En proceso' };
}
function getProjectRowsForExport(projects){
  return projects.map(project => {
    const merged = getMergedQuestions(project);
    const status = getProjectStatus(project);
    const completion = getCompletion(project);
    const row = {
      project_id: project.project_id || '',
      project_title: project.project_title || '',
      owner_name: project.owner_name || '',
      owner_email: project.owner_email || '',
      updated_at: project.updated_at || '',
      status: status.label,
      answered_points: completion.answered,
      total_points: completion.total
    };
    merged.forEach(q => {
      row[`question_${q.key}_title`] = q.label || '';
      q.subquestions.forEach((sub, idx) => {
        const slot = idx + 1;
        row[`question_${q.key}_sub_${slot}_title`] = sub.label || '';
        row[`question_${q.key}_sub_${slot}_type`] = sub.type || '';
        row[`question_${q.key}_sub_${slot}_value`] = Array.isArray(sub.value) ? sub.value.join(' | ') : (sub.value || '');
      });
    });
    return row;
  });
}
function downloadFile(filename, content, type){
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportCsv(projects){
  const rows = getProjectRowsForExport(projects);
  if(!rows.length) return;
  const headers = Array.from(rows.reduce((set,row) => { Object.keys(row).forEach(k => set.add(k)); return set; }, new Set()));
  const csv = [headers.join(',')].concat(rows.map(row => headers.map(h => {
    const cell = String(row[h] ?? '');
    return '"' + cell.replace(/"/g, '""') + '"';
  }).join(','))).join('\n');
  downloadFile(`gdc-admin-${new Date().toISOString().slice(0,10)}.csv`, csv, 'text/csv;charset=utf-8');
}
function exportJson(projects){
  const payload = {
    generated_at: new Date().toISOString(),
    total_projects: projects.length,
    total_people: new Set(projects.map(p => normalize(p.owner_email) || normalize(p.owner_name))).size,
    projects,
    normalized_detail: projects.map(getNormalizedProjectDetail)
  };
  downloadFile(`gdc-admin-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
}
function buildPrintHtml(project){
  const detail = getNormalizedProjectDetail(project);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(detail.project_title || 'Proyecto')}</title><style>
  body{font-family:Arial,Helvetica,sans-serif;margin:36px;color:#1b1f1d} h1{margin:0 0 10px;font-size:24px} h2{margin:24px 0 10px;font-size:16px} .meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:20px 0} .card{border:1px solid #d7ded8;border-radius:12px;padding:12px} .small{font-size:12px;color:#58645d;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}.value{font-size:14px;line-height:1.45}.q{border:1px solid #d7ded8;border-radius:12px;padding:12px;margin:10px 0;page-break-inside:avoid} .tag{display:inline-block;border:1px solid #b6cdb8;background:#eef7ef;border-radius:999px;padding:4px 8px;margin:4px 6px 0 0;font-size:12px}</style></head><body>
  <h1>${escapeHtml(detail.project_title || 'Proyecto sin título')}</h1>
  <div class="value">${escapeHtml(detail.owner_name || 'Sin nombre')} · ${escapeHtml(detail.owner_email || 'Sin mail')}</div>
  <div class="meta">
    <div class="card"><div class="small">Estado</div><div class="value">${escapeHtml(detail.status?.label || '')}</div></div>
    <div class="card"><div class="small">Actualización</div><div class="value">${escapeHtml(fmtDate(detail.updated_at))}</div></div>
    <div class="card"><div class="small">Puntos respondidos</div><div class="value">${detail.completion?.answered || 0} / ${detail.completion?.total || 9}</div></div>
    <div class="card"><div class="small">ID</div><div class="value">${escapeHtml(detail.project_id || '')}</div></div>
  </div>
  <h2>Contenido</h2>
  ${(detail.questions || []).map(q => `<div class="q"><div class="small">${escapeHtml(q.title || q.key || '')}</div>${(q.subquestions || []).map(sub => `<div style="margin-top:10px;"><div class="small" style="margin-bottom:4px;">${escapeHtml(sub.title || '')}</div>${sub.type === 'checks' ? (Array.isArray(sub.value) && sub.value.length ? `<div>${sub.value.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>` : `<div class="value">Sin desarrollo</div>`) : `<div class="value" style="white-space:pre-wrap;">${escapeHtml(subquestionValueToText(sub) || 'Sin desarrollo')}</div>`}</div>`).join('')}</div>`).join('')}
  </body></html>`;
}
function exportPdfLike(project){
  const win = window.open('', '_blank', 'width=960,height=860');
  if(!win) return;
  win.document.open();
  win.document.write(buildPrintHtml(project));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 350);
}

async function fetchProjects(){
  const params = new URLSearchParams();
  params.set('select', 'project_id,project_title,owner_name,owner_email,answers,review_answers,updated_at');
  params.set('order', 'updated_at.desc');
  params.set('limit', '1000');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try{
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?${params.toString()}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: 'application/json'
      },
      signal: controller.signal
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allProjects = Array.isArray(data) ? data : [];
    groupedPeople = groupByPeople(allProjects);
    renderAll();
  }catch(err){
    console.error(err);
    els.peopleList.innerHTML = `<div class="emptyState">No se pudo leer la base de datos. ${escapeHtml(err?.message || 'Error desconocido')}.</div>`;
  }finally{ clearTimeout(timeout); }
}
function groupByPeople(projects){
  const map = new Map();
  projects.forEach(project => {
    const key = normalize(project.owner_email) || normalize(project.owner_name) || project.project_id;
    if(!map.has(key)){
      map.set(key, {
        key,
        owner_name: project.owner_name || 'Sin nombre',
        owner_email: project.owner_email || 'Sin mail',
        projects: []
      });
    }
    map.get(key).projects.push(project);
  });
  return Array.from(map.values()).map(person => {
    person.projects.sort((a,b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
    person.lastUpdated = person.projects[0]?.updated_at || null;
    person.completed = person.projects.filter(p => getProjectStatus(p).key === 'complete').length;
    return person;
  });
}

function getFilteredPeople(){
  const query = normalize(els.searchInput.value);
  const status = els.statusFilter.value;
  let people = groupedPeople.map(p => ({...p, projects:[...p.projects]}));

  people = people.map(person => {
    person.projects = person.projects.filter(project => {
      const projectStatus = getProjectStatus(project).key;
      const textHit = !query || [person.owner_name, person.owner_email, project.project_title, project.project_id].some(v => normalize(v).includes(query));
      const statusHit = status === 'all' || projectStatus === status;
      return textHit && statusHit;
    });
    return person;
  }).filter(person => person.projects.length > 0);

  sortPeople(people);
  return people;
}
function sortPeople(people){
  const mode = els.sortFilter.value;
  if(mode === 'updated_asc') people.sort((a,b) => new Date(a.lastUpdated || 0) - new Date(b.lastUpdated || 0));
  else if(mode === 'name_asc') people.sort((a,b) => (a.owner_name || '').localeCompare(b.owner_name || '', 'es'));
  else if(mode === 'projects_desc') people.sort((a,b) => b.projects.length - a.projects.length || new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0));
  else people.sort((a,b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0));
}
function updateStats(filteredPeople){
  const projects = filteredPeople.flatMap(p => p.projects);
  const completed = projects.filter(p => getProjectStatus(p).key === 'complete').length;
  const recent = projects[0]?.updated_at || null;
  els.statPeople.textContent = String(filteredPeople.length);
  els.statPeopleMeta.textContent = filteredPeople.length ? 'Personas con proyectos visibles según filtros.' : 'No hay personas para esos filtros.';
  els.statProjects.textContent = String(projects.length);
  els.statProjectsMeta.textContent = projects.length ? `${projects.filter(p => getProjectStatus(p).key === 'in_progress').length} en proceso.` : 'Sin proyectos visibles.';
  els.statCompleted.textContent = String(completed);
  els.statCompletedMeta.textContent = projects.length ? `${Math.round((completed / projects.length) * 100) || 0}% del total visible.` : 'Sin proyectos visibles.';
  els.statRecent.textContent = recent ? timeAgo(recent) : '—';
  els.statRecentMeta.textContent = recent ? fmtDate(recent) : 'Aún no hay actividad disponible.';
  els.resultCount.textContent = `${projects.length} resultado${projects.length === 1 ? '' : 's'}`;
}
function renderAll(){
  const filteredPeople = getFilteredPeople();
  updateStats(filteredPeople);
  const scope = els.scopeFilter.value;
  if(scope === 'projects'){
    els.listTitle.textContent = 'Listado de proyectos';
    els.listSubtitle.textContent = 'Vista lineal para revisar todos los proyectos sin agrupar.';
    renderProjectOnlyList(filteredPeople.flatMap(p => p.projects));
  }else{
    els.listTitle.textContent = 'Listado por persona';
    els.listSubtitle.textContent = 'Cada persona puede desplegar sus proyectos y abrir el detalle de cada uno.';
    renderPeopleList(filteredPeople);
  }
  const selectedStillVisible = filteredPeople.flatMap(p => p.projects).find(p => p.project_id === selectedProjectId);
  if(selectedProjectId && !selectedStillVisible){
    selectedProjectId = null;
    els.modalDetailBody.innerHTML = '<div class="emptyState">No hay proyectos para esos filtros.</div>';
    closeDetailModal();
  } else if(selectedStillVisible && els.detailModal.classList.contains('open')) {
    populateProjectDetail(selectedStillVisible);
  }
}
function renderPeopleList(people){
  if(!people.length){
    els.peopleList.innerHTML = '<div class="emptyState">No hay personas o proyectos para los filtros actuales.</div>';
    return;
  }
  els.peopleList.innerHTML = people.map(person => {
    const statusSummary = `${person.projects.length} proyecto${person.projects.length===1?'':'s'} · ${person.completed} completo${person.completed===1?'':'s'}`;
    return `<article class="personCard" data-person-key="${escapeHtml(person.key)}">
      <div class="personTop">
        <div class="personIdentity">
          <div class="personName">${escapeHtml(person.owner_name)}</div>
          <div class="personMeta">${escapeHtml(person.owner_email)}<br>Última actualización ${escapeHtml(fmtDate(person.lastUpdated))}</div>
          <div class="pills">
            <span class="pill ok">${statusSummary}</span>
            <span class="pill">${escapeHtml(timeAgo(person.lastUpdated))}</span>
          </div>
        </div>
        <div class="personActions">
          <button type="button" class="smallBtn togglePersonBtn" data-person-key="${escapeHtml(person.key)}">Ver proyectos</button>
          <button type="button" class="smallBtn exportPersonJsonBtn" data-person-key="${escapeHtml(person.key)}">JSON persona</button>
        </div>
      </div>
      <div class="personProjects">
        ${person.projects.map(projectRowHtml).join('')}
      </div>
    </article>`;
  }).join('');
}
function renderProjectOnlyList(projects){
  if(!projects.length){
    els.peopleList.innerHTML = '<div class="emptyState">No hay proyectos para los filtros actuales.</div>';
    return;
  }
  els.peopleList.innerHTML = projects.map(projectRowHtml).join('');
}
function projectRowHtml(project){
  const status = getProjectStatus(project);
  const completion = getCompletion(project);
  return `<div class="projectRow">
    <div>
      <div class="projectTitle">${escapeHtml(project.project_title || 'Proyecto sin título')}</div>
      <div class="projectMeta">${escapeHtml(project.owner_name || 'Sin nombre')} · ${escapeHtml(project.owner_email || 'Sin mail')}</div>
    </div>
    <div class="miniStat"><span class="statusDot"></span>${escapeHtml(status.label)}</div>
    <div class="miniStat">${completion.answered}/${completion.total} puntos · ${escapeHtml(fmtDate(project.updated_at))}</div>
    <div class="projectActions">
      <button type="button" class="smallBtn primary viewProjectBtn" data-project-id="${escapeHtml(project.project_id)}">Ver detalle</button>
      <button type="button" class="smallBtn exportProjectJsonBtn" data-project-id="${escapeHtml(project.project_id)}">JSON</button>
      <button type="button" class="smallBtn exportProjectPdfBtn" data-project-id="${escapeHtml(project.project_id)}">PDF</button>
      <button type="button" class="smallBtn danger deleteProjectBtn" data-project-id="${escapeHtml(project.project_id)}" data-project-title="${escapeHtml(project.project_title || 'Proyecto sin título')}">Borrar</button>
    </div>
  </div>`;
}
function populateProjectDetail(project){
  const detail = getNormalizedProjectDetail(project);
  const body = `
    <section class="infoCard">
      <div class="infoGrid">
        <div><div class="labelMini">Proyecto</div><div class="valueStrong">${escapeHtml(detail.project_title || 'Proyecto sin título')}</div></div>
        <div><div class="labelMini">Estado</div><div class="valueStrong">${escapeHtml(detail.status?.label || '')}</div></div>
        <div><div class="labelMini">Persona</div><div class="valueStrong">${escapeHtml(detail.owner_name || 'Sin nombre')}</div></div>
        <div><div class="labelMini">Mail</div><div class="valueStrong">${escapeHtml(detail.owner_email || 'Sin mail')}</div></div>
        <div><div class="labelMini">Última actualización</div><div class="valueStrong">${escapeHtml(fmtDate(detail.updated_at))}</div></div>
        <div><div class="labelMini">Puntos respondidos</div><div class="valueStrong">${detail.completion?.answered || 0} / ${detail.completion?.total || 9}</div></div>
      </div>
    </section>
    <section class="infoCard">
      <div class="modalActions">
        <button type="button" class="smallBtn primary" data-project-id="${escapeHtml(detail.project_id)}" id="detailExportPdfBtn">Exportar PDF</button>
        <button type="button" class="smallBtn" data-project-id="${escapeHtml(detail.project_id)}" id="detailExportJsonBtn">Exportar JSON</button>
        <button type="button" class="smallBtn" onclick="window.location.href='review.html?project_id=${encodeURIComponent(detail.project_id || '')}'">Abrir revisión</button>
      </div>
    </section>
    ${renderQuestionBlocksFromNormalized(detail)}
  `;
  els.modalTitle.textContent = detail.project_title || 'Proyecto sin título';
  els.modalSubtitle.textContent = `${detail.owner_name || 'Sin nombre'} · ${detail.owner_email || 'Sin mail'} · ${detail.status?.label || ''}`;
  els.modalDetailBody.innerHTML = body;
  document.getElementById('detailExportPdfBtn')?.addEventListener('click', () => exportPdfLike(project));
  document.getElementById('detailExportJsonBtn')?.addEventListener('click', () => exportJson([project]));
}

function renderProjectDetail(project){
  selectedProjectId = project.project_id;
  populateProjectDetail(project);
  els.detailModal.classList.add('open');
  els.detailModal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
}


async function deleteProject(projectId, projectTitle){
  const ok = window.confirm(`Vas a borrar '${projectTitle || 'Proyecto sin título'}'.\n\n${ADMIN_DELETE_CONFIRM}`);
  if(!ok) return;
  try{
    const url = `${SUPABASE_URL}/rest/v1/${TABLE}?project_id=eq.${encodeURIComponent(projectId)}`;
    const res = await fetch(url, {
      method:'DELETE',
      headers:{
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'return=minimal'
      }
    });
    if(!res.ok){
      const txt = await res.text().catch(()=>'');
      throw new Error(txt || `HTTP ${res.status}`);
    }
    if(selectedProjectId === projectId){
      selectedProjectId = null;
      closeDetailModal();
    }
    await fetchProjects();
    window.alert('Proyecto borrado correctamente.');
  }catch(err){
    console.error(err);
    window.alert('No se pudo borrar el proyecto.');
  }
}

function closeDetailModal(){
  els.detailModal.classList.remove('open');
  els.detailModal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}
els.closeDetailModal.addEventListener('click', closeDetailModal);
els.detailModal.addEventListener('click', (event) => {
  if(event.target === els.detailModal) closeDetailModal();
});
document.addEventListener('keydown', (event) => {
  if(event.key === 'Escape' && els.detailModal.classList.contains('open')) closeDetailModal();
});

els.peopleList.addEventListener('click', (event) => {
  const toggle = event.target.closest('.togglePersonBtn');
  if(toggle){
    const card = event.target.closest('.personCard');
    if(card) card.classList.toggle('open');
    return;
  }
  const personJson = event.target.closest('.exportPersonJsonBtn');
  if(personJson){
    const person = groupedPeople.find(p => p.key === personJson.dataset.personKey);
    if(person) exportJson(person.projects);
    return;
  }
  const view = event.target.closest('.viewProjectBtn');
  if(view){
    const project = allProjects.find(p => p.project_id === view.dataset.projectId);
    if(project) renderProjectDetail(project);
    const card = event.target.closest('.personCard');
    if(card) card.classList.add('open');
    return;
  }
  const jsonBtn = event.target.closest('.exportProjectJsonBtn');
  if(jsonBtn){
    const project = allProjects.find(p => p.project_id === jsonBtn.dataset.projectId);
    if(project) exportJson([project]);
    return;
  }
  const pdfBtn = event.target.closest('.exportProjectPdfBtn');
  if(pdfBtn){
    const project = allProjects.find(p => p.project_id === pdfBtn.dataset.projectId);
    if(project) exportPdfLike(project);
    return;
  }
  const deleteBtn = event.target.closest('.deleteProjectBtn');
  if(deleteBtn){
    deleteProject(deleteBtn.dataset.projectId, deleteBtn.dataset.projectTitle);
    return;
  }
});

['input','change'].forEach(evt => {
  els.searchInput.addEventListener(evt, renderAll);
  els.statusFilter.addEventListener(evt, renderAll);
  els.sortFilter.addEventListener(evt, renderAll);
  els.scopeFilter.addEventListener(evt, renderAll);
});
els.clearFiltersBtn.addEventListener('click', () => {
  els.searchInput.value = '';
  els.statusFilter.value = 'all';
  els.sortFilter.value = 'updated_desc';
  els.scopeFilter.value = 'people';
  renderAll();
});
els.refreshBtn.addEventListener('click', fetchProjects);
els.exportCsvBtn.addEventListener('click', () => exportCsv(getFilteredPeople().flatMap(p => p.projects)));
els.exportJsonBtn.addEventListener('click', () => exportJson(getFilteredPeople().flatMap(p => p.projects)));

fetchProjects();
