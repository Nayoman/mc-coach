// La Pizarra — la app. Un solo fichero: tablero de hoy (Kanban), tele, clientes, ficha, ejercicios y ajustes.
(function () {
  'use strict';
  var cfg = window.PIZARRA_CONFIG;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} } };
  var GRUPOS = { pecho: 'Pecho', espalda: 'Espalda', hombro: 'Hombro', brazos: 'Brazos', piernas: 'Piernas', gluteo: 'Glúteo', core: 'Core', cardio: 'Cardio', movilidad: 'Movilidad', otro: 'Otro' };
  var SKINS = { yard: 'The Yard', apple: 'Apple', nike: 'Nike', gta: 'GTA', aurora: 'Aurora', cyber: 'Cyber' };
  // Frases de la banderola (se cambian en Ajustes; estas son las de serie)
  var FRASES = ['You have more enemies at the top than at the bottom', 'The nail that sticks out takes the most hits', 'Maximum effort', 'Carnicería Miguel Cayuela', 'Discipline beats motivation', 'One more rep', 'Nobody is coming to save you. Get up.', 'Sweat today, shine tomorrow', 'Hard choices, easy life. Easy choices, hard life.', 'No excuses', 'The body achieves what the mind believes', 'Earn it', 'Pain is temporary. Quitting lasts forever.', 'Stay hungry', "We don't stop when we're tired. We stop when we're done.", 'Be the hardest worker in the room'];
  function frasesPropias() { var f = S.config.frases && S.config.frases.lista; return (f && f.length) ? f : FRASES; }
  // Frases de la casa (GY-D30): siempre en la banderola, metidas al azar entre las demás, salvo que se apaguen en Ajustes
  var FRASES_CASA = ['Vendo Opel Corsa', 'Fuck Pccom', 'Always Powerplanet'];
  function frasesCasaOn() { return !(S.config.gimnasio && S.config.gimnasio.frases_casa === false); }
  function frases() { var lista = frasesPropias().slice(); if (!frasesCasaOn()) return lista; FRASES_CASA.forEach(function (f) { lista.splice(Math.floor(Math.random() * (lista.length + 1)), 0, f); }); return lista; }
  var DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  var DIAS_L = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var p2 = function (n) { return String(n).padStart(2, '0'); };
  var iso = function (d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
  var hoyISO = function () { return iso(new Date()); };
  var deISO = function (s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  var addDias = function (s, n) { var d = deISO(s); d.setDate(d.getDate() + n); return iso(d); };
  var idxSemana = function (s) { return (deISO(s).getDay() + 6) % 7; };
  var lunesDe = function (s) { return addDias(s, -idxSemana(s)); };
  var fmtCorta = function (s) { if (!s) return ''; var d = deISO(s.slice(0, 10)); return DIAS[d.getDay()] + ' ' + d.getDate() + ' ' + MESES[d.getMonth()]; };
  var fmtLarga = function (s) { var d = deISO(s); return DIAS_L[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES_L[d.getMonth()]; };
  var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); };
  var numKilos = function (s) { var m = String(s || '').replace(',', '.').match(/(\d+(\.\d+)?)/); return m ? parseFloat(m[1]) : null; };
  var nombreDe = function (c) { return c ? (c.nombre + (c.apellidos ? ' ' + c.apellidos : '')) : '—'; };
  // Iniciales y color propio de cada persona (siempre el mismo para el mismo nombre)
  function iniciales(nombre) { var p = String(nombre || '').split(/\s+/).filter(function (w) { return w && !/^(y|e|de|del|la|el|los|las)$/i.test(w); }); return (p.length > 1 ? p[0][0] + p[1][0] : (p[0] || '?').slice(0, 2)).toUpperCase(); }
  function colorAv(nombre) { var h = 0, s = norm(nombre); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return 'hsl(' + (h % 360) + ' 72% 52%)'; }
  function avatar(c) { var n = nombreDe(c); return '<span class="av" style="--av:' + colorAv(n) + '">' + esc(iniciales(n)) + '</span>'; }
  // «4 × 8-10» → números con carácter y la × más ligera
  function fmtSeries(s) { s = String(s || '').trim(); if (!s) return '<span class="s vacio">—</span>'; var p = s.split(/\s*[×x]\s*/i); if (p.length === 2 && p[0] && p[1]) return '<span class="s"><b>' + esc(p[0]) + '</b><i>×</i><b>' + esc(p[1]) + '</b></span>'; return '<span class="s"><b>' + esc(s) + '</b></span>'; }
  var debounce = function (f, ms) { var t; return function () { var a = arguments, me = this; clearTimeout(t); t = setTimeout(function () { f.apply(me, a); }, ms); }; };

  var S = { modo: window.PIZARRA_MODO || 'app', config: {}, ejercicios: [], fecha: hoyISO(), dia: null, unsub: null, timers: [], skin: 'apple', clientesCache: null, clientesCacheAt: 0, pendienteAgregar: null, pendienteRecarga: false, sortables: [], wake: null };
  var view = $('#view'), toastEl = $('#toast'), scrim = $('#scrim'), sheetRoot = $('#sheet-root');

  // ---------- utilidades de interfaz ----------
  var toastT = null;
  function toast(msg, err) { toastEl.textContent = msg; toastEl.classList.toggle('err', !!err); toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, err ? 4200 : 2400); }
  function fallo(e) { console.error(e); toast((e && e.message) || 'Algo ha fallado', true); }
  function sheet(html) {
    sheetRoot.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' + html + '</div>';
    var el = $('.sheet', sheetRoot);
    requestAnimationFrame(function () { el.classList.add('open'); scrim.classList.add('open'); });
    var af = $('[autofocus]', el); if (af) setTimeout(function () { af.focus(); }, 60);
    return el;
  }
  function cerrarSheet() { var el = $('.sheet', sheetRoot); if (!el) return; el.classList.remove('open'); scrim.classList.remove('open'); setTimeout(function () { if (!$('.sheet.open', sheetRoot)) sheetRoot.innerHTML = ''; }, 230); }
  function cerrarMenu() { var m = $('.menu'); if (m) { m.classList.remove('open'); setTimeout(function () { m.remove(); }, 160); } }
  function menu(anchor, items) {
    cerrarMenu();
    var m = document.createElement('div'); m.className = 'menu';
    m.innerHTML = items.map(function (it, i) { return it === '-' ? '<hr>' : '<button type="button" data-i="' + i + '" class="' + (it.danger ? 'danger' : '') + '">' + esc(it.t) + '</button>'; }).join('');
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect(); var w = 240;
    m.style.top = Math.min(r.bottom + 6, window.innerHeight - 10 - items.length * 48) + 'px';
    m.style.left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8)) + 'px';
    requestAnimationFrame(function () { m.classList.add('open'); });
    m.addEventListener('click', function (ev) { var b = ev.target.closest('button[data-i]'); if (!b) return; cerrarMenu(); var it = items[+b.dataset.i]; if (it && it.f) it.f(); });
    setTimeout(function () { document.addEventListener('pointerdown', function h(ev) { if (!m.contains(ev.target)) { cerrarMenu(); document.removeEventListener('pointerdown', h); } }); }, 0);
  }
  scrim.addEventListener('click', function () { cerrarSheet(); cerrarTPanel(); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { cerrarSheet(); cerrarMenu(); cerrarTPanel(); } });
  function weekDots(set, fecha) {
    var hoy = idxSemana(fecha); var out = '';
    for (var i = 0; i < 7; i++) out += '<i class="' + ((set && set.has(i)) ? 'done ' : '') + (i === hoy ? 'today' : '') + '" title="' + ['L', 'M', 'X', 'J', 'V', 'S', 'D'][i] + '"></i>';
    return '<span class="week" aria-label="Sesiones de la semana">' + out + '</span>';
  }
  function chipGrupo(g) { return '<span class="chip" style="--g:var(--g-' + (g || 'otro') + ')">' + esc(GRUPOS[g] || g || 'Sin grupo') + '</span>'; }
  function nombreGym() { return (S.config.gimnasio && S.config.gimnasio.nombre) || cfg.nombre || 'La Pizarra'; }

  // ---------- piel (estilo) ----------
  var mqDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function skinElegida() { var local = store.get('pizarra_skin'); if (local && SKINS[local]) return local; var c = S.config.gimnasio && S.config.gimnasio.estilo; return SKINS[c] ? c : 'yard'; }
  function aplicarSkin(s) {
    S.skin = s; var root = document.documentElement; root.setAttribute('data-skin', s);
    if (s === 'apple') root.setAttribute('data-dark', mqDark && mqDark.matches ? '1' : '0'); else root.removeAttribute('data-dark');
    var fondo = $('#fondo');
    if (fondo && fondo.className !== s) {
      fondo.className = s;
      fondo.innerHTML = s === 'aurora' ? '<div class="capa a1"></div><div class="capa a2"></div><div class="capa a3"></div><div class="estrellas"></div>'
        : s === 'cyber' ? '<div class="capa n1"></div><div class="capa n2"></div><div class="sol"></div><div class="horizonte"></div><div class="suelo"><div class="rejilla"></div></div><div class="scan"></div>' : '';
    }
    var tc = $('meta[name="theme-color"]'); if (tc) tc.setAttribute('content', getComputedStyle(document.body).backgroundColor || '#0a0a0a');
    $$('.seg[aria-label="Estilo"] button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.skin === s)); });
  }
  if (mqDark && mqDark.addEventListener) mqDark.addEventListener('change', function () { if (S.skin === 'apple') aplicarSkin('apple'); });
  document.addEventListener('click', function (ev) { var b = ev.target.closest('.seg[aria-label="Estilo"] button'); if (!b) return; if (b.closest('[data-ambito="defecto"]')) return; store.set('pizarra_skin', b.dataset.skin); aplicarSkin(b.dataset.skin); });

  // ---------- ejercicios (biblioteca) ----------
  function indexEjercicios() { S.ejercicios.forEach(function (e) { e._n = norm(e.nombre); }); }
  function buscarEjercicios(q, max) {
    q = norm(q); if (!q) return [];
    var pri = [], sec = [];
    for (var i = 0; i < S.ejercicios.length; i++) {
      var e = S.ejercicios[i]; var pos = e._n.indexOf(q); if (pos < 0) continue;
      (pos === 0 || e.origen === 'propio' ? pri : sec).push(e);
      if (pri.length >= max) break;
    }
    return pri.concat(sec).slice(0, max);
  }
  function ejercicioExacto(nombre) { var n = norm(nombre); return S.ejercicios.filter(function (e) { return e._n === n; })[0] || null; }

  // ---------- datos del día ----------
  async function cargarDia(fecha) {
    var ses = await DB.sesionesDelDia(fecha);
    var ids = []; ses.forEach(function (s) { if (ids.indexOf(s.cliente_id) < 0) ids.push(s.cliente_id); });
    var lunes = lunesDe(fecha);
    var r = await Promise.all([DB.sesionesEntre(ids, lunes, addDias(lunes, 6)), DB.ultimosItems(ids, fecha)]);
    var semana = {}, ultimas = {}, ultimaFecha = {};
    r[0].forEach(function (x) { (semana[x.cliente_id] = semana[x.cliente_id] || new Set()).add(idxSemana(x.fecha)); });
    r[1].forEach(function (it) {
      var cid = it.sesiones.cliente_id, f = it.sesiones.fecha, k = norm(it.nombre);
      var m = (ultimas[cid] = ultimas[cid] || {});
      if (!m[k] || m[k].fecha < f) m[k] = { series: it.series, kilos: it.kilos, fecha: f };
      if (!ultimaFecha[cid] || ultimaFecha[cid] < f) ultimaFecha[cid] = f;
    });
    return { sesiones: ses, semana: semana, ultimas: ultimas, ultimaFecha: ultimaFecha };
  }
  async function clientesActivos() {
    if (S.clientesCache && Date.now() - S.clientesCacheAt < 60000) return S.clientesCache;
    S.clientesCache = await DB.clientes(); S.clientesCacheAt = Date.now(); return S.clientesCache;
  }
  function invalidarClientes() { S.clientesCache = null; }

  // ---------- enrutado ----------
  function limpiar() {
    if (S.unsub) { try { S.unsub(); } catch (e) {} S.unsub = null; }
    S.timers.forEach(clearInterval); S.timers = [];
    S.sortables.forEach(function (s) { try { s.destroy(); } catch (e) {} }); S.sortables = [];
    cerrarMenu(); cerrarSheet(); cerrarTPanel();
    window.removeEventListener('resize', fitTele);
  }
  function marcarNav(r) { $$('[data-r]').forEach(function (a) { a.classList.toggle('on', a.dataset.r === r); }); }
  function route() {
    limpiar();
    if (S.modo === 'tele') { document.body.classList.add('modo-tele'); return vistaTele().catch(fallo); }
    if (S.modo === 'yo') { document.body.classList.add('modo-yo'); return vistaYo().catch(fallo); }
    var h = location.hash.replace(/^#\/?/, ''); var p = h.split('/'); var r = p[0] || 'hoy';
    document.body.classList.toggle('modo-tele', r === 'tele');
    marcarNav(r);
    var f = { hoy: vistaHoy, tele: vistaTele, clientes: vistaClientes, cliente: function () { return vistaCliente(p[1]); }, ejercicios: vistaEjercicios, ajustes: vistaAjustes }[r] || vistaHoy;
    f().catch(fallo);
  }

  // ======================================================================
  // HOY — el tablero (Kanban)
  // ======================================================================
  async function vistaHoy() {
    var esHoy = S.fecha === hoyISO();
    view.innerHTML =
      '<div class="vhead"><button type="button" class="btn icon" data-act="prev" aria-label="Día anterior">‹</button>' +
      '<div><h2>' + (esHoy ? 'Hoy' : fmtCorta(S.fecha)) + '</h2><div class="sub">' + fmtLarga(S.fecha) + '</div></div>' +
      '<button type="button" class="btn icon" data-act="next" aria-label="Día siguiente">›</button>' +
      (esHoy ? '' : '<button type="button" class="btn sm" data-act="ir-hoy">Ir a hoy</button>') +
      '<div class="right"><button type="button" class="btn primary" data-act="add-cliente">+ Cliente</button></div></div>' +
      '<div class="tablero" id="tablero"><div class="muted">Cargando…</div></div>';
    await recargarHoy();
    S.unsub = DB.suscribir('hoy', onCambioRemoto);
    if (S.pendienteAgregar) { var c = S.pendienteAgregar; S.pendienteAgregar = null; abrirAgregarCliente(c).catch(fallo); }
  }
  async function recargarHoy() {
    S.dia = await cargarDia(S.fecha);
    renderTablero();
  }
  var onCambioRemoto = debounce(function () {
    var a = document.activeElement;
    if (a && view.contains(a) && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) { S.pendienteRecarga = true; return; }
    recargarHoy().catch(fallo);
  }, 350);
  view.addEventListener('focusout', function () { setTimeout(function () { var a = document.activeElement; if (S.pendienteRecarga && !(a && view.contains(a) && a.tagName === 'INPUT') && $('#tablero')) { S.pendienteRecarga = false; recargarHoy().catch(fallo); } }, 250); });

  function renderTablero() {
    var t = $('#tablero'); if (!t) return;
    var d = S.dia;
    if (!d.sesiones.length) {
      t.innerHTML = '<div class="vacio" style="flex:1"><p>Nadie en el tablero ' + (S.fecha === hoyISO() ? 'todavía.' : 'ese día.') + '</p><button type="button" class="btn primary" data-act="add-cliente">+ Añadir cliente</button></div>';
      return;
    }
    t.innerHTML = d.sesiones.map(renderColumna).join('') + '<button type="button" class="col-add-cliente" data-act="add-cliente">+ Cliente</button>';
    S.sortables.forEach(function (s) { try { s.destroy(); } catch (e) {} }); S.sortables = [];
    if (window.Sortable) $$('.cards', t).forEach(function (el) {
      S.sortables.push(new Sortable(el, { animation: 150, filter: 'input,button', preventOnFilter: false, delay: 120, delayOnTouchOnly: true, ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen',
        onEnd: function () { var pares = $$('.card-ej', el).map(function (c, i) { return { id: c.dataset.id, orden: i }; }); var ses = sesionPorId(el.dataset.sesion); if (ses) pares.forEach(function (p) { var it = ses.items.filter(function (x) { return x.id === p.id; })[0]; if (it) it.orden = p.orden; }); DB.reordenarItems(pares).catch(fallo); } }));
    });
  }
  function sesionPorId(id) { return S.dia && S.dia.sesiones.filter(function (s) { return s.id === id; })[0]; }
  function renderColumna(s) {
    var cid = s.cliente_id, sem = S.dia.semana[cid], ult = S.dia.ultimas[cid] || {}, uf = S.dia.ultimaFecha[cid];
    var hechos = s.items.filter(function (it) { return it.hecho; }).length;
    return '<article class="col ' + (s.estado === 'hecha' ? 'hecha' : '') + '" data-sesion="' + s.id + '">' +
      '<header class="col-head"><button type="button" class="col-nombre" data-act="ficha" data-cliente="' + cid + '">' + avatar(s.cliente) + '<span class="wt"><h3>' + esc(nombreDe(s.cliente)) + '</h3><span class="col-prog">' + hechos + ' de ' + s.items.length + ' hechos</span></span></button>' +
      '<button type="button" class="day ' + (s.dia ? '' : 'none') + '" data-act="dia" title="Cambiar el día">' + (s.dia ? 'Día ' + s.dia : 'Libre') + '</button>' +
      '<button type="button" class="btn icon ghost" data-act="menu" aria-label="Más opciones">⋯</button></header>' +
      '<div class="col-sub">' + weekDots(sem, S.fecha) + '<span>' + (sem ? sem.size : 0) + ' esta semana</span>' + (uf ? '<span>· última ' + fmtCorta(uf) + '</span>' : '<span>· primera sesión</span>') + (s.estado === 'hecha' ? '<span class="chip estado">Hecha</span>' : '') + '</div>' +
      '<div class="cards" data-sesion="' + s.id + '">' + s.items.map(function (it) { return renderCardEj(it, ult[norm(it.nombre)]); }).join('') + '</div>' +
      '<div class="col-add"><input class="add-ej" placeholder="+ Ejercicio" autocomplete="off" data-sesion="' + s.id + '" aria-label="Añadir ejercicio"><div class="sug"></div></div>' +
      '<div class="col-final"><input class="final" value="' + esc(s.final) + '" placeholder="Al final: cardio, abdomen…" data-sesion="' + s.id + '" aria-label="Final de la sesión"></div>' +
      '</article>';
  }
  function renderCardEj(it, ult) {
    return '<div class="card-ej ' + (it.hecho ? 'hecho' : '') + '" data-id="' + it.id + '" style="--g:var(--g-' + (it.grupo || 'otro') + ')"><span class="handle"></span>' +
      '<button type="button" class="mark" data-act="hecho" aria-label="Marcar hecho">✓</button>' +
      '<div class="ej-main"><input class="ej-nombre" value="' + esc(it.nombre) + '" data-campo="nombre" aria-label="Ejercicio">' +
      '<div class="ej-meta"><input value="' + esc(it.series) + '" placeholder="Series × reps" data-campo="series" aria-label="Series"><input value="' + esc(it.kilos) + '" placeholder="Kilos" data-campo="kilos" aria-label="Kilos"></div>' +
      (ult ? '<div class="ultima"><span class="gdot"></span>Última vez ' + fmtCorta(ult.fecha) + ': <b>' + esc(ult.series || '—') + '</b>' + (ult.kilos ? ' · <b>' + esc(ult.kilos) + '</b>' : '') + '</div>' : '') +
      '</div><button type="button" class="ej-del" data-act="del" aria-label="Quitar ejercicio">×</button></div>';
  }

  // acciones del tablero
  var guardarCampo = {};
  view.addEventListener('input', function (ev) {
    var inp = ev.target;
    if (inp.matches('.card-ej input[data-campo]')) {
      var card = inp.closest('.card-ej'), id = card.dataset.id, campo = inp.dataset.campo, val = inp.value;
      var ses = sesionPorId(card.closest('.cards').dataset.sesion); var it = ses && ses.items.filter(function (x) { return x.id === id; })[0]; if (it) it[campo] = val;
      clearTimeout(guardarCampo[id + campo]);
      guardarCampo[id + campo] = setTimeout(function () { var patch = {}; patch[campo] = val; if (campo === 'nombre') { var e = ejercicioExacto(val); if (e) { patch.ejercicio_id = e.id; patch.grupo = e.grupo; if (it) { it.grupo = e.grupo; card.style.setProperty('--g', 'var(--g-' + e.grupo + ')'); } } } DB.actualizarItem(id, patch).catch(fallo); }, 500);
    } else if (inp.matches('.add-ej')) {
      mostrarSugerencias(inp);
    } else if (inp.matches('.final')) {
      var sid = inp.dataset.sesion; clearTimeout(guardarCampo['final' + sid]);
      guardarCampo['final' + sid] = setTimeout(function () { var s = sesionPorId(sid); if (s) s.final = inp.value; DB.actualizarSesion(sid, { final: inp.value }).catch(fallo); }, 500);
    }
  });
  view.addEventListener('keydown', function (ev) {
    var inp = ev.target;
    if (inp.matches && inp.matches('.add-ej')) {
      var sug = inp.parentElement.querySelector('.sug'); var botones = $$('button', sug); var act = botones.findIndex(function (b) { return b.classList.contains('act'); });
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); if (!botones.length) return; var n = ev.key === 'ArrowDown' ? Math.min(act + 1, botones.length - 1) : Math.max(act - 1, 0); botones.forEach(function (b, i) { b.classList.toggle('act', i === n); }); }
      else if (ev.key === 'Enter') { ev.preventDefault(); var b = botones[act >= 0 ? act : 0]; if (b) elegirSugerencia(b, inp); else if (inp.value.trim()) agregarItem(inp.dataset.sesion, null, inp.value.trim(), inp); }
      else if (ev.key === 'Escape') { sug.classList.remove('open'); inp.blur(); }
    } else if (inp.matches && inp.matches('.card-ej input') && ev.key === 'Enter') { ev.preventDefault(); inp.blur(); }
  });
  view.addEventListener('focusout', function (ev) { if (ev.target.matches && ev.target.matches('.add-ej')) { var sug = ev.target.parentElement.querySelector('.sug'); setTimeout(function () { sug.classList.remove('open'); }, 180); } });
  function mostrarSugerencias(inp) {
    var sug = inp.parentElement.querySelector('.sug'); var q = inp.value.trim();
    if (!q) { sug.classList.remove('open'); sug.innerHTML = ''; return; }
    var res = buscarEjercicios(q, 7); var exacto = ejercicioExacto(q);
    sug.innerHTML = res.map(function (e, i) { return '<button type="button" class="' + (i === 0 ? 'act' : '') + '" data-ej="' + e.id + '">' + (e.imagen ? '<img src="' + esc(e.imagen) + '" alt="" loading="lazy">' : '<span class="gdot" style="--g:var(--g-' + e.grupo + ');width:10px;height:10px;border-radius:50%;background:var(--g);display:inline-block"></span>') + '<span class="n">' + esc(e.nombre) + '</span><span class="g">' + esc(GRUPOS[e.grupo] || '') + '</span></button>'; }).join('') +
      (exacto ? '' : '<button type="button" class="nuevo ' + (res.length ? '' : 'act') + '" data-nuevo="1"><span class="n">Crear «' + esc(q) + '»</span><span class="g">propio</span></button>');
    sug.classList.add('open');
  }
  view.addEventListener('pointerdown', function (ev) {
    var b = ev.target.closest('.sug button'); if (!b) return;
    ev.preventDefault(); // no perder el foco del input
    elegirSugerencia(b, b.closest('.col-add').querySelector('.add-ej'));
  });
  function elegirSugerencia(b, inp) {
    var sid = inp.dataset.sesion;
    if (b.dataset.ej) { var e = S.ejercicios.filter(function (x) { return x.id === b.dataset.ej; })[0]; agregarItem(sid, e, e.nombre, inp); }
    else agregarItem(sid, null, inp.value.trim(), inp);
  }
  async function agregarItem(sid, ej, nombre, inp) {
    try {
      var ses = sesionPorId(sid); if (!ses || !nombre) return;
      if (!ej) {
        ej = ejercicioExacto(nombre);
        if (!ej) { ej = await DB.crearEjercicio({ nombre: nombre, grupo: 'otro', origen: 'propio' }); ej._n = norm(ej.nombre); S.ejercicios.push(ej); toast('Ejercicio nuevo «' + nombre + '» guardado en la biblioteca'); }
      }
      var ult = (S.dia.ultimas[ses.cliente_id] || {})[norm(ej.nombre)];
      var nuevo = { sesion_id: sid, ejercicio_id: ej.id, nombre: ej.nombre, grupo: ej.grupo || '', series: ult ? ult.series : '', kilos: ult ? ult.kilos : '', orden: ses.items.length };
      var creados = await DB.crearItems([nuevo]);
      ses.items.push(creados[0]);
      var cards = $('.cards[data-sesion="' + sid + '"]'); if (cards) cards.insertAdjacentHTML('beforeend', renderCardEj(creados[0], ult));
      if (inp) { inp.value = ''; inp.parentElement.querySelector('.sug').classList.remove('open'); inp.focus(); }
    } catch (e) { fallo(e); }
  }
  view.addEventListener('change', function (ev) { /* los campos se guardan al escribir; nada extra */ });
  view.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-act]'); if (!b) return;
    var act = b.dataset.act;
    if (act === 'prev') { S.fecha = addDias(S.fecha, -1); return route(); }
    if (act === 'next') { S.fecha = addDias(S.fecha, 1); return route(); }
    if (act === 'ir-hoy') { S.fecha = hoyISO(); return route(); }
    if (act === 'add-cliente') return abrirAgregarCliente().catch(fallo);
    if (act === 'ficha') { location.hash = '#cliente/' + b.dataset.cliente; return; }
    var col = b.closest('.col'); var ses = col && sesionPorId(col.dataset.sesion);
    if (act === 'dia' && ses) return abrirDia(ses);
    if (act === 'menu' && ses) return menuColumna(b, ses);
    if (act === 'hecho') { var card = b.closest('.card-ej'); var it = ses && ses.items.filter(function (x) { return x.id === card.dataset.id; })[0]; if (!it) return; it.hecho = !it.hecho; card.classList.toggle('hecho', it.hecho); DB.actualizarItem(it.id, { hecho: it.hecho }).catch(fallo); return; }
    if (act === 'del') { var card2 = b.closest('.card-ej'); var id = card2.dataset.id; if (ses) ses.items = ses.items.filter(function (x) { return x.id !== id; }); card2.remove(); DB.borrarItem(id).then(function () { toast('Ejercicio quitado'); }).catch(fallo); return; }
  });
  function abrirDia(ses) {
    var el = sheet('<h3>Día de la sesión · ' + esc(nombreDe(ses.cliente)) + '</h3><p class="nota">El «Día» es el número de sesión dentro de su programa (Día 1, Día 2…). Libre = sin programa.</p><div class="row" id="dias">' +
      [1, 2, 3, 4, 5, 6, 7].map(function (n) { return '<button type="button" class="btn ' + (ses.dia === n ? 'primary' : '') + '" data-dia="' + n + '">Día ' + n + '</button>'; }).join('') + '<button type="button" class="btn ' + (ses.dia ? '' : 'primary') + '" data-dia="0">Libre</button></div>');
    el.addEventListener('click', function (ev) { var b = ev.target.closest('[data-dia]'); if (!b) return; var d = +b.dataset.dia || null; ses.dia = d; DB.actualizarSesion(ses.id, { dia: d }).then(function () { cerrarSheet(); renderTablero(); }).catch(fallo); });
  }
  function menuColumna(btn, ses) {
    menu(btn, [
      { t: 'Copiar su última sesión aquí', f: function () { copiarUltima(ses).catch(fallo); } },
      { t: ses.estado === 'hecha' ? 'Reabrir la sesión' : 'Marcar sesión terminada', f: function () { var e = ses.estado === 'hecha' ? 'hoy' : 'hecha'; ses.estado = e; DB.actualizarSesion(ses.id, { estado: e }).then(renderTablero).catch(fallo); } },
      { t: 'Ver ficha de ' + ses.cliente.nombre, f: function () { location.hash = '#cliente/' + ses.cliente_id; } },
      '-',
      { t: 'Quitar del tablero', danger: true, f: function () { quitarSesion(ses); } }
    ]);
  }
  async function copiarUltima(ses) {
    var hist = await DB.sesionesCliente(ses.cliente_id, 10);
    var prev = hist.filter(function (s) { return s.fecha < ses.fecha && s.items.length; })[0];
    if (!prev) return toast('No tiene una sesión anterior con ejercicios');
    var base = ses.items.length;
    var nuevos = prev.items.map(function (it, i) { return { sesion_id: ses.id, ejercicio_id: it.ejercicio_id, nombre: it.nombre, grupo: it.grupo, series: it.series, kilos: it.kilos, notas: it.notas, orden: base + i }; });
    await DB.crearItems(nuevos);
    if (!ses.final && prev.final) await DB.actualizarSesion(ses.id, { final: prev.final });
    await recargarHoy(); toast('Copiados ' + nuevos.length + ' ejercicios de ' + fmtCorta(prev.fecha));
  }
  function quitarSesion(ses) {
    if (!ses.items.length) return DB.borrarSesion(ses.id).then(recargarHoy).catch(fallo);
    var el = sheet('<h3>¿Quitar a ' + esc(nombreDe(ses.cliente)) + ' del tablero?</h3><p class="nota">Se borra esta sesión con sus ' + ses.items.length + ' ejercicios. Las sesiones anteriores no se tocan.</p><div class="acciones"><button type="button" class="btn" data-x="no">Cancelar</button><button type="button" class="btn danger" data-x="si">Quitar</button></div>');
    el.addEventListener('click', function (ev) { var b = ev.target.closest('[data-x]'); if (!b) return; cerrarSheet(); if (b.dataset.x === 'si') DB.borrarSesion(ses.id).then(recargarHoy).catch(fallo); });
  }

  // añadir cliente al tablero
  async function abrirAgregarCliente(pre) {
    if (pre) return pasoPlantilla(pre);
    var clientes = await clientesActivos();
    var enTablero = {}; (S.dia ? S.dia.sesiones : []).forEach(function (s) { enTablero[s.cliente_id] = true; });
    var el = sheet('<h3>Añadir al tablero · ' + (S.fecha === hoyISO() ? 'hoy' : fmtCorta(S.fecha)) + '</h3><input class="input" id="buscar-cli" placeholder="Busca por nombre…" autocomplete="off" autofocus><div class="lista" id="lista-cli"></div><div class="row"><button type="button" class="btn ghost" id="nuevo-cli">+ Cliente nuevo</button><span class="nota">' + clientes.length + ' clientes activos</span></div>');
    var lista = $('#lista-cli', el), q = $('#buscar-cli', el);
    function pintar() {
      var t = norm(q.value); var res = clientes.filter(function (c) { return !enTablero[c.id] && (!t || norm(nombreDe(c)).indexOf(t) >= 0); }).slice(0, 30);
      lista.innerHTML = res.length ? res.map(function (c) { return '<div class="item btnlike" data-id="' + c.id + '"><span class="n">' + esc(nombreDe(c)) + '</span><span class="s">' + (c.notas ? esc(c.notas.slice(0, 40)) : '') + '</span></div>'; }).join('') : '<div class="nota">' + (t ? 'Nadie se llama así. Puedes crearlo abajo.' : 'Todos los clientes ya están en el tablero.') + '</div>';
    }
    pintar(); q.addEventListener('input', pintar);
    lista.addEventListener('click', function (ev) { var it = ev.target.closest('[data-id]'); if (!it) return; var c = clientes.filter(function (x) { return x.id === it.dataset.id; })[0]; pasoPlantilla(c).catch(fallo); });
    $('#nuevo-cli', el).addEventListener('click', function () { formCliente(null, q.value.trim(), function (c) { invalidarClientes(); pasoPlantilla(c).catch(fallo); }); });
  }
  async function pasoPlantilla(c) {
    var hist = (await DB.sesionesCliente(c.id, 30)).filter(function (s) { return s.fecha !== S.fecha; });
    var ultima = hist[0];
    var diaSug = ultima ? (ultima.dia ? ultima.dia + 1 : 0) : 1;
    var maxDia = Math.max.apply(null, [0].concat(hist.map(function (s) { return s.dia || 0; })));
    if (diaSug > Math.max(maxDia, 1) && maxDia >= 2) diaSug = 1; // terminó el ciclo: vuelve al Día 1
    var dia = diaSug;
    var el = sheet('<h3>' + esc(nombreDe(c)) + ' · ' + (S.fecha === hoyISO() ? 'hoy' : fmtCorta(S.fecha)) + '</h3>' +
      '<div class="field"><label>Día de la sesión</label><div class="row" id="dias">' + [1, 2, 3, 4, 5, 6, 7].map(function (n) { return '<button type="button" class="btn sm" data-dia="' + n + '">Día ' + n + '</button>'; }).join('') + '<button type="button" class="btn sm" data-dia="0">Libre</button></div></div>' +
      '<div class="field"><label>Ejercicios de partida</label><div class="opciones" id="plantillas"></div></div>' +
      '<div class="acciones"><button type="button" class="btn" data-x="no">Cancelar</button><button type="button" class="btn primary" data-x="si">Añadir al tablero</button></div>');
    function pintarDias() { $$('[data-dia]', el).forEach(function (b) { b.classList.toggle('primary', (+b.dataset.dia || 0) === (dia || 0)); }); }
    function pintarPlantillas() {
      var ops = [];
      if (ultima && ultima.items.length) ops.push({ v: 'ultima', t: 'Copiar la última sesión · ' + fmtCorta(ultima.fecha) + (ultima.dia ? ' (Día ' + ultima.dia + ')' : '') + ' · ' + ultima.items.length + ' ejercicios' });
      var mismoDia = dia ? hist.filter(function (s) { return s.dia === dia && s.items.length; })[0] : null;
      if (mismoDia && mismoDia !== ultima) ops.push({ v: 'dia', t: 'Copiar su último Día ' + dia + ' · ' + fmtCorta(mismoDia.fecha) + ' · ' + mismoDia.items.length + ' ejercicios' });
      ops.push({ v: 'vacia', t: 'Empezar vacía' });
      var def = ops.filter(function (o) { return o.v === 'dia'; })[0] ? 'dia' : ops[0].v;
      $('#plantillas', el).innerHTML = ops.map(function (o) { return '<label><input type="radio" name="pl" value="' + o.v + '" ' + (o.v === def ? 'checked' : '') + '><span>' + esc(o.t) + '</span></label>'; }).join('');
    }
    pintarDias(); pintarPlantillas();
    el.addEventListener('click', async function (ev) {
      var bd = ev.target.closest('[data-dia]'); if (bd) { dia = +bd.dataset.dia || null; pintarDias(); pintarPlantillas(); return; }
      var bx = ev.target.closest('[data-x]'); if (!bx) return;
      if (bx.dataset.x === 'no') return cerrarSheet();
      bx.disabled = true;
      try {
        var pl = ($('input[name="pl"]:checked', el) || {}).value || 'vacia';
        var base = pl === 'ultima' ? ultima : pl === 'dia' ? hist.filter(function (s) { return s.dia === dia && s.items.length; })[0] : null;
        var ses = await DB.crearSesion({ cliente_id: c.id, fecha: S.fecha, dia: dia || null, orden: S.dia ? S.dia.sesiones.length : 0, final: base ? base.final : '' });
        if (base) await DB.crearItems(base.items.map(function (it, i) { return { sesion_id: ses.id, ejercicio_id: it.ejercicio_id, nombre: it.nombre, grupo: it.grupo, series: it.series, kilos: it.kilos, notas: it.notas, orden: i }; }));
        cerrarSheet(); await recargarHoy(); toast(nombreDe(c) + ' añadido' + (base ? ' con ' + base.items.length + ' ejercicios' : ''));
        var col = $('.col[data-sesion="' + ses.id + '"]'); if (col) col.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } catch (e) { bx.disabled = false; fallo(e); }
    });
  }

  // ======================================================================
  // TELE
  // ======================================================================
  async function vistaTele() {
    S.fecha = hoyISO();
    S.pag = { idx: 0 };
    view.innerHTML = '<section class="tele" id="tele"><header class="top"><div class="brand"><img class="logo-yard" src="logo-yard.png" alt=""><h1>' + esc(nombreGym()) + '</h1><span class="date" id="t-date"></span><span class="pag" id="t-pag"></span></div><div class="clock" id="t-clock">--:--</div>' +
      '<div class="tools"><div class="seg" role="group" aria-label="Estilo">' + Object.keys(SKINS).map(function (s) { return '<button type="button" data-skin="' + s + '" aria-pressed="' + (S.skin === s) + '">' + SKINS[s] + '</button>'; }).join('') + '</div>' +
      '<button type="button" class="btn" id="t-modo">Modo tele</button>' + (S.modo === 'tele' ? '' : '<a class="btn ghost sm" href="#hoy">Cuaderno</a>') + '</div></header>' +
      '<div class="board" id="board"><div class="tele-vacia">Cargando…</div></div>' +
      '<div class="ticker" id="ticker" hidden><div class="track" id="ticker-track"></div></div>' +
      '<p class="hint">Toca un ejercicio para marcarlo hecho. Toca el nombre para ver la ficha.</p></section>' +
      '<aside class="tpanel" id="tpanel" aria-hidden="true" aria-label="Ficha del cliente"></aside>';
    function tick() { var d = new Date(); $('#t-clock').textContent = p2(d.getHours()) + ':' + p2(d.getMinutes()); $('#t-date').textContent = fmtCorta(iso(d)); if (hoyISO() !== S.fecha) { S.fecha = hoyISO(); recargarTele().catch(fallo); } }
    tick(); S.timers.push(setInterval(tick, 10000));
    // páginas que rotan cuando hay más gente de la que cabe
    S.timers.push(setInterval(function () {
      var n = S.dia ? S.dia.sesiones.length : 0; var L = layoutTele(n); var pages = Math.ceil(n / L.size);
      if (pages <= 1 || !$('#board')) return;
      var b = $('#board'); b.classList.add('cambiando');
      setTimeout(function () { S.pag.idx = (S.pag.idx + 1) % pages; renderBoard(); var b2 = $('#board'); if (b2) b2.classList.remove('cambiando'); }, 260);
    }, 15000));
    $('#t-modo').addEventListener('click', modoTele);
    window.addEventListener('resize', fitTele);
    // en un PC: el ratón se esconde a los 3 s quieto; abierta desde el cuaderno o el lanzador, se pone completa sola
    var qs = new URLSearchParams(location.search), tRaton = null;
    document.addEventListener('mousemove', function () { document.body.classList.remove('sin-raton'); clearTimeout(tRaton); tRaton = setTimeout(function () { document.body.classList.add('sin-raton'); }, 3000); });
    if (qs.get('kiosk') || qs.get('auto')) {
      try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (w) { S.wake = w; }).catch(function () {}); } catch (e) {}
      var completa = function () { return !!document.fullscreenElement || (window.outerWidth >= screen.availWidth - 2 && window.outerHeight >= screen.availHeight - 2); };
      if (!completa()) { document.addEventListener('pointerdown', function una() { document.removeEventListener('pointerdown', una); modoTele(); }); toast('Toca la pantalla o pulsa F11 para ponerla completa'); }
    }
    renderTicker(); S.timers.push(setInterval(renderTicker, 5 * 60000));
    await recargarTele();
    setTimeout(fitTele, 1500); // por si las fuentes o la banderola llegaron tarde
    S.unsub = DB.suscribir('tele', debounce(function (payload) { if (payload && payload.table === 'config') DB.getConfig().then(function (c) { S.config = c; if (!store.get('pizarra_skin')) aplicarSkin(skinElegida()); var h = $('.tele .brand h1'); if (h) h.textContent = nombreGym(); renderTicker(); }).catch(function () {}); recargarTele().catch(fallo); }, 400));
    if (!$('#tpanel')) return;
    $('#board').addEventListener('pointerdown', function (ev) { var li = ev.target.closest('li[data-id]'); if (!li) return; if (ev.pointerType === 'mouse' && ev.button !== 0) return; var ses = sesionPorId(li.closest('.tcard').dataset.sesion); var it = ses && ses.items.filter(function (x) { return x.id === li.dataset.id; })[0]; if (!it) return; it.hecho = !it.hecho; li.classList.toggle('done', it.hecho); li.setAttribute('aria-checked', String(it.hecho)); DB.actualizarItem(it.id, { hecho: it.hecho }).catch(fallo); });
    $('#board').addEventListener('click', function (ev) { var w = ev.target.closest('.who'); if (w) abrirTPanel(w.dataset.cliente).catch(fallo); });
    $('#tpanel').addEventListener('click', function (ev) { if (ev.target.closest('[data-close]')) cerrarTPanel(); });
  }
  async function recargarTele() { S.dia = await cargarDia(S.fecha); renderBoard(); }
  // Reparto de la pantalla según cuánta gente hay: hasta 8 caben a la vez; con 9 o más, páginas de 6 que van rotando.
  function layoutTele(n) { if (n <= 1) return { cols: 1, size: 1 }; if (n === 2) return { cols: 2, size: 2 }; if (n <= 4) return { cols: 2, size: 4 }; if (n <= 6) return { cols: 3, size: 6 }; if (n <= 8) return { cols: 4, size: 8 }; return { cols: 3, size: 6 }; }
  function renderTicker() {
    var t = $('#ticker'); if (!t) return;
    var on = !(S.config.gimnasio && S.config.gimnasio.banderola === false); var lista = frases();
    if (!on || !lista.length) { t.hidden = true; return; }
    t.hidden = false;
    var items = lista.map(function (f) { var sp = /carnicer|patrocin|sponsor/i.test(f) || FRASES_CASA.indexOf(f) >= 0; return '<span class="ti' + (sp ? ' sp' : '') + '"><b>' + (sp ? '◆' : '▲') + '</b>' + esc(f) + '</span>'; }).join('');
    var track = $('#ticker-track'); track.style.setProperty('--dur', Math.max(30, Math.round(lista.join(' ').length / 5)) + 's'); track.innerHTML = items + items;
    if (!$('.live', t)) t.insertAdjacentHTML('afterbegin', '<span class="live"><i></i>Live</span>');
  }
  function renderBoard() {
    var b = $('#board'); if (!b) return;
    qrOn = !(S.config.gimnasio && S.config.gimnasio.qr === false) && !!window.qrcode;
    var todas = S.dia.sesiones, n = todas.length, L = layoutTele(n), pages = Math.max(1, Math.ceil(n / L.size));
    if (!S.pag) S.pag = { idx: 0 }; if (S.pag.idx >= pages) S.pag.idx = 0;
    var ses = pages > 1 ? todas.slice(S.pag.idx * L.size, (S.pag.idx + 1) * L.size) : todas;
    var pg = $('#t-pag'); if (pg) pg.textContent = pages > 1 ? '· ' + n + ' entrenando · página ' + (S.pag.idx + 1) + ' de ' + pages : (n > 4 ? '· ' + n + ' entrenando' : '');
    b.className = 'board n' + Math.min(ses.length, 12) + (ses.length >= 5 ? ' denso' : '');
    b.style.setProperty('--cols', String(L.cols));
    if (!ses.length) { b.innerHTML = '<div class="tele-vacia">Nadie en la pizarra todavía.<br><small>El entrenador añade clientes desde el cuaderno.</small></div>'; return; }
    b.innerHTML = ses.map(function (s) {
      var grupos = [], cnt = {}; s.items.forEach(function (it) { if (it.grupo) { cnt[it.grupo] = (cnt[it.grupo] || 0) + 1; if (grupos.indexOf(it.grupo) < 0) grupos.push(it.grupo); } });
      var dominante = grupos.sort(function (a, b2) { return cnt[b2] - cnt[a]; })[0] || 'otro';
      var sem = S.dia.semana[s.cliente_id]; var hechos = s.items.filter(function (it) { return it.hecho; }).length; var pct = s.items.length ? Math.round(hechos * 100 / s.items.length) : 0;
      return '<article class="tcard ' + (s.estado === 'hecha' ? 'hecha' : '') + '" data-sesion="' + s.id + '" style="--gp:var(--g-' + dominante + ')">' +
        '<div class="head"><button type="button" class="who" data-cliente="' + s.cliente_id + '">' + avatar(s.cliente) + '<span class="wt"><h2 class="name">' + esc(nombreDe(s.cliente)) + '</h2><span class="sub">' + weekDots(sem, S.fecha) + '<span>' + (sem ? sem.size : 0) + ' esta semana</span>' + (s.estado === 'hecha' ? '<span>· terminada</span>' : '') + '</span></span></button>' +
        '<div class="hd">' + (s.dia ? '<span class="day">Día ' + s.dia + '</span>' : '<span class="day none">Libre</span>') + '<span class="cnt" title="Hechos"><b>' + hechos + '</b>/' + s.items.length + '</span></div></div>' +
        '<div class="pbar"><i style="width:' + pct + '%"></i></div>' +
        '<ol>' + s.items.map(function (it, i) { return '<li class="' + (it.hecho ? 'done' : '') + '" data-id="' + it.id + '" role="checkbox" aria-checked="' + it.hecho + '" tabindex="0" style="--g:var(--g-' + (it.grupo || 'otro') + ')"><span class="gb"></span><span class="n">' + (i + 1) + '</span><span class="t">' + esc(it.nombre) + (it.notas ? '<small>' + esc(it.notas) + '</small>' : '') + '</span>' + fmtSeries(it.series) + (it.kilos ? '<span class="k">' + esc(it.kilos) + '</span>' : '') + '</li>'; }).join('') + '</ol>' +
        (s.final || qrOn ? '<div class="foot">' + (s.final ? '<div class="fin"><b>' + esc(s.final) + '</b></div>' : '<span></span>') + (qrOn ? '<a class="qr" href="' + esc(urlYo(s)) + '" target="_blank" rel="noopener"><span class="qr-img">' + qrSvg(urlYo(s)) + '</span><span>Marca lo que hagas desde tu móvil</span></a>' : '') + '</div>' : '') + '</article>';
    }).join('');
    fitTele();
  }
  var qrOn = false;
  function urlYo(s) { return new URL('yo.html?s=' + s.id.slice(0, 8), location.href).href; }
  function qrSvg(url) { try { if (!window.qrcode) return ''; var q = window.qrcode(0, 'M'); q.addData(url); q.make(); return q.createSvgTag({ cellSize: 2, margin: 0, scalable: true }); } catch (e) { return ''; } }
  function fitTele() {
    var board = $('#board'); if (!board) return;
    if (window.innerWidth <= 720) { board.style.setProperty('--fit', '1'); return; }
    var f = 1; board.style.setProperty('--fit', '1');
    for (var i = 0; i < 16; i++) {
      var over = false; $$('.tcard', board).forEach(function (c) { if (c.scrollHeight > c.clientHeight + 1) over = true; });
      if (!over) break; f = Math.round((f - 0.04) * 100) / 100; if (f < 0.45) break; board.style.setProperty('--fit', String(f));
    }
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(fitTele, 50); });
  async function modoTele() {
    var el = document.documentElement;
    try { if (!document.fullscreenElement && el.requestFullscreen) await el.requestFullscreen(); } catch (e) {}
    try { if (navigator.wakeLock) { S.wake = await navigator.wakeLock.request('screen'); toast('Pantalla siempre encendida'); } else toast('Esta pantalla no permite mantenerse encendida sola: quítale el apagado automático en ajustes de la tablet'); } catch (e) { toast('No he podido fijar la pantalla encendida', true); }
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && S.wake && navigator.wakeLock) navigator.wakeLock.request('screen').then(function (w) { S.wake = w; }).catch(function () {}); });
  function cerrarTPanel() { var p = $('#tpanel'); if (p) { p.classList.remove('open'); p.setAttribute('aria-hidden', 'true'); scrim.classList.remove('open'); } }
  async function abrirTPanel(cid) {
    var p = $('#tpanel'); if (!p) return;
    var hoy = S.dia.sesiones.filter(function (s) { return s.cliente_id === cid; })[0];
    var r = await Promise.all([DB.sesionesCliente(cid, 16), DB.observaciones(cid, 3)]);
    var ses = r[0], obs = r[1];
    var res = resumenCliente(ses, S.fecha);
    var sem = S.dia.semana[cid];
    p.innerHTML = '<header><div><h2>' + esc(nombreDe(hoy.cliente)) + '</h2><div class="sub">' + weekDots(sem, S.fecha) + '<span>' + (hoy.dia ? 'Hoy Día ' + hoy.dia + ' · ' : '') + (sem ? sem.size : 0) + ' sesiones esta semana</span></div></div><button type="button" class="btn" data-close>Cerrar</button></header>' +
      '<div class="kpis"><div class="kpi"><b>' + hoy.items.length + '</b><span>ejercicios hoy</span></div><div class="kpi"><b>' + res.sesiones4s + '</b><span>sesiones en 4 semanas</span></div><div class="kpi"><b class="txt">' + (res.ultima ? fmtCorta(res.ultima) : '—') + '</b><span>última sesión</span></div></div>' +
      '<section><h3>Grupos trabajados · últimas 4 semanas</h3>' + (res.bars.length ? '<div class="bars">' + res.bars.map(function (b) { return '<div class="bar" style="--g:var(--g-' + b.g + ')"><span class="lab2">' + esc(GRUPOS[b.g] || b.g) + '</span><span class="tr"><span class="fl" style="width:' + b.pct + '%"></span></span><span class="v">' + b.pct + '%</span></div>'; }).join('') + '</div>' : '<p class="nota">Aún sin historial.</p>') + '</section>' +
      '<section><h3>No repetir · hecho hace menos de 2 semanas</h3>' + (res.norep.length ? '<div class="norep">' + res.norep.map(function (n) { return '<span>' + esc(n) + '</span>'; }).join('') + '</div>' : '<p class="nota">Nada reciente que evitar.</p>') + '</section>' +
      '<section><h3>Últimas sesiones</h3>' + (res.ultimas.length ? '<ul class="hist">' + res.ultimas.map(function (s) { return '<li><time>' + fmtCorta(s.fecha) + '</time><span class="d">' + (s.dia ? 'Día ' + s.dia + ' · ' : '') + esc(s.grupos) + '</span><span class="s muted">' + s.n + ' ej.</span></li>'; }).join('') + '</ul>' : '<p class="nota">Primera sesión.</p>') + '</section>' +
      (obs.length ? '<section><h3>Observaciones</h3>' + obs.map(function (o) { return '<p class="obs"><time>' + fmtCorta(o.fecha) + '</time>' + esc(o.texto) + '</p>'; }).join('') + '</section>' : '') +
      (res.marcas.length ? '<section><h3>Marcas</h3><div class="pr">' + res.marcas.map(function (m) { return '<span>' + esc(m.nombre) + ' <b>' + esc(m.kilos) + '</b></span>'; }).join('') + '</div></section>' : '') +
      '<footer><button type="button" class="btn primary" data-close>Volver a la pizarra</button></footer>';
    p.classList.add('open'); p.setAttribute('aria-hidden', 'false'); scrim.classList.add('open');
  }
  // Resumen de un cliente a partir de sus sesiones (sirve para la tele y para la ficha).
  function resumenCliente(ses, fecha) {
    var hace28 = addDias(fecha, -28), hace14 = addDias(fecha, -14);
    var hoyNombres = {}; ses.filter(function (s) { return s.fecha === fecha; }).forEach(function (s) { s.items.forEach(function (it) { hoyNombres[norm(it.nombre)] = true; }); });
    var prev = ses.filter(function (s) { return s.fecha < fecha; });
    var cnt = {}, total = 0; prev.filter(function (s) { return s.fecha >= hace28; }).forEach(function (s) { s.items.forEach(function (it) { var g = it.grupo || 'otro'; cnt[g] = (cnt[g] || 0) + 1; total++; }); });
    var bars = Object.keys(cnt).map(function (g) { return { g: g, pct: Math.round(cnt[g] * 100 / total) }; }).sort(function (a, b) { return b.pct - a.pct; }).slice(0, 7);
    var norep = []; prev.filter(function (s) { return s.fecha >= hace14; }).forEach(function (s) { s.items.forEach(function (it) { var k = norm(it.nombre); if (!hoyNombres[k] && norep.indexOf(it.nombre) < 0) norep.push(it.nombre); }); });
    var ultimas = prev.slice(0, 5).map(function (s) { var gs = []; s.items.forEach(function (it) { var l = GRUPOS[it.grupo]; if (l && gs.indexOf(l) < 0) gs.push(l); }); return { fecha: s.fecha, dia: s.dia, grupos: gs.slice(0, 3).join(', ') || 'sin grupos', n: s.items.length }; });
    var best = {}; ses.forEach(function (s) { s.items.forEach(function (it) { var k = numKilos(it.kilos); if (k == null) return; var key = norm(it.nombre); if (!best[key] || best[key].k < k) best[key] = { nombre: it.nombre, k: k, kilos: it.kilos }; }); });
    var marcas = Object.keys(best).map(function (k) { return best[k]; }).sort(function (a, b) { return b.k - a.k; }).slice(0, 6);
    return { sesiones4s: prev.filter(function (s) { return s.fecha >= hace28; }).length, ultima: prev[0] ? prev[0].fecha : null, bars: bars, norep: norep.slice(0, 12), ultimas: ultimas, marcas: marcas };
  }

  // ======================================================================
  // YO — la sesión del cliente en su móvil (llega por el QR de la tele)
  // ======================================================================
  async function vistaYo() {
    var q = new URLSearchParams(location.search); var pref = (q.get('s') || '').trim().toLowerCase();
    var hoy = hoyISO();
    if (!pref) {
      var ses = await DB.sesionesDelDia(hoy);
      view.innerHTML = '<div class="yo"><h2>¿Quién eres?</h2><p class="nota">Toca tu nombre para ver tu sesión de hoy.</p><div class="lista">' +
        (ses.length ? ses.map(function (s) { return '<a class="item btnlike" href="yo.html?s=' + s.id.slice(0, 8) + '"><span class="n">' + esc(nombreDe(s.cliente)) + '</span><span class="s">' + (s.dia ? 'Día ' + s.dia : '') + '</span></a>'; }).join('') : '<div class="nota">Hoy no hay nadie en la pizarra todavía.</div>') + '</div></div>';
      return;
    }
    var s = await DB.sesionPorPrefijo(hoy, pref);
    if (!s) { view.innerHTML = '<div class="yo"><h2>No encuentro tu sesión de hoy</h2><p class="nota">Vuelve a escanear el código de la tele o pide al entrenador que te añada.</p><p><a class="btn" href="yo.html">Elegir mi nombre</a></p></div>'; return; }
    S.yo = s;
    try { var ult = await DB.ultimosItems([s.cliente_id], hoy); S.yoUlt = {}; ult.forEach(function (it) { var k = norm(it.nombre); if (!S.yoUlt[k] || S.yoUlt[k].fecha < it.sesiones.fecha) S.yoUlt[k] = { series: it.series, kilos: it.kilos, fecha: it.sesiones.fecha }; }); } catch (e) { S.yoUlt = {}; }
    renderYo();
    S.unsub = DB.suscribir('yo', debounce(async function () { var a = document.activeElement; if (a && a.tagName === 'INPUT') return; var n = await DB.sesion(s.id); if (n) { S.yo = n; renderYo(); } else { view.innerHTML = '<div class="yo"><h2>Tu sesión ya no está en la pizarra</h2><p class="nota">Pregunta al entrenador.</p></div>'; } }, 400));
  }
  function renderYo() {
    var s = S.yo; var hechos = s.items.filter(function (it) { return it.hecho; }).length; var pct = s.items.length ? Math.round(hechos * 100 / s.items.length) : 0;
    view.innerHTML = '<div class="yo"><header class="yo-head">' + avatar(s.cliente) + '<div class="wt"><h2>' + esc(nombreDe(s.cliente)) + '</h2><span class="muted">' + (s.dia ? 'Día ' + s.dia + ' · ' : '') + fmtCorta(s.fecha) + ' · ' + hechos + ' de ' + s.items.length + ' hechos</span></div></header>' +
      '<div class="pbar"><i style="width:' + pct + '%"></i></div>' +
      '<ol class="yo-list">' + s.items.map(function (it) {
        var u = (S.yoUlt || {})[norm(it.nombre)];
        return '<li class="' + (it.hecho ? 'done' : '') + '" data-id="' + it.id + '" style="--g:var(--g-' + (it.grupo || 'otro') + ')"><button type="button" class="yo-mark" data-yo="hecho" aria-pressed="' + it.hecho + '" aria-label="Hecho">✓</button>' +
          '<div class="yo-main"><div class="yo-nombre">' + esc(it.nombre) + '</div><div class="yo-sub">' + (it.series ? '<b>' + esc(it.series) + '</b>' : '') + (u && (u.kilos || u.series) ? ' · última vez ' + esc(u.kilos || u.series) : '') + (it.notas ? ' · ' + esc(it.notas) : '') + '</div></div>' +
          '<input class="yo-kilos" inputmode="decimal" placeholder="kg" value="' + esc(it.kilos) + '" data-yo="kilos" aria-label="Kilos"></li>';
      }).join('') + '</ol>' +
      (s.final ? '<div class="yo-fin">' + esc(s.final) + '</div>' : '') +
      '<footer class="yo-foot">' + (s.estado === 'hecha' ? '<span class="chip activo" style="font-size:1em">Sesión terminada</span>' : '<button type="button" class="btn primary" data-yo="terminar">He terminado</button>') + '</footer></div>';
  }
  var yoKilosT = {};
  view.addEventListener('click', function (ev) {
    if (S.modo !== 'yo') return;
    var b = ev.target.closest('[data-yo]'); if (!b) return;
    if (b.dataset.yo === 'hecho') { var li = b.closest('li'); var it = S.yo.items.filter(function (x) { return x.id === li.dataset.id; })[0]; if (!it) return; it.hecho = !it.hecho; li.classList.toggle('done', it.hecho); b.setAttribute('aria-pressed', String(it.hecho)); DB.actualizarItem(it.id, { hecho: it.hecho }).then(function () { var h = S.yo.items.filter(function (x) { return x.hecho; }).length; var m = $('.yo-head .muted'); if (m) m.textContent = (S.yo.dia ? 'Día ' + S.yo.dia + ' · ' : '') + fmtCorta(S.yo.fecha) + ' · ' + h + ' de ' + S.yo.items.length + ' hechos'; var p = $('.yo .pbar i'); if (p) p.style.width = Math.round(h * 100 / S.yo.items.length) + '%'; }).catch(fallo); }
    if (b.dataset.yo === 'terminar') { var el = sheet('<h3>¿Has terminado la sesión de hoy?</h3><p class="nota">Se marca como terminada en la pizarra. Lo que no hayas marcado se queda sin hacer.</p><div class="acciones"><button type="button" class="btn" data-x="no">Aún no</button><button type="button" class="btn primary" data-x="si">Sí, terminado</button></div>'); el.addEventListener('click', function (e2) { var x = e2.target.closest('[data-x]'); if (!x) return; cerrarSheet(); if (x.dataset.x === 'si') { S.yo.estado = 'hecha'; DB.actualizarSesion(S.yo.id, { estado: 'hecha' }).then(function () { renderYo(); toast('¡Buen trabajo!'); }).catch(fallo); } }); }
  });
  view.addEventListener('input', function (ev) {
    if (S.modo !== 'yo') return;
    var inp = ev.target; if (!inp.matches || !inp.matches('.yo-kilos')) return;
    var li = inp.closest('li'); var it = S.yo.items.filter(function (x) { return x.id === li.dataset.id; })[0]; if (!it) return;
    var v = inp.value.trim(); if (/^\d+([.,]\d+)?$/.test(v)) v = v.replace('.', ',') + ' kg';
    it.kilos = v; clearTimeout(yoKilosT[it.id]);
    yoKilosT[it.id] = setTimeout(function () { DB.actualizarItem(it.id, { kilos: v }).catch(fallo); }, 600);
  });
  view.addEventListener('focusout', function (ev) { if (S.modo === 'yo' && ev.target.matches && ev.target.matches('.yo-kilos')) { var li = ev.target.closest('li'); var it = S.yo.items.filter(function (x) { return x.id === li.dataset.id; })[0]; if (it) ev.target.value = it.kilos; } });

  // ======================================================================
  // CLIENTES
  // ======================================================================
  async function vistaClientes() {
    view.innerHTML = '<div class="vhead"><h2>Clientes <span class="muted" id="cli-count"></span></h2><div class="right"><button type="button" class="btn" id="cli-import">Subir Excel</button><button type="button" class="btn primary" id="cli-alta">+ Añadir</button></div></div>' +
      '<div class="buscar"><input class="input" id="cli-q" placeholder="Buscar por nombre…" autocomplete="off"><button type="button" class="chip estado" id="cli-bajas" aria-pressed="false">Ver bajas</button></div><div id="cli-lista" class="lista"><div class="muted">Cargando…</div></div><div class="pager" id="cli-pager"></div>';
    var r = await Promise.all([DB.clientes({ incluirBajas: true }), DB.ultimasSesionesPorCliente(addDias(hoyISO(), -120))]);
    var clientes = r[0], ult = {}; r[1].forEach(function (s) { if (!ult[s.cliente_id]) ult[s.cliente_id] = s; });
    var verBajas = false, limite = 60;
    function pintar() {
      var t = norm($('#cli-q').value);
      var res = clientes.filter(function (c) { return (verBajas ? !c.activo : c.activo) && (!t || norm(nombreDe(c)).indexOf(t) >= 0); });
      $('#cli-count').textContent = '(' + clientes.filter(function (c) { return c.activo; }).length + ' activos' + (verBajas ? ', ' + res.length + ' de baja' : '') + ')';
      var lista = $('#cli-lista');
      lista.innerHTML = res.length ? res.slice(0, limite).map(function (c) { var u = ult[c.id]; return '<div class="item"><span class="n">' + esc(nombreDe(c)) + '</span><span class="s">' + (u ? 'última ' + fmtCorta(u.fecha) + (u.dia ? ' · Día ' + u.dia : '') : 'sin sesiones') + '</span>' + (c.activo ? '<button type="button" class="btn sm" data-hoy="' + c.id + '">Hoy</button>' : '<span class="chip baja">Baja</span>') + '<a class="btn sm ghost" href="#cliente/' + c.id + '">Ficha</a></div>'; }).join('') : '<div class="vacio"><p>' + (clientes.length ? 'Nadie coincide.' : 'Todavía no hay clientes.') + '</p>' + (clientes.length ? '' : '<button type="button" class="btn primary" id="cli-import2">Subir Excel con los clientes</button>') + '</div>';
      $('#cli-pager').innerHTML = res.length > limite ? '<button type="button" class="btn" id="cli-mas">Ver ' + Math.min(60, res.length - limite) + ' más (' + (res.length - limite) + ' restantes)</button>' : '';
    }
    pintar();
    $('#cli-q').addEventListener('input', function () { limite = 60; pintar(); });
    $('#cli-bajas').addEventListener('click', function () { verBajas = !verBajas; this.setAttribute('aria-pressed', String(verBajas)); this.classList.toggle('sel', verBajas); limite = 60; pintar(); });
    view.addEventListener('click', function (ev) {
      if (ev.target.closest('#cli-mas')) { limite += 60; pintar(); }
      var b = ev.target.closest('[data-hoy]'); if (b) { var c = clientes.filter(function (x) { return x.id === b.dataset.hoy; })[0]; S.pendienteAgregar = c; S.fecha = hoyISO(); location.hash = '#hoy'; }
      if (ev.target.closest('#cli-import, #cli-import2')) abrirImportar(clientes, function () { route(); });
      if (ev.target.closest('#cli-alta')) formCliente(null, '', function () { invalidarClientes(); route(); });
    });
  }
  function formCliente(c, nombreInicial, cb) {
    var el = sheet('<h3>' + (c ? 'Editar cliente' : 'Cliente nuevo') + '</h3>' +
      '<div class="field"><label>Nombre</label><input id="f-nombre" value="' + esc(c ? c.nombre : nombreInicial) + '" autofocus></div>' +
      '<div class="field"><label>Apellidos</label><input id="f-apellidos" value="' + esc(c ? c.apellidos : '') + '"></div>' +
      '<div class="row"><div class="field" style="flex:1"><label>Teléfono</label><input id="f-telefono" inputmode="tel" value="' + esc(c ? c.telefono : '') + '"></div><div class="field" style="flex:1"><label>Email</label><input id="f-email" inputmode="email" value="' + esc(c ? c.email : '') + '"></div></div>' +
      '<div class="field"><label>Notas (lesiones, preferencias, horario…)</label><textarea id="f-notas">' + esc(c ? c.notas : '') + '</textarea></div>' +
      '<div class="acciones"><button type="button" class="btn" data-x="no">Cancelar</button><button type="button" class="btn primary" data-x="si">' + (c ? 'Guardar' : 'Crear') + '</button></div>');
    el.addEventListener('click', async function (ev) {
      var b = ev.target.closest('[data-x]'); if (!b) return;
      if (b.dataset.x === 'no') return cerrarSheet();
      var d = { nombre: $('#f-nombre', el).value.trim(), apellidos: $('#f-apellidos', el).value.trim(), telefono: $('#f-telefono', el).value.trim(), email: $('#f-email', el).value.trim(), notas: $('#f-notas', el).value.trim() };
      if (!d.nombre) { toast('Falta el nombre', true); return; }
      b.disabled = true;
      try { var out; if (c) { await DB.actualizarCliente(c.id, d); out = Object.assign({}, c, d); } else out = await DB.crearCliente(d); cerrarSheet(); toast(c ? 'Guardado' : nombreDe(out) + ' creado'); invalidarClientes(); if (cb) cb(out); } catch (e) { b.disabled = false; fallo(e); }
    });
  }
  function abrirImportar(existentes, cb) {
    var el = sheet('<h3>Subir datos</h3><p class="nota">Vale el <b>ZIP de Google Drive</b> (en Drive: botón derecho sobre la carpeta → Descargar), uno o varios Excel o CSV. Leo todos los archivos y todas las pestañas: listas de clientes (columna <b>Nombre</b>), listas de ejercicios (Ejercicio, Grupo, Material) y pizarras como la de la tele (bloques por cliente con Ejercicio y Series). Te enseño lo que he entendido antes de guardar nada.</p>' +
      '<div class="row"><button type="button" class="btn sm" id="imp-plantilla">Descargar plantilla de clientes</button></div>' +
      '<label class="dropzone" id="dz">Toca para elegir el ZIP o los archivos<br><small>o arrástralos aquí</small><input type="file" id="imp-file" accept=".zip,.xlsx,.xlsm,.xls,.csv,.ods" multiple hidden></label><div id="imp-prev"></div>');
    var dz = $('#dz', el), file = $('#imp-file', el), prev = $('#imp-prev', el);
    $('#imp-plantilla', el).addEventListener('click', function () { EXCEL.plantillaClientes(); });
    ['dragenter', 'dragover'].forEach(function (e) { dz.addEventListener(e, function (ev) { ev.preventDefault(); dz.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (e) { dz.addEventListener(e, function (ev) { ev.preventDefault(); dz.classList.remove('over'); }); });
    dz.addEventListener('drop', function (ev) { if (ev.dataTransfer.files.length) procesar(ev.dataTransfer.files); });
    file.addEventListener('change', function () { if (file.files.length) procesar(file.files); });
    async function procesar(files) {
      prev.innerHTML = '<p class="nota">Leyendo…</p>';
      try {
        var p = await prepararImportacion(files, existentes);
        prev.innerHTML = p.html + (p.hayAlgo ? '<div class="acciones"><button type="button" class="btn primary" id="imp-ok">' + p.boton + '</button></div>' : '<p class="nota">Nada nuevo que guardar.</p>');
        var ok = $('#imp-ok', prev); if (ok) ok.addEventListener('click', function () { guardarImportacion(p, ok, function () { cerrarSheet(); if (cb) cb(); }); });
      } catch (e) { prev.innerHTML = ''; fallo(e); }
    }
  }
  // Lee los archivos (ZIP de Drive, Excel, CSV), entiende cada pestaña y prepara qué se guardaría, sin repetir lo que ya está.
  async function prepararImportacion(files, existentes) {
    var lect = await IMPORTAR.leerArchivos(Array.prototype.slice.call(files), { XLSX: window.XLSX, JSZip: window.JSZip });
    var plan = IMPORTAR.interpretar(lect.archivos);
    // clientes que ya existen (por nombre completo, o por nombre de pila si solo hay uno así) no se crean otra vez
    var ya = {}, porPila = {}; existentes.forEach(function (c) { ya[norm(nombreDe(c))] = c; var k = norm(c.nombre); porPila[k] = porPila[k] ? 'varios' : c; });
    var mapa = {}, nuevos = [];
    plan.clientes.forEach(function (c) { var ex = ya[c.clave] || (!c.apellidos && porPila[norm(c.nombre)] !== 'varios' ? porPila[norm(c.nombre)] : null); if (ex) mapa[c.clave] = ex; else nuevos.push(c); });
    // sesiones ya guardadas (misma persona, mismo día) no se repiten
    var idsEx = Object.keys(mapa).map(function (k) { return mapa[k].id; }), fechas = plan.sesiones.map(function (s) { return s.fecha; }).sort(), yaSes = {};
    if (idsEx.length && fechas.length) (await DB.sesionesEntre(idsEx, fechas[0], fechas[fechas.length - 1])).forEach(function (s) { yaSes[s.cliente_id + '|' + s.fecha] = true; });
    var sesiones = plan.sesiones.filter(function (s) { var ex = mapa[s.clave]; return !(ex && yaSes[ex.id + '|' + s.fecha]); }), repes = plan.sesiones.length - sesiones.length;
    // ejercicios propios que no estén ya en la biblioteca
    var ejercicios = plan.ejercicios.filter(function (e) { return !ejercicioExacto(e.nombre); }), ejRepes = plan.ejercicios.length - ejercicios.length;
    var filasPrev = plan.hojas.map(function (h) {
      var que = h.tipo === 'clientes' ? h.clientes.length + ' clientes' : h.tipo === 'ejercicios' ? h.ejercicios.length + ' ejercicios' : h.tipo === 'pizarra' ? h.sesiones.length + ' sesiones · ' + h.sesiones.reduce(function (n, s) { return n + s.items.length; }, 0) + ' ejercicios · ' + fmtCorta(h.fecha) + ' <span class="muted">(fecha: ' + esc(h.fechaOrigen) + ')</span>' : h.tipo === 'vacia' ? '<span class="muted">vacía</span>' : '<span class="muted">no la entiendo, se salta</span>';
      return '<tr><td>' + esc(h.archivo) + '</td><td>' + esc(h.hoja) + '</td><td>' + que + '</td></tr>';
    }).join('');
    var ej = sesiones[0], partes = [];
    if (nuevos.length) partes.push('<b>' + nuevos.length + '</b> clientes nuevos'); if (Object.keys(mapa).length) partes.push(Object.keys(mapa).length + ' clientes ya existían');
    if (sesiones.length) partes.push('<b>' + sesiones.length + '</b> sesiones'); if (repes) partes.push(repes + ' sesiones ya estaban (misma persona y día, se saltan)');
    if (ejercicios.length) partes.push('<b>' + ejercicios.length + '</b> ejercicios nuevos para la biblioteca'); if (ejRepes) partes.push(ejRepes + ' ejercicios ya estaban');
    var html = (lect.avisos.length ? '<p class="nota">' + lect.avisos.map(esc).join('<br>') + '</p>' : '') +
      (plan.hojas.length ? '<div class="prev-tabla"><table class="tabla"><thead><tr><th>Archivo</th><th>Pestaña</th><th>Qué he entendido</th></tr></thead><tbody>' + filasPrev + '</tbody></table></div>' : '<p class="nota">No he encontrado ningún Excel ni CSV.</p>') +
      '<p>' + (partes.join(' · ') || 'Nada que guardar') + '.</p>' +
      (ej ? '<p class="nota">Ejemplo: ' + esc(ej.cliente) + (ej.dia ? ' · Día ' + ej.dia : '') + ' · ' + fmtCorta(ej.fecha) + ' → ' + esc(ej.items.slice(0, 3).map(function (i) { return i.nombre + (i.series ? ' ' + i.series : ''); }).join(', ')) + (ej.items.length > 3 ? '…' : '') + (ej.final ? ' · ' + esc(ej.final) : '') + '</p>' : '') +
      (ejercicios.length ? '<p class="nota">Ejercicios: ' + esc(ejercicios.slice(0, 4).map(function (e) { return e.nombre + ' (' + (GRUPOS[e.grupo] || e.grupo) + ')'; }).join(', ')) + (ejercicios.length > 4 ? '…' : '') + '</p>' : '');
    var trozos = []; if (nuevos.length) trozos.push(nuevos.length + ' clientes'); if (sesiones.length) trozos.push(sesiones.length + ' sesiones'); if (ejercicios.length) trozos.push(ejercicios.length + ' ejercicios');
    return { nuevos: nuevos, sesiones: sesiones, ejercicios: ejercicios, mapa: mapa, html: html, hayAlgo: !!trozos.length, boton: 'Guardar ' + trozos.join(', '), resumen: trozos.join(', ') || 'nada nuevo' };
  }
  // Guarda lo entendido: ejercicios propios, clientes nuevos y, sesión a sesión, sus ejercicios (ligados a la biblioteca si el nombre coincide).
  // Las sesiones de días pasados entran como «hecha» (historial); las de hoy, al tablero.
  async function guardarImportacion(p, btn, cb) {
    btn.disabled = true;
    try {
      for (var k = 0; k < p.ejercicios.length; k++) { var e0 = p.ejercicios[k]; btn.textContent = 'Ejercicio ' + (k + 1) + ' de ' + p.ejercicios.length + '…'; var ne = await DB.crearEjercicio({ nombre: e0.nombre, grupo: e0.grupo, equipo: e0.equipo || '', origen: 'propio' }); S.ejercicios.push(ne); }
      if (p.ejercicios.length) indexEjercicios();
      var creados = p.nuevos.length ? await DB.crearClientes(p.nuevos.map(function (c) { return { nombre: c.nombre, apellidos: c.apellidos || '', telefono: c.telefono || '', email: c.email || '', notas: c.notas || '' }; })) : [];
      creados.forEach(function (c) { p.mapa[norm(nombreDe(c))] = c; });
      var hoy = hoyISO(), n = 0;
      for (var i = 0; i < p.sesiones.length; i++) {
        var s = p.sesiones[i], cli = p.mapa[s.clave]; if (!cli) continue;
        btn.textContent = 'Guardando sesión ' + (i + 1) + ' de ' + p.sesiones.length + '…';
        var pasada = s.fecha < hoy;
        var ses = await DB.crearSesion({ cliente_id: cli.id, fecha: s.fecha, dia: s.dia, estado: pasada ? 'hecha' : 'hoy', final: s.final || '', orden: i });
        await DB.crearItems(s.items.map(function (it, j) { var e = ejercicioExacto(it.nombre) || buscarEjercicios(it.nombre, 1)[0] || null; return { sesion_id: ses.id, ejercicio_id: e ? e.id : null, nombre: it.nombre, grupo: e ? e.grupo : '', series: it.series || '', kilos: it.kilos || '', orden: j, hecho: pasada }; }));
        n++;
      }
      invalidarClientes(); toast([creados.length + ' clientes', n + ' sesiones', p.ejercicios.length + ' ejercicios'].join(', ') + ' guardados'); if (cb) cb();
    } catch (e) { btn.disabled = false; btn.textContent = 'Reintentar'; fallo(e); }
  }

  // ======================================================================
  // FICHA DEL CLIENTE
  // ======================================================================
  async function vistaCliente(id) {
    if (!id) { location.hash = '#clientes'; return; }
    view.innerHTML = '<div class="muted">Cargando…</div>';
    var r = await Promise.all([DB.cliente(id), DB.sesionesCliente(id, 80), DB.observaciones(id, 40)]);
    var c = r[0], ses = r[1], obs = r[2];
    var res = resumenCliente(ses, addDias(hoyISO(), 1));
    var porEj = {}; ses.forEach(function (s) { s.items.forEach(function (it) { var k = norm(it.nombre); (porEj[k] = porEj[k] || { nombre: it.nombre, veces: [] }).veces.push({ fecha: s.fecha, series: it.series, kilos: it.kilos, k: numKilos(it.kilos) }); }); });
    var progreso = Object.keys(porEj).map(function (k) { var e = porEj[k]; e.veces.sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; }); e.best = e.veces.reduce(function (m, v) { return v.k != null && (m == null || v.k > m) ? v.k : m; }, null); return e; }).sort(function (a, b) { return b.veces.length - a.veces.length; });
    view.innerHTML = '<div class="vhead"><a class="btn icon ghost" href="#clientes" aria-label="Volver">‹</a><div><h2>' + esc(nombreDe(c)) + ' ' + (c.activo ? '' : '<span class="chip baja">Baja</span>') + '</h2><div class="sub">' + [c.telefono, c.email, 'alta ' + fmtCorta(c.alta_en)].filter(Boolean).map(esc).join(' · ') + '</div></div>' +
      '<div class="right">' + (c.activo ? '<button type="button" class="btn primary" id="c-hoy">Añadir a hoy</button>' : '') + '<button type="button" class="btn" id="c-editar">Editar</button>' + (c.activo ? '<button type="button" class="btn danger" id="c-baja">Dar de baja</button>' : '<button type="button" class="btn" id="c-alta">Reactivar</button>') + '</div></div>' +
      (c.notas ? '<p class="obs" style="margin-bottom:14px">' + esc(c.notas) + '</p>' : '') +
      '<div class="grid2">' +
      '<div class="panel"><h3>Observaciones</h3><div id="obs-lista">' + (obs.length ? obs.map(renderObs).join('') : '<p class="nota">Sin observaciones. Apunta lesiones, molestias, preferencias…</p>') + '</div><div class="field"><textarea id="obs-texto" placeholder="Nueva observación…"></textarea></div><div class="acciones"><button type="button" class="btn primary" id="obs-add">Guardar observación</button></div></div>' +
      '<div class="panel"><h3>Resumen</h3><div class="kpis"><div class="kpi"><b>' + ses.length + '</b><span>sesiones</span></div><div class="kpi"><b>' + res.sesiones4s + '</b><span>en 4 semanas</span></div><div class="kpi"><b class="txt">' + (res.ultima ? fmtCorta(res.ultima) : '—') + '</b><span>última</span></div></div>' +
      '<h3 style="margin-top:6px">Grupos · últimas 4 semanas</h3>' + (res.bars.length ? '<div class="bars">' + res.bars.map(function (b) { return '<div class="bar" style="--g:var(--g-' + b.g + ')"><span class="lab2">' + esc(GRUPOS[b.g] || b.g) + '</span><span class="tr"><span class="fl" style="width:' + b.pct + '%"></span></span><span class="v">' + b.pct + '%</span></div>'; }).join('') + '</div>' : '<p class="nota">Aún sin sesiones recientes.</p>') +
      (res.marcas.length ? '<h3 style="margin-top:6px">Marcas (más kilos)</h3><div class="pr">' + res.marcas.map(function (m) { return '<span>' + esc(m.nombre) + ' <b>' + esc(m.kilos) + '</b></span>'; }).join('') + '</div>' : '') + '</div>' +
      '<div class="panel"><h3>Progreso por ejercicio <span class="ej-tag">' + progreso.length + '</span></h3>' + (progreso.length ? '<div class="prog">' + progreso.slice(0, 40).map(function (e, i) { return '<details data-i="' + i + '"><summary><span>' + esc(e.nombre) + '</span><span class="muted">×' + e.veces.length + '</span>' + (e.best != null ? '<span class="best">' + e.best + ' kg</span>' : '') + '</summary>' + (e.veces.filter(function (v) { return v.k != null; }).length >= 2 ? '<canvas data-spark="' + i + '"></canvas>' : '') + '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Fecha</th><th>Series</th><th>Kilos</th></tr></thead><tbody>' + e.veces.slice().reverse().slice(0, 12).map(function (v) { return '<tr><td>' + fmtCorta(v.fecha) + '</td><td>' + esc(v.series) + '</td><td class="num">' + esc(v.kilos) + '</td></tr>'; }).join('') + '</tbody></table></div></details>'; }).join('') + '</div>' : '<p class="nota">Cuando tenga sesiones, aquí verás cada ejercicio con sus series y kilos a lo largo del tiempo.</p>') + '</div>' +
      '<div class="panel"><h3>Sesiones <span class="ej-tag">' + ses.length + '</span></h3>' + (ses.length ? '<div class="prog">' + ses.slice(0, 40).map(function (s) { return '<details><summary><time>' + fmtCorta(s.fecha) + '</time>' + (s.dia ? '<span class="day" style="font-size:.9em">Día ' + s.dia + '</span>' : '') + '<span class="muted">' + s.items.length + ' ej.</span>' + (s.estado === 'hecha' ? '<span class="chip estado">Hecha</span>' : '') + '</summary><ol class="hist" style="padding:0 0 8px">' + s.items.map(function (it) { return '<li><span class="d">' + esc(it.nombre) + '</span><span class="muted">' + esc(it.series) + (it.kilos ? ' · ' + esc(it.kilos) : '') + '</span><span>' + (it.hecho ? '✓' : '') + '</span></li>'; }).join('') + '</ol>' + (s.final ? '<p class="nota">Al final: ' + esc(s.final) + '</p>' : '') + '</details>'; }).join('') + '</div>' : '<p class="nota">Sin sesiones todavía.</p>') + '</div>' +
      '</div>';
    // gráficas pequeñas de kilos
    $$('canvas[data-spark]').forEach(function (cv) { var e = progreso[+cv.dataset.spark]; cv.closest('details').addEventListener('toggle', function () { if (this.open) dibujarSpark(cv, e.veces.filter(function (v) { return v.k != null; })); }); });
    $('#obs-add').addEventListener('click', async function () { var t = $('#obs-texto').value.trim(); if (!t) return; try { var o = await DB.crearObservacion({ cliente_id: id, texto: t }); obs.unshift(o); $('#obs-lista').innerHTML = obs.map(renderObs).join(''); $('#obs-texto').value = ''; toast('Observación guardada'); } catch (e) { fallo(e); } });
    $('#obs-lista').addEventListener('click', async function (ev) { var b = ev.target.closest('[data-del-obs]'); if (!b) return; try { await DB.borrarObservacion(b.dataset.delObs); obs = obs.filter(function (o) { return o.id !== b.dataset.delObs; }); $('#obs-lista').innerHTML = obs.map(renderObs).join('') || '<p class="nota">Sin observaciones.</p>'; } catch (e) { fallo(e); } });
    var bh = $('#c-hoy'); if (bh) bh.addEventListener('click', function () { S.pendienteAgregar = c; S.fecha = hoyISO(); location.hash = '#hoy'; });
    $('#c-editar').addEventListener('click', function () { formCliente(c, '', function () { route(); }); });
    var bb = $('#c-baja'); if (bb) bb.addEventListener('click', function () { var el = sheet('<h3>¿Dar de baja a ' + esc(nombreDe(c)) + '?</h3><p class="nota">Deja de salir en las listas, pero su historial se conserva y se puede reactivar cuando quieras.</p><div class="acciones"><button type="button" class="btn" data-x="no">Cancelar</button><button type="button" class="btn danger" data-x="si">Dar de baja</button></div>'); el.addEventListener('click', function (ev) { var b = ev.target.closest('[data-x]'); if (!b) return; cerrarSheet(); if (b.dataset.x === 'si') DB.darDeBaja(c.id).then(function () { invalidarClientes(); toast('Baja hecha'); route(); }).catch(fallo); }); });
    var ba = $('#c-alta'); if (ba) ba.addEventListener('click', function () { DB.reactivar(c.id).then(function () { invalidarClientes(); toast('Reactivado'); route(); }).catch(fallo); });
  }
  function renderObs(o) { return '<p class="obs"><time>' + fmtCorta(o.fecha) + ' <button type="button" class="btn sm ghost" data-del-obs="' + o.id + '" style="float:right;min-height:28px;padding:2px 8px">quitar</button></time>' + esc(o.texto) + '</p>'; }
  function dibujarSpark(cv, puntos) {
    var dpr = window.devicePixelRatio || 1; var W = cv.clientWidth || 300, H = 64; cv.width = W * dpr; cv.height = H * dpr;
    var ctx = cv.getContext('2d'); ctx.scale(dpr, dpr); ctx.clearRect(0, 0, W, H);
    var cs = getComputedStyle(document.documentElement); var acc = cs.getPropertyValue('--accent').trim() || '#0071e3', mut = cs.getPropertyValue('--muted').trim() || '#888';
    var ks = puntos.map(function (p) { return p.k; }); var min = Math.min.apply(null, ks), max = Math.max.apply(null, ks); if (max === min) { max += 1; min -= 1; }
    var x = function (i) { return 28 + i * (W - 40) / Math.max(1, puntos.length - 1); }, y = function (k) { return 8 + (H - 20) * (1 - (k - min) / (max - min)); };
    ctx.strokeStyle = mut; ctx.globalAlpha = .35; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(28, y(max)); ctx.lineTo(W - 12, y(max)); ctx.moveTo(28, y(min)); ctx.lineTo(W - 12, y(min)); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = mut; ctx.font = '10px ' + (cs.getPropertyValue('--f-body') || 'sans-serif'); ctx.textAlign = 'right'; ctx.fillText(max + '', 24, y(max) + 4); ctx.fillText(min + '', 24, y(min) + 4);
    ctx.strokeStyle = acc; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.beginPath(); puntos.forEach(function (p, i) { i ? ctx.lineTo(x(i), y(p.k)) : ctx.moveTo(x(i), y(p.k)); }); ctx.stroke();
    ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(x(puntos.length - 1), y(puntos[puntos.length - 1].k), 3.5, 0, Math.PI * 2); ctx.fill();
  }

  // ======================================================================
  // EJERCICIOS
  // ======================================================================
  async function vistaEjercicios() {
    var grupo = '', limite = 80;
    view.innerHTML = '<div class="vhead"><h2>Ejercicios <span class="muted">(' + S.ejercicios.length + ')</span></h2><div class="right"><button type="button" class="btn primary" id="ej-nuevo">+ Propio</button></div></div>' +
      '<div class="buscar"><input class="input" id="ej-q" placeholder="Buscar ejercicio…" autocomplete="off"></div>' +
      '<div class="filtros" id="ej-filtros"><button type="button" class="chip sel" data-g="" style="--g:var(--muted)">Todos</button>' + Object.keys(GRUPOS).map(function (g) { return '<button type="button" class="chip" data-g="' + g + '" style="--g:var(--g-' + g + ')">' + GRUPOS[g] + '</button>'; }).join('') + '<button type="button" class="chip" data-g="propio" style="--g:var(--accent)">Propios</button></div>' +
      '<div class="lista" id="ej-lista"></div><div class="pager" id="ej-pager"></div><p class="nota" style="margin-top:16px">Dibujos e información de ejercicios: <a href="https://exercise-dataset.com" target="_blank" rel="noopener">RepDB</a>.</p>';
    function pintar() {
      var t = norm($('#ej-q').value);
      var res = S.ejercicios.filter(function (e) { return (grupo === '' || (grupo === 'propio' ? e.origen === 'propio' : e.grupo === grupo)) && (!t || e._n.indexOf(t) >= 0); });
      $('#ej-lista').innerHTML = res.slice(0, limite).map(function (e) { return '<div class="item">' + (e.imagen ? '<img class="ejimg" src="' + esc(e.imagen) + '" alt="" loading="lazy">' : '<span class="ejimg" style="display:grid;place-items:center;background:var(--surface2)"><span style="width:12px;height:12px;border-radius:50%;background:var(--g-' + (e.grupo || 'otro') + ')"></span></span>') + '<span class="n">' + esc(e.nombre) + '</span>' + chipGrupo(e.grupo) + (e.origen === 'propio' ? '<span class="ej-tag">propio</span>' : '') + '<button type="button" class="btn sm ghost" data-ed="' + e.id + '">Editar</button></div>'; }).join('') || '<div class="vacio"><p>Nada con ese nombre.</p><button type="button" class="btn primary" id="ej-nuevo2">Crear «' + esc($('#ej-q').value.trim()) + '»</button></div>';
      $('#ej-pager').innerHTML = res.length > limite ? '<button type="button" class="btn" id="ej-mas">Ver más (' + (res.length - limite) + ' restantes)</button>' : '';
    }
    pintar();
    $('#ej-q').addEventListener('input', function () { limite = 80; pintar(); });
    $('#ej-filtros').addEventListener('click', function (ev) { var b = ev.target.closest('[data-g]'); if (!b) return; grupo = b.dataset.g; $$('#ej-filtros .chip').forEach(function (x) { x.classList.toggle('sel', x === b); }); limite = 80; pintar(); });
    view.addEventListener('click', function (ev) {
      if (ev.target.closest('#ej-mas')) { limite += 80; pintar(); }
      if (ev.target.closest('#ej-nuevo, #ej-nuevo2')) formEjercicio(null, $('#ej-q') ? $('#ej-q').value.trim() : '', pintar);
      var b = ev.target.closest('[data-ed]'); if (b) formEjercicio(S.ejercicios.filter(function (e) { return e.id === b.dataset.ed; })[0], '', pintar);
    });
  }
  function formEjercicio(e, nombreInicial, cb) {
    var el = sheet('<h3>' + (e ? 'Editar ejercicio' : 'Ejercicio propio nuevo') + '</h3>' + (e && e.imagen ? '<img src="' + esc(e.imagen) + '" alt="" style="width:120px;height:120px;border-radius:14px;background:#fff;object-fit:cover">' : '') +
      '<div class="field"><label>Nombre (como lo decís en el gimnasio)</label><input id="e-nombre" value="' + esc(e ? e.nombre : nombreInicial) + '" autofocus></div>' +
      '<div class="field"><label>Grupo muscular</label><select id="e-grupo">' + Object.keys(GRUPOS).map(function (g) { return '<option value="' + g + '" ' + (e && e.grupo === g ? 'selected' : '') + '>' + GRUPOS[g] + '</option>'; }).join('') + '</select></div>' +
      '<div class="acciones">' + (e ? '<button type="button" class="btn danger" data-x="ocultar">Ocultar de la lista</button>' : '') + '<button type="button" class="btn" data-x="no">Cancelar</button><button type="button" class="btn primary" data-x="si">' + (e ? 'Guardar' : 'Crear') + '</button></div>');
    el.addEventListener('click', async function (ev) {
      var b = ev.target.closest('[data-x]'); if (!b) return;
      if (b.dataset.x === 'no') return cerrarSheet();
      b.disabled = true;
      try {
        if (b.dataset.x === 'ocultar') { await DB.actualizarEjercicio(e.id, { activo: false }); S.ejercicios = S.ejercicios.filter(function (x) { return x.id !== e.id; }); cerrarSheet(); toast('Oculto'); return cb && cb(); }
        var d = { nombre: $('#e-nombre', el).value.trim(), grupo: $('#e-grupo', el).value };
        if (!d.nombre) { toast('Falta el nombre', true); b.disabled = false; return; }
        if (e) { await DB.actualizarEjercicio(e.id, d); Object.assign(e, d); e._n = norm(e.nombre); } else { var n = await DB.crearEjercicio(Object.assign({ origen: 'propio' }, d)); n._n = norm(n.nombre); S.ejercicios.push(n); S.ejercicios.sort(function (a, b2) { return a.nombre.localeCompare(b2.nombre, 'es'); }); }
        cerrarSheet(); toast(e ? 'Guardado' : 'Creado'); if (cb) cb();
      } catch (err) { b.disabled = false; fallo(err); }
    });
  }

  // ======================================================================
  // AJUSTES
  // ======================================================================
  async function vistaAjustes() {
    var g = S.config.gimnasio || { nombre: cfg.nombre, estilo: 'yard' };
    var urlTele = new URL('tele.html', location.href).href;
    view.innerHTML = '<div class="vhead"><h2>Ajustes</h2></div><div class="grid2">' +
      '<div class="panel"><h3>Gimnasio</h3><div class="field"><label>Nombre (sale arriba en la tele)</label><input id="aj-nombre" value="' + esc(g.nombre || '') + '"></div>' +
      '<div class="field"><label>Estilo por defecto de la tele</label><div class="seg" role="group" aria-label="Estilo por defecto" data-ambito="defecto" id="aj-estilo">' + Object.keys(SKINS).map(function (s) { return '<button type="button" data-skin="' + s + '" aria-pressed="' + ((g.estilo || 'yard') === s) + '">' + SKINS[s] + '</button>'; }).join('') + '</div></div>' +
      '<div class="field"><label>Estilo solo en este aparato</label><div class="seg" role="group" aria-label="Estilo">' + Object.keys(SKINS).map(function (s) { return '<button type="button" data-skin="' + s + '" aria-pressed="' + (S.skin === s) + '">' + SKINS[s] + '</button>'; }).join('') + '</div><button type="button" class="btn sm ghost" id="aj-estilo-reset" style="align-self:flex-start">Volver al estilo por defecto</button></div></div>' +
      '<div class="panel"><h3>La tele</h3><div class="field"><label>Enlace de la tele</label><div class="row"><input class="input" id="aj-url" value="' + esc(urlTele) + '" readonly style="flex:1"><button type="button" class="btn" id="aj-copiar">Copiar</button><a class="btn" href="tele.html" target="_blank" rel="noopener">Abrir</a></div></div>' +
      '<h4>En un PC con Windows y dos pantallas</h4><p class="nota">Con Chrome o Edge: pulsa el botón y la tele se abre a pantalla completa en la <b>otra</b> pantalla (la primera vez el navegador pide permiso para ver tus pantallas: acepta).</p><div class="row"><button type="button" class="btn primary" id="aj-otra-pantalla">Abrir la tele en la otra pantalla</button></div>' +
      '<p class="nota">Para que arranque sola al encender el PC: descarga el lanzador y cópialo en la carpeta de Inicio (tecla Windows + R, escribe <b>shell:startup</b>, Enter). Si sale en la pantalla equivocada, cambia el lado y vuelve a descargarlo.</p><div class="row"><select id="aj-lado" class="input" style="flex:1"><option value="derecha">La segunda pantalla está a la derecha</option><option value="izquierda">La segunda pantalla está a la izquierda</option><option value="arriba">La segunda pantalla está arriba</option><option value="abajo">La segunda pantalla está abajo</option></select><button type="button" class="btn" id="aj-lanzador">Descargar lanzador</button></div>' +
      '<h4>En una tablet Android</h4><p class="nota">Abre el enlace en Chrome, menú ⋮ → <b>Añadir a pantalla de inicio</b>, abre la app desde el icono y pulsa <b>Modo tele</b> (pantalla completa y siempre encendida).</p></div>' +
      '<div class="panel"><h3>Asistente de IA</h3><p class="nota">El botón «Asistente» habla con Claude (' + esc((S.config.asistente && S.config.asistente.modelo) || 'claude-opus-5-5') + '). Sirve también para el montaje: dile en tus palabras qué cambiar.</p>' +
      '<div class="ia-chips" id="aj-ia-chips"><button type="button" data-ia="Pon la tele con el estilo Nike">Cambiar el estilo</button><button type="button" data-ia="A Salva cámbiale el press de banca por fondos en paralelas">Cambiar un ejercicio</button><button type="button" data-ia="Añade a la banderola la frase: ">Frase nueva…</button><button type="button" data-ia="Quita las frases de la casa de la banderola">Quitar frases de la casa</button><button type="button" data-ia="Pon las frases de la casa otra vez">Poner frases de la casa</button><button type="button" data-ia="Cambia el nombre del gimnasio a ">Nombre del gimnasio…</button></div>' +
      '<p class="nota" style="margin-top:10px">Para que no lo use cualquiera con el enlace, ponle un código de entrenador.</p>' +
      '<div class="row"><div class="field" style="flex:1"><label>Código actual' + ((S.config.asistente && S.config.asistente.pin_hash) ? '' : ' (no hay)') + '</label><input id="aj-pin-actual" inputmode="numeric" autocomplete="off" ' + ((S.config.asistente && S.config.asistente.pin_hash) ? '' : 'disabled') + '></div><div class="field" style="flex:1"><label>Código nuevo (4 a 8 cifras)</label><input id="aj-pin-nuevo" inputmode="numeric" autocomplete="off"></div></div>' +
      '<div class="row"><button type="button" class="btn primary" id="aj-pin-guardar">Guardar código</button>' + ((S.config.asistente && S.config.asistente.pin_hash) ? '<button type="button" class="btn" id="aj-pin-quitar">Quitar el código</button>' : '') + '</div>' +
      '<div id="aj-ia-log" class="nota"></div></div>' +
      '<div class="panel"><h3>Marcar desde el móvil</h3><label class="row" style="gap:10px;cursor:pointer"><input type="checkbox" id="aj-qr" ' + (g.qr === false ? '' : 'checked') + ' style="width:20px;height:20px;accent-color:var(--accent)"> Código QR en cada tarjeta de la tele</label><p class="nota">El cliente lo escanea con la cámara del móvil y le sale su sesión de hoy: marca lo que va haciendo y apunta los kilos; la tele se actualiza al momento. Sin instalar nada. También puede abrir <a href="yo.html" target="_blank" rel="noopener">yo.html</a> y elegir su nombre.</p></div>' +
      '<div class="panel"><h3>Banderola de la tele</h3><label class="row" style="gap:10px;cursor:pointer"><input type="checkbox" id="aj-banderola" ' + (g.banderola === false ? '' : 'checked') + ' style="width:20px;height:20px;accent-color:var(--accent)"> Mostrar la banderola con frases</label><label class="row" style="gap:10px;cursor:pointer"><input type="checkbox" id="aj-frases-casa" ' + (g.frases_casa === false ? '' : 'checked') + ' style="width:20px;height:20px;accent-color:var(--accent)"> Frases de la casa: «Vendo Opel Corsa», «Fuck Pccom», «Always Powerplanet» (al azar entre las demás)</label><div class="field"><label>Frases (una por línea; pasan en bucle como en la bolsa de Nueva York)</label><textarea id="aj-frases" style="min-height:160px">' + esc(frasesPropias().join('\n')) + '</textarea></div><p class="nota">Si dejas el cuadro vacío vuelven las frases de serie.</p></div>' +
      '<div class="panel"><h3>Excel y Google Drive</h3><p class="nota">Sube de golpe lo que tienen en Drive (la carpeta entera bajada como ZIP) o cualquier Excel: leo todos los archivos y todas las pestañas y te enseño lo entendido antes de guardar. Y descarga una copia de todo cuando quieras.</p><div class="row"><button type="button" class="btn primary" id="aj-importar">Subir ZIP de Drive o Excel</button><button type="button" class="btn" id="aj-exportar">Exportar todo a Excel</button><button type="button" class="btn" id="aj-exportar-cli">Solo clientes</button></div></div>' +
      '<div class="panel"><h3>Datos</h3><div class="kpis" id="aj-kpis"><div class="kpi"><b>…</b><span>clientes activos</span></div><div class="kpi"><b>…</b><span>sesiones</span></div><div class="kpi"><b>' + S.ejercicios.length + '</b><span>ejercicios</span></div></div><p class="nota">Base de datos propia del gimnasio (Supabase, proyecto aparte). Dibujos de ejercicios: <a href="https://exercise-dataset.com" target="_blank" rel="noopener">RepDB</a>.</p></div>' +
      '</div>';
    try {
      var r = await Promise.all([DB.sb.from('clientes').select('*', { count: 'exact', head: true }).eq('activo', true), DB.sb.from('sesiones').select('*', { count: 'exact', head: true })]);
      var k = $$('#aj-kpis .kpi b'); k[0].textContent = r[0].count == null ? '—' : r[0].count; k[1].textContent = r[1].count == null ? '—' : r[1].count;
    } catch (e) {}
    var guardarGym = debounce(function () { var v = Object.assign({}, S.config.gimnasio || {}, { frases_casa: $('#aj-frases-casa').checked, nombre: $('#aj-nombre').value.trim() || cfg.nombre, estilo: ($('#aj-estilo button[aria-pressed="true"]') || {}).dataset ? $('#aj-estilo button[aria-pressed="true"]').dataset.skin : 'yard', banderola: $('#aj-banderola').checked, qr: $('#aj-qr').checked }); S.config.gimnasio = v; DB.setConfig('gimnasio', v).then(function () { toast('Guardado'); var h = $('#brand-nombre'); if (h) h.textContent = v.nombre; document.title = v.nombre; }).catch(fallo); }, 500);
    $('#aj-nombre').addEventListener('input', guardarGym);
    $('#aj-banderola').addEventListener('change', guardarGym);
    $('#aj-frases-casa').addEventListener('change', guardarGym);
    $('#aj-qr').addEventListener('change', guardarGym);
    $('#aj-pin-guardar').addEventListener('click', async function () { var n = $('#aj-pin-nuevo').value.trim(); if (!/^\d{4,8}$/.test(n)) return toast('El código son 4 a 8 cifras', true); this.disabled = true; try { await cambiarPin(($('#aj-pin-actual').value || '').trim(), n); S.config = await DB.getConfig(); toast('Código guardado'); route(); } catch (e) { fallo(e); } this.disabled = false; });
    var bq = $('#aj-pin-quitar'); if (bq) bq.addEventListener('click', async function () { this.disabled = true; try { await cambiarPin(($('#aj-pin-actual').value || '').trim(), ''); S.config = await DB.getConfig(); toast('Código quitado'); route(); } catch (e) { fallo(e); } this.disabled = false; });
    try { var lg = await DB.sb.from('asistente_log').select('creado_en,entrada,tokens_in,tokens_out').order('creado_en', { ascending: false }).limit(5); if (lg.data && lg.data.length) $('#aj-ia-log').innerHTML = 'Últimas órdenes: ' + lg.data.map(function (x) { return '«' + esc(x.entrada.slice(0, 50)) + '»'; }).join(' · '); } catch (e) {}
    $('#aj-frases').addEventListener('input', debounce(function () { var lista = $('#aj-frases').value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean); S.config.frases = { lista: lista }; DB.setConfig('frases', { lista: lista }).then(function () { toast('Frases guardadas'); }).catch(fallo); }, 700));
    $('#aj-estilo').addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (!b) return; $$('#aj-estilo button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); guardarGym(); if (!store.get('pizarra_skin')) aplicarSkin(b.dataset.skin); });
    $('#aj-estilo-reset').addEventListener('click', function () { store.set('pizarra_skin', null); aplicarSkin(skinElegida()); toast('Este aparato sigue el estilo por defecto'); });
    $('#aj-copiar').addEventListener('click', function () { var i = $('#aj-url'); i.select(); (navigator.clipboard ? navigator.clipboard.writeText(i.value) : Promise.reject()).then(function () { toast('Enlace copiado'); }).catch(function () { try { document.execCommand('copy'); toast('Enlace copiado'); } catch (e) { toast('Cópialo a mano del cuadro', true); } }); });
    $('#aj-importar').addEventListener('click', async function () { try { abrirImportar(await DB.clientes({ incluirBajas: true }), function () { route(); }); } catch (e) { fallo(e); } });
    $('#aj-otra-pantalla').addEventListener('click', function () { abrirTeleOtraPantalla(urlTele); });
    $('#aj-lanzador').addEventListener('click', function () { lanzadorWindows(urlTele, $('#aj-lado').value); toast('Lanzador descargado: cópialo en shell:startup'); });
    $('#aj-ia-chips').addEventListener('click', function (ev) { var b = ev.target.closest('[data-ia]'); if (!b) return; IA.abrir(b.dataset.ia, !/[:\s]$/.test(b.dataset.ia)); });
    $('#aj-exportar').addEventListener('click', async function () { this.disabled = true; try { EXCEL.exportarTodo(await DB.todoParaExcel()); toast('Excel descargado'); } catch (e) { fallo(e); } this.disabled = false; });
    $('#aj-exportar-cli').addEventListener('click', async function () { try { EXCEL.exportarClientes(await DB.clientes({ incluirBajas: true })); } catch (e) { fallo(e); } });
  }

  // ---------- la tele en un PC con Windows (GY-D32) ----------
  // Chrome/Edge: con permiso de «gestión de ventanas» abrimos la tele ya a pantalla completa en la otra pantalla
  async function abrirTeleOtraPantalla(url) {
    var feats = 'popup';
    try {
      if (window.getScreenDetails) {
        var sd = await window.getScreenDetails();
        var otra = sd.screens.filter(function (s) { return s !== sd.currentScreen; })[0];
        if (!otra) toast('Solo veo una pantalla: abro la tele aquí, pulsa F11', true);
        else feats = 'popup,fullscreen,left=' + otra.availLeft + ',top=' + otra.availTop + ',width=' + otra.availWidth + ',height=' + otra.availHeight;
      } else toast('Este navegador no sabe de pantallas: abro la tele, arrástrala a la otra y pulsa F11');
    } catch (e) { toast('Sin permiso para ver las pantallas: abro la tele, arrástrala a la otra y pulsa F11', true); }
    var w = window.open(url + '?auto=1', 'mc-tele', feats);
    if (!w) toast('El navegador ha bloqueado la ventana: permite las ventanas emergentes para esta página', true);
  }
  // Lanzador para la carpeta de Inicio de Windows: abre Chrome o Edge en modo quiosco (pantalla completa, sin barras) en la segunda pantalla
  function lanzadorWindows(url, lado) {
    var pos = { derecha: '1920,0', izquierda: '-1920,0', arriba: '0,-1080', abajo: '0,1080' }[lado] || '1920,0';
    var bat = ['@echo off', 'rem MC Coach - abre la tele a pantalla completa en la segunda pantalla. Copiar en la carpeta de Inicio (Windows+R, shell:startup).',
      'set "URL=' + url + '?kiosk=1"', 'set "POS=' + pos + '"', 'set "NAV="',
      'for %%p in ("%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe") do if not defined NAV if exist %%p set "NAV=%%~p"',
      'if not defined NAV ( echo No encuentro Chrome ni Edge en este PC & pause & exit /b 1 )',
      'rem al arrancar el PC la segunda pantalla tarda unos segundos en estar lista', 'timeout /t 8 /nobreak >nul',
      'start "" "%NAV%" --new-window --kiosk "%URL%" --edge-kiosk-type=fullscreen --window-position=%POS% --user-data-dir="%LocalAppData%\\MCCoachTele" --no-first-run --disable-session-crashed-bubble --autoplay-policy=no-user-gesture-required',
      'exit /b 0'].join('\r\n');
    var el = document.createElement('a'); el.href = URL.createObjectURL(new Blob([bat], { type: 'application/octet-stream' })); el.download = 'MC Coach Tele.bat'; document.body.appendChild(el); el.click(); el.remove();
  }

  // ======================================================================
  // ASISTENTE DE IA — chat del cuaderno (la función «asistente» en la nube del gym llama a Claude con herramientas)
  // ======================================================================
  var IA = { url: cfg.supabaseUrl + '/functions/v1/asistente', mensajes: [], ocupado: false, cambios: false, rec: null };
  var ICO_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>';
  var ICO_MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
  var ICO_CLIP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5 12.5 20a5.5 5.5 0 0 1-7.8-7.8l8.5-8.5a3.5 3.5 0 0 1 5 5l-8.5 8.5a1.5 1.5 0 0 1-2.1-2.1L15.5 7"/></svg>';
  var ICO_IA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/></svg>';
  function iaPin() { return store.get('pizarra_pin') || ''; }
  function montarIA() {
    if (S.modo !== 'app' || $('#ia-btn')) return;
    document.body.insertAdjacentHTML('beforeend', '<button type="button" class="ia-btn" id="ia-btn">' + ICO_IA + 'Asistente</button>' +
      '<aside class="ia-panel" id="ia-panel" aria-hidden="true" aria-label="Asistente"><header><div><h3>Asistente</h3><span class="nota">Dile qué hacer: altas, bajas, sesiones de hoy, ejercicios, frases de la banderola… o adjunta un archivo con el clip (ZIP de Drive, Excel, CSV).</span></div><button type="button" class="btn icon ghost" id="ia-cerrar" aria-label="Cerrar">×</button></header>' +
      '<div class="ia-msgs" id="ia-msgs"><div class="ia-chips" id="ia-chips"><button type="button" data-q="¿Quién entrena hoy?">¿Quién entrena hoy?</button><button type="button" data-q="Añade a ">Añadir a hoy…</button><button type="button" data-q="Nuevo cliente: ">Nuevo cliente…</button><button type="button" data-q="Pon en la banderola: ">Frase para la banderola…</button><button type="button" data-clip="1">Subir archivo…</button><button type="button" data-q="¿Qué hizo ">¿Qué hizo…?</button></div></div>' +
      '<form class="ia-form" id="ia-form"><textarea id="ia-texto" rows="1" placeholder="Escribe o dicta una orden…" aria-label="Orden"></textarea><button type="button" class="btn icon ghost" id="ia-clip" aria-label="Adjuntar archivo (ZIP de Drive, Excel o CSV)" title="Adjuntar archivo">' + ICO_CLIP + '</button><input type="file" id="ia-file" accept=".zip,.xlsx,.xlsm,.xls,.csv,.ods" multiple hidden><button type="button" class="btn icon ghost ia-mic" id="ia-mic" aria-label="Dictar" hidden>' + ICO_MIC + '</button><button type="submit" class="btn primary icon" id="ia-enviar" aria-label="Enviar">' + ICO_SEND + '</button></form></aside>');
    var panel = $('#ia-panel'), texto = $('#ia-texto');
    $('#ia-btn').addEventListener('click', function () { var abierto = panel.classList.toggle('open'); panel.setAttribute('aria-hidden', String(!abierto)); if (abierto) setTimeout(function () { texto.focus(); }, 80); });
    $('#ia-cerrar').addEventListener('click', function () { panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); });
    $('#ia-clip').addEventListener('click', function () { $('#ia-file').click(); });
    $('#ia-file').addEventListener('change', function () { var fs = Array.prototype.slice.call(this.files); this.value = ''; if (fs.length) importarDesdeChat(fs); });
    $('#ia-chips').addEventListener('click', function (ev) { if (ev.target.closest('[data-clip]')) $('#ia-file').click(); });
    ['dragenter', 'dragover'].forEach(function (e) { panel.addEventListener(e, function (ev) { ev.preventDefault(); panel.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (e) { panel.addEventListener(e, function (ev) { ev.preventDefault(); panel.classList.remove('over'); }); });
    panel.addEventListener('drop', function (ev) { if (ev.dataTransfer.files.length) importarDesdeChat(ev.dataTransfer.files); });
    IA.abrir = function (t, enviar) { panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); texto.value = t || ''; texto.focus(); if (enviar) enviarIA(); };
    $('#ia-chips').addEventListener('click', function (ev) { var b = ev.target.closest('[data-q]'); if (!b) return; texto.value = b.dataset.q; texto.focus(); if (/\?$/.test(b.dataset.q)) enviarIA(); });
    texto.addEventListener('input', function () { texto.style.height = 'auto'; texto.style.height = Math.min(120, texto.scrollHeight) + 'px'; });
    texto.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); enviarIA(); } });
    $('#ia-form').addEventListener('submit', function (ev) { ev.preventDefault(); enviarIA(); });
    $('#ia-msgs').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-deshacer]'); if (b) { deshacerIA(JSON.parse(b.dataset.deshacer), b.closest('.ia-card')); return; }
      var c = ev.target.closest('[data-confirmar]'); if (c) { confirmarIA(JSON.parse(c.closest('.ia-card').dataset.datos), c.dataset.confirmar === 'si', c.closest('.ia-card')); }
    });
    // dictado por voz (Chrome / Android)
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) { var mic = $('#ia-mic'); mic.hidden = false; mic.addEventListener('click', function () {
      if (IA.rec) { IA.rec.stop(); return; }
      var r = new SR(); r.lang = 'es-ES'; r.interimResults = true; r.continuous = false; IA.rec = r; mic.classList.add('on');
      r.onresult = function (e) { var t = ''; for (var i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; texto.value = t; };
      r.onerror = function () { toast('No he podido escuchar', true); };
      r.onend = function () { IA.rec = null; mic.classList.remove('on'); if (texto.value.trim()) enviarIA(); };
      try { r.start(); } catch (e) { IA.rec = null; mic.classList.remove('on'); }
    }); }
  }
  function iaBurbuja(cls, html) { var m = $('#ia-msgs'); var el = document.createElement('div'); el.className = 'ia-msg ' + cls; el.innerHTML = html; m.appendChild(el); m.scrollTop = m.scrollHeight; return el; }
  function iaCard(html, extra) { var m = $('#ia-msgs'); var el = document.createElement('div'); el.className = 'ia-card ' + (extra || ''); el.innerHTML = html; m.appendChild(el); m.scrollTop = m.scrollHeight; return el; }
  async function enviarIA() {
    var texto = $('#ia-texto'); var q = texto.value.trim(); if (!q || IA.ocupado) return;
    texto.value = ''; texto.style.height = 'auto';
    var chips = $('#ia-chips'); if (chips) chips.remove();
    iaBurbuja('user', esc(q));
    IA.mensajes.push({ role: 'user', content: q }); IA.mensajes = IA.mensajes.slice(-12);
    IA.ocupado = true; $('#ia-enviar').disabled = true;
    var bot = iaBurbuja('bot', ''); var estado = null; var textoBot = '';
    try {
      var r = await fetch(IA.url, { method: 'POST', headers: { apikey: cfg.supabaseKey, 'Content-Type': 'application/json', 'x-pin': iaPin() }, body: JSON.stringify({ mensajes: IA.mensajes }) });
      if (r.status === 401) { bot.remove(); IA.mensajes.pop(); IA.ocupado = false; $('#ia-enviar').disabled = false; return pedirPin(function () { texto.value = q; enviarIA(); }); }
      if (!r.ok) { var e1 = ''; try { e1 = (await r.json()).error; } catch (e) {} throw new Error(e1 || ('Error ' + r.status)); }
      var reader = r.body.getReader(), dec = new TextDecoder(), buf = '';
      while (true) {
        var ch = await reader.read(); if (ch.done) break;
        buf += dec.decode(ch.value, { stream: true });
        var partes = buf.split('\n\n'); buf = partes.pop();
        partes.forEach(function (p) {
          var l = p.split('\n').filter(function (x) { return x.indexOf('data: ') === 0; })[0]; if (!l) return;
          var ev; try { ev = JSON.parse(l.slice(6)); } catch (e) { return; }
          if (ev.t) { textoBot += ev.t; bot.innerHTML = esc(textoBot).replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>'); $('#ia-msgs').scrollTop = $('#ia-msgs').scrollHeight; }
          if (ev.herramienta) { if (!estado) estado = iaBurbuja('ia-estado', ''); estado.textContent = 'Haciendo: ' + ev.herramienta.replace(/_/g, ' ') + '…'; }
          if (ev.accion) { IA.cambios = true; iaCard('<span>' + esc(ev.accion.texto) + '</span>' + (ev.accion.deshacer ? '<span class="acc"><button type="button" class="btn sm" data-deshacer=\'' + esc(JSON.stringify(ev.accion.deshacer)) + '\'>Deshacer</button></span>' : '')); }
          if (ev.confirmar) { var c = iaCard('<span>' + esc(ev.confirmar.texto) + '</span><span class="acc"><button type="button" class="btn sm" data-confirmar="no">No</button><button type="button" class="btn sm primary" data-confirmar="si">Sí</button></span>', 'confirm'); c.dataset.datos = JSON.stringify(ev.confirmar); }
          if (ev.error) { iaBurbuja('err', esc(ev.error)); }
        });
      }
      if (!textoBot) bot.remove(); else IA.mensajes.push({ role: 'assistant', content: textoBot });
    } catch (e) { bot.remove(); iaBurbuja('err', esc(e.message || 'No he podido hablar con el asistente')); }
    if (estado) estado.remove();
    IA.ocupado = false; $('#ia-enviar').disabled = false; $('#ia-texto').focus();
    if (IA.cambios) { IA.cambios = false; invalidarClientes(); if (/^#?(hoy|clientes|ejercicios|ajustes)?$/.test(location.hash.split('/')[0])) route(); }
  }
  // Archivos adjuntos en el chat: se leen aquí mismo (sin pasar por la IA), se enseña lo entendido y se guarda con un Sí
  async function importarDesdeChat(files) {
    var chips = $('#ia-chips'); if (chips) chips.remove();
    iaBurbuja('user', esc(Array.prototype.map.call(files, function (f) { return f.name; }).join(', ')));
    var bot = iaBurbuja('bot', 'Leyendo los archivos…');
    try {
      var p = await prepararImportacion(files, await DB.clientes({ incluirBajas: true }));
      bot.innerHTML = p.hayAlgo ? 'Esto es lo que he entendido. ¿Lo guardo?' : 'Lo he leído, pero no hay nada nuevo que guardar.';
      var card = iaCard('<div class="ia-imp">' + p.html + '</div>' + (p.hayAlgo ? '<span class="acc"><button type="button" class="btn sm" data-imp="no">No</button><button type="button" class="btn sm primary" data-imp="si">' + esc(p.boton) + '</button></span>' : ''), 'confirm imp');
      card.addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-imp]'); if (!b) return;
        if (b.dataset.imp === 'no') { card.classList.add('hecho'); card.insertAdjacentHTML('beforeend', '<span class="muted">cancelado</span>'); return; }
        guardarImportacion(p, b, function () { card.classList.add('hecho'); iaBurbuja('bot', 'Guardado: ' + esc(p.resumen) + '.'); IA.mensajes.push({ role: 'user', content: '(He subido archivos: ' + p.resumen + ' guardados)' }); route(); });
      });
    } catch (e) { bot.remove(); iaBurbuja('err', esc(e.message || 'No he podido leer los archivos')); }
  }
  async function confirmarIA(d, si, card) {
    if (!si) { card.classList.add('hecho'); card.insertAdjacentHTML('beforeend', '<span class="muted">cancelado</span>'); return; }
    try {
      if (d.tipo === 'baja') await DB.darDeBaja(d.cliente_id);
      else if (d.tipo === 'quitar_sesion') await DB.borrarSesion(d.sesion_id);
      else if (d.tipo === 'frases_reemplazar') { S.config.frases = { lista: d.lista }; await DB.setConfig('frases', { lista: d.lista }); }
      card.classList.add('hecho'); card.insertAdjacentHTML('beforeend', '<span class="muted">hecho</span>'); toast('Hecho'); invalidarClientes(); route();
    } catch (e) { fallo(e); }
  }
  async function deshacerIA(d, card) {
    try {
      if (d.tipo === 'quitar_ejercicio') await DB.borrarItem(d.item_id);
      else if (d.tipo === 'reponer_ejercicio') await DB.crearItems([d.datos]);
      else if (d.tipo === 'baja') await DB.darDeBaja(d.cliente_id);
      else if (d.tipo === 'baja_varios') { for (var i = 0; i < d.ids.length; i++) await DB.darDeBaja(d.ids[i]); }
      else if (d.tipo === 'borrar_sesion') await DB.borrarSesion(d.sesion_id);
      else if (d.tipo === 'borrar_observacion') await DB.borrarObservacion(d.id);
      else if (d.tipo === 'cambiar_ejercicio') await DB.actualizarItem(d.item_id, d.datos);
      else if (d.tipo === 'frases_restaurar') { S.config.frases = { lista: d.lista }; await DB.setConfig('frases', { lista: d.lista }); }
      else if (d.tipo === 'gimnasio_restaurar') { S.config.gimnasio = d.valor; await DB.setConfig('gimnasio', d.valor); aplicarSkin(skinElegida()); }
      else return toast('Esto no se puede deshacer solo', true);
      card.classList.add('hecho'); card.insertAdjacentHTML('beforeend', '<span class="muted">deshecho</span>'); toast('Deshecho'); invalidarClientes(); route();
    } catch (e) { fallo(e); }
  }
  function pedirPin(cb) {
    var el = sheet('<h3>Código del entrenador</h3><p class="nota">El asistente pide un código para que no lo use cualquiera con el enlace. Se guarda en este aparato.</p><div class="field"><label>Código</label><input id="pin-in" inputmode="numeric" autocomplete="off" autofocus></div><div class="acciones"><button type="button" class="btn" data-x="no">Cancelar</button><button type="button" class="btn primary" data-x="si">Entrar</button></div>');
    el.addEventListener('click', function (ev) { var b = ev.target.closest('[data-x]'); if (!b) return; if (b.dataset.x === 'si') { store.set('pizarra_pin', $('#pin-in', el).value.trim()); cerrarSheet(); if (cb) cb(); } else cerrarSheet(); });
    $('#pin-in', el).addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); store.set('pizarra_pin', $('#pin-in', el).value.trim()); cerrarSheet(); if (cb) cb(); } });
  }
  async function cambiarPin(actual, nuevo) {
    var r = await fetch(IA.url, { method: 'POST', headers: { apikey: cfg.supabaseKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: 'pin', pin: actual, pin_nuevo: nuevo }) });
    var j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error(j.error || ('Error ' + r.status));
    store.set('pizarra_pin', nuevo || null); return j;
  }

  // ======================================================================
  // arranque
  // ======================================================================
  async function init() {
    aplicarSkin(skinElegida());
    try { S.config = await DB.getConfig(); } catch (e) { toast('Sin conexión con la base: ' + (e.message || ''), true); }
    aplicarSkin(skinElegida());
    var h = $('#brand-nombre'); if (h) h.textContent = nombreGym(); document.title = nombreGym() + (S.modo === 'tele' ? ' · Tele' : S.modo === 'yo' ? ' · Mi sesión' : '');
    try { S.ejercicios = await DB.ejercicios(); } catch (e) { toast('No he podido cargar la biblioteca de ejercicios', true); }
    indexEjercicios();
    window.addEventListener('hashchange', route);
    route();
    montarIA();
  }
  init().catch(fallo);
})();
