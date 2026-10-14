// Importar TODO de golpe: un ZIP bajado de Google Drive (la carpeta entera), varios Excel/CSV o uno solo.
// Lee cada archivo y cada pestaña y entiende dos cosas (GY-D28/D29):
//   · hojas de CLIENTES (una fila de títulos con Nombre, Apellidos, Teléfono…)
//   · PIZARRAS como la de la foto: bloques por cliente («Salva · Día 3»), columnas Ejercicio / Series × reps (y Kilos si hay),
//     «CARDIO + ABD» al final del bloque. Varios bloques en la misma pestaña, uno al lado de otro o uno debajo de otro.
// Lo que no entiende lo marca como «no entendida» y no se guarda. Funciona en el navegador (window.IMPORTAR) y en node (pruebas).
(function (root) {
  'use strict';
  var norm = function (s) { return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); };
  var MESES = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12 };
  var COLS = {
    nombre: ['nombre', 'name', 'cliente', 'nombre completo', 'nombre y apellidos', 'socio', 'usuario', 'alumno', 'alumna'],
    apellidos: ['apellidos', 'apellido', 'surname', 'last name'],
    telefono: ['telefono', 'tel', 'movil', 'phone', 'telf', 'tfno'],
    email: ['email', 'correo', 'mail', 'e-mail'],
    notas: ['notas', 'observaciones', 'comentarios', 'nota', 'notes']
  };
  var RE_EJ = /^ejercicios?$/, RE_SERIES = /serie|reps?\b|repeticion|\bx\b/, RE_KILOS = /kilo|\bkg\b|peso|carga/, RE_DIA = /\bd[ií]a\s*(\d{1,2})\b/i;
  var RE_FINAL = /^(cardio|abd|abdom|final|estir|movilidad|core)/, RE_SERIES_VAL = /^\d{1,2}\s*[x×*]\s*\d/;
  var p2 = function (n) { return String(n).padStart(2, '0'); };
  var iso = function (d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };

  // ---------- fecha a partir de un nombre («14/10», «14-10-2026», «lunes 14 oct», «2026-10-14») ----------
  function fechaDeTexto(t) {
    t = norm(t); if (!t) return null;
    var m = t.match(/(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/); if (m) return valida(+m[1], +m[2], +m[3]);
    m = t.match(/(\d{1,2})[-\/.](\d{1,2})(?:[-\/.](\d{2,4}))?/); if (m) { var y = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : new Date().getFullYear(); return valida(y, +m[2], +m[1]); }
    m = t.match(/(\d{1,2})\s*(?:de\s+)?([a-z]{3})[a-z]*\.?(?:\s*(?:de\s+)?(\d{4}))?/); if (m && MESES[m[2]]) return valida(m[3] ? +m[3] : new Date().getFullYear(), MESES[m[2]], +m[1]);
    return null;
  }
  function valida(y, mo, d) { if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return null; var dt = new Date(y, mo - 1, d); return dt.getMonth() === mo - 1 ? iso(dt) : null; }

  // ---------- ejercicios propios (Ejercicio / Grupo / Material) ----------
  var GRUPOS = ['pecho', 'espalda', 'hombro', 'brazos', 'piernas', 'gluteo', 'core', 'cardio', 'movilidad', 'otro'];
  var SINON = { pectoral: 'pecho', pectorales: 'pecho', dorsal: 'espalda', dorsales: 'espalda', lumbar: 'espalda', hombros: 'hombro', deltoides: 'hombro', brazo: 'brazos', biceps: 'brazos', triceps: 'brazos', antebrazo: 'brazos', pierna: 'piernas', cuadriceps: 'piernas', isquios: 'piernas', isquiotibiales: 'piernas', gemelos: 'piernas', gluteos: 'gluteo', abdomen: 'core', abdominales: 'core', abs: 'core', aerobico: 'cardio', estiramientos: 'movilidad', estiramiento: 'movilidad', flexibilidad: 'movilidad', otros: 'otro' };
  function grupoDe(t) { t = norm(t); if (!t) return 'otro'; if (GRUPOS.indexOf(t) >= 0) return t; if (SINON[t]) return SINON[t]; var g = GRUPOS.filter(function (x) { return t.indexOf(x) >= 0; })[0]; if (g) return g; var s = Object.keys(SINON).filter(function (x) { return t.indexOf(x) >= 0; })[0]; return s ? SINON[s] : 'otro'; }
  function hojaEjercicios(filas) {
    for (var r = 0; r < Math.min(filas.length, 10); r++) {
      var fila = filas[r].map(norm);
      var cn = fila.findIndex(function (c) { return /^(ejercicio|ejercicios|nombre|movimiento)$/.test(c); });
      var cg = fila.findIndex(function (c) { return /^(grupo|grupo muscular|musculo|musculos|zona|parte)$/.test(c); });
      var ce = fila.findIndex(function (c) { return /^(material|equipo|equipamiento|maquina)$/.test(c); });
      var hayS = fila.some(function (c) { return RE_SERIES.test(c); });
      if (cn < 0 || (cg < 0 && ce < 0) || hayS) continue;
      var out = [];
      for (var k = r + 1; k < filas.length; k++) { var f = filas[k] || [], n = String(f[cn] || '').trim(); if (!n) continue; out.push({ nombre: n, grupo: cg >= 0 ? grupoDe(f[cg]) : 'otro', equipo: ce >= 0 ? String(f[ce] || '').trim() : '' }); }
      return out.length ? out : null;
    }
    return null;
  }

  // ---------- clientes ----------
  function hojaClientes(filas) {
    for (var i = 0; i < Math.min(filas.length, 10); i++) {
      var fila = filas[i].map(norm), m = {};
      Object.keys(COLS).forEach(function (k) { var j = fila.findIndex(function (c) { return COLS[k].indexOf(c) >= 0; }); if (j >= 0) m[k] = j; });
      if (m.nombre === undefined) continue;
      var out = [];
      for (var r = i + 1; r < filas.length; r++) {
        var f = filas[r]; if (!f) continue; var nombre = String(f[m.nombre] || '').trim(); if (!nombre) continue;
        var c = { nombre: nombre };
        ['apellidos', 'telefono', 'email', 'notas'].forEach(function (k) { if (m[k] !== undefined) c[k] = String(f[m[k]] || '').trim(); });
        if (!c.apellidos && nombre.indexOf(',') > 0) { var p = nombre.split(','); c.nombre = p[1].trim(); c.apellidos = p[0].trim(); }
        out.push(c);
      }
      return { clientes: out, columnas: Object.keys(m) };
    }
    return null;
  }

  // ---------- pizarra (bloques por cliente) ----------
  function limpiarNombre(t) { return String(t || '').replace(RE_DIA, '').replace(/[(\[]\s*[)\]]/g, '').replace(/[·:\-–|,]+\s*$/, '').replace(/^\s*[·:\-–|,]+/, '').trim(); }
  function esSerie(t) { return RE_SERIES_VAL.test(norm(t)); }
  function normSeries(t) { t = String(t || '').trim(); return t.replace(/\s*[x×*]\s*/i, ' × '); }
  function hojaPizarra(filas) {
    var cab = [];
    filas.forEach(function (f, r) { (f || []).forEach(function (v, c) { if (RE_EJ.test(norm(v))) cab.push({ r: r, c: c }); }); });
    var bloques = [];
    if (cab.length) {
      cab.forEach(function (h) {
        var fila = filas[h.r] || [], cs = -1, ck = -1, j;
        for (j = h.c + 1; j <= h.c + 5 && cs < 0; j++) if (RE_SERIES.test(norm(fila[j]))) cs = j;
        if (cs < 0) cs = h.c + 1;
        for (j = h.c + 1; j <= h.c + 6; j++) if (j !== cs && RE_KILOS.test(norm(fila[j]))) { ck = j; break; }
        // nombre y «Día N»: en las 3 filas de arriba, entre la columna del ejercicio y la de series
        var nombre = '', dia = null;
        for (var rr = h.r - 1; rr >= Math.max(0, h.r - 3) && !nombre; rr--) {
          for (j = h.c; j <= Math.max(cs, h.c + 2); j++) {
            var v = String((filas[rr] || [])[j] || '').trim(); if (!v) continue;
            var md = v.match(RE_DIA); if (md) dia = +md[1];
            var n = limpiarNombre(v); if (n && !nombre) nombre = n;
          }
        }
        bloques.push({ r: h.r + 1, c: h.c, cs: cs, ck: ck, nombre: nombre, dia: dia, rNombre: h.r - 1 });
      });
    } else {
      // sin fila de títulos: bloques en la primera columna usada separados por filas en blanco; primera fila = nombre
      var c0 = -1; filas.some(function (f) { var j = (f || []).findIndex(function (v) { return String(v || '').trim(); }); if (j >= 0) { c0 = j; return true; } return false; });
      if (c0 < 0) return null;
      var hayS = filas.some(function (f) { return f && (esSerie(f[c0 + 1]) || esSerie(f[c0 + 2])); }); if (!hayS) return null;
      var enBloque = false;
      filas.forEach(function (f, r) {
        var v = String((f || [])[c0] || '').trim();
        if (!v) { enBloque = false; return; }
        if (!enBloque) { enBloque = true; var md = v.match(RE_DIA); bloques.push({ r: r + 1, c: c0, cs: esSerie((f || [])[c0 + 1]) ? c0 + 1 : (esSerie((f || [])[c0 + 2]) ? c0 + 2 : c0 + 1), ck: -1, nombre: limpiarNombre(v), dia: md ? +md[1] : null, rNombre: r }); }
      });
    }
    var filasNombre = {}; bloques.forEach(function (b) { filasNombre[b.rNombre + ':' + b.c] = true; filasNombre[(b.r - 1) + ':' + b.c] = true; });
    var sesiones = [];
    bloques.forEach(function (b) {
      var items = [], final = '';
      for (var r = b.r; r < filas.length; r++) {
        var f = filas[r] || [], v = String(f[b.c] || '').trim();
        if (!v) break;
        if (RE_EJ.test(norm(v)) || filasNombre[r + ':' + b.c]) break;
        var s = String(f[b.cs] || '').trim(), k = b.ck >= 0 ? String(f[b.ck] || '').trim() : '';
        if (!s && RE_FINAL.test(norm(v))) { final = v; continue; }
        items.push({ nombre: v, series: normSeries(s), kilos: k });
      }
      if (b.nombre && (items.length || final)) sesiones.push({ cliente: b.nombre, dia: b.dia, final: final, items: items });
    });
    return sesiones.length ? sesiones : null;
  }

  // ---------- una pestaña ----------
  function interpretarHoja(filas, ctx) {
    filas = (filas || []).map(function (f) { return (f || []).map(function (v) { return v == null ? '' : String(v).trim(); }); });
    var vacia = !filas.some(function (f) { return f.some(Boolean); });
    var res = { archivo: ctx.archivo, hoja: ctx.hoja, tipo: 'desconocida', clientes: [], sesiones: [], ejercicios: [], avisos: [] };
    if (vacia) { res.tipo = 'vacia'; return res; }
    var ej = hojaEjercicios(filas);
    if (ej) { res.tipo = 'ejercicios'; res.ejercicios = ej; return res; }
    var cl = hojaClientes(filas);
    if (cl && cl.clientes.length) { res.tipo = 'clientes'; res.clientes = cl.clientes; res.columnas = cl.columnas; return res; }
    var pz = hojaPizarra(filas);
    if (pz) {
      var fecha = fechaDeTexto(ctx.hoja), origen = 'pestaña';
      if (!fecha) { fecha = fechaDeTexto(ctx.archivo); origen = 'nombre del archivo'; }
      if (!fecha && ctx.fechaArchivo) { fecha = iso(new Date(ctx.fechaArchivo)); origen = 'fecha del archivo'; }
      if (!fecha) { fecha = iso(new Date()); origen = 'hoy'; }
      res.tipo = 'pizarra'; res.fecha = fecha; res.fechaOrigen = origen;
      res.sesiones = pz.map(function (s) { s.fecha = fecha; return s; });
      return res;
    }
    return res;
  }

  // ---------- varios archivos → plan ----------
  function interpretar(archivos) {
    var hojas = [];
    archivos.forEach(function (a) { a.hojas.forEach(function (h) { hojas.push(interpretarHoja(h.filas, { archivo: a.archivo, hoja: h.nombre, fechaArchivo: a.fecha })); }); });
    var clientes = {}, orden = [];
    function cliente(c) { var k = norm(c.nombre + ' ' + (c.apellidos || '')); if (!clientes[k]) { clientes[k] = Object.assign({ apellidos: '', telefono: '', email: '', notas: '' }, c); orden.push(k); } else ['apellidos', 'telefono', 'email', 'notas'].forEach(function (f) { if (c[f] && !clientes[k][f]) clientes[k][f] = c[f]; }); return k; }
    var sesiones = [];
    // primero las hojas de clientes (traen apellidos); luego las pizarras, que suelen llevar solo el nombre de pila:
    // si ese nombre coincide con UN solo cliente de la lista, es el mismo
    var ejercicios = {}, ordenEj = [];
    hojas.forEach(function (h) { h.clientes.forEach(cliente); h.ejercicios.forEach(function (e) { var k = norm(e.nombre); if (!ejercicios[k]) { ejercicios[k] = e; ordenEj.push(k); } }); });
    function porNombrePila(n) { n = norm(n); var c = orden.filter(function (k) { return norm(clientes[k].nombre) === n; }); return c.length === 1 ? c[0] : null; }
    hojas.forEach(function (h) {
      h.sesiones.forEach(function (s) { s.clave = porNombrePila(s.cliente) || cliente({ nombre: s.cliente }); s.origen = h.archivo + ' › ' + h.hoja; sesiones.push(s); });
    });
    // misma persona, misma fecha y mismos ejercicios en dos sitios (p. ej. la misma hoja en dos archivos): se queda una
    var vistos = {}; sesiones = sesiones.filter(function (s) { var k = s.clave + '|' + s.fecha + '|' + s.items.map(function (i) { return norm(i.nombre); }).join(','); if (vistos[k]) return false; vistos[k] = true; return true; });
    return {
      hojas: hojas,
      clientes: orden.map(function (k) { var c = clientes[k]; c.clave = k; return c; }),
      sesiones: sesiones,
      ejercicios: ordenEj.map(function (k) { return ejercicios[k]; }),
      resumen: { archivos: archivos.length, hojas: hojas.length, entendidas: hojas.filter(function (h) { return h.tipo === 'clientes' || h.tipo === 'pizarra' || h.tipo === 'ejercicios'; }).length, ejerciciosPropios: ordenEj.length, clientes: orden.length, sesiones: sesiones.length, ejercicios: sesiones.reduce(function (n, s) { return n + s.items.length; }, 0) }
    };
  }

  // ---------- lectura de archivos (navegador) ----------
  function esZip(n) { return /\.zip$/i.test(n); }
  function esHoja(n) { return /\.(xlsx|xlsm|xls|csv|ods)$/i.test(n) && !/(^|\/)~\$/.test(n) && !/__MACOSX/.test(n); }
  function libro(bytes, nombre, fecha, XLSX) {
    var wb = XLSX.read(bytes, { type: 'array', cellDates: false });
    return { archivo: nombre, fecha: fecha || null, hojas: wb.SheetNames.map(function (sn) { return { nombre: sn, filas: XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: '', raw: false }) }; }) };
  }
  async function leerArchivos(files, deps) {
    var XLSX = deps.XLSX, JSZip = deps.JSZip, out = [], avisos = [];
    for (var i = 0; i < files.length; i++) {
      var f = files[i], nombre = f.name, fecha = f.lastModified ? new Date(f.lastModified) : null;
      try {
        if (esZip(nombre)) {
          if (!JSZip) { avisos.push('No puedo abrir ZIP en este navegador'); continue; }
          var zip = await JSZip.loadAsync(f), entradas = Object.keys(zip.files).filter(function (n) { return !zip.files[n].dir && esHoja(n); });
          if (!entradas.length) avisos.push(nombre + ': el ZIP no trae ningún Excel ni CSV');
          for (var j = 0; j < entradas.length; j++) {
            var e = zip.files[entradas[j]];
            try { out.push(libro(await e.async('uint8array'), entradas[j].split('/').pop(), e.date || fecha, XLSX)); } catch (err) { avisos.push(entradas[j] + ': no se pudo leer'); }
          }
        } else if (esHoja(nombre)) out.push(libro(new Uint8Array(await f.arrayBuffer()), nombre, fecha, XLSX));
        else avisos.push(nombre + ': no es un ZIP, Excel ni CSV');
      } catch (err) { avisos.push(nombre + ': ' + (err.message || 'no se pudo leer')); }
    }
    return { archivos: out, avisos: avisos };
  }

  var api = { grupoDe: grupoDe, interpretarHoja: interpretarHoja, interpretar: interpretar, leerArchivos: leerArchivos, libro: libro, fechaDeTexto: fechaDeTexto, norm: norm };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.IMPORTAR = api;
})(typeof window !== 'undefined' ? window : this);
