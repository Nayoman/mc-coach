// Excel: subir clientes en bloque, plantilla, y exportar todo. Usa SheetJS (XLSX) cargado en la página.
window.EXCEL = (function () {
  'use strict';
  var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); };
  var COLS = {
    nombre: ['nombre', 'name', 'cliente', 'nombre completo', 'nombre y apellidos', 'socio', 'usuario'],
    apellidos: ['apellidos', 'apellido', 'surname', 'last name'],
    telefono: ['telefono', 'tel', 'movil', 'phone', 'telf'],
    email: ['email', 'correo', 'mail', 'e-mail'],
    notas: ['notas', 'observaciones', 'comentarios', 'nota', 'notes']
  };

  function leer(file) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onerror = function () { rej(new Error('No se pudo leer el archivo')); };
      r.onload = function () {
        try {
          var wb = XLSX.read(new Uint8Array(r.result), { type: 'array' });
          var ws = wb.Sheets[wb.SheetNames[0]];
          var filas = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
          res({ hoja: wb.SheetNames[0], filas: filas });
        } catch (e) { rej(new Error('El archivo no parece un Excel o CSV válido')); }
      };
      r.readAsArrayBuffer(file);
    });
  }

  // Encuentra la fila de cabecera y mapea columnas → clientes. Si no hay cabecera, la primera columna es el nombre.
  function mapearClientes(filas) {
    var hdrIdx = -1, mapa = null;
    for (var i = 0; i < Math.min(filas.length, 10); i++) {
      var fila = filas[i].map(norm); var m = {};
      Object.keys(COLS).forEach(function (k) { var j = fila.findIndex(function (c) { return COLS[k].indexOf(c) >= 0; }); if (j >= 0) m[k] = j; });
      if (m.nombre !== undefined) { hdrIdx = i; mapa = m; break; }
    }
    var avisos = [];
    if (!mapa) { mapa = { nombre: 0 }; avisos.push('No encontré una fila de títulos (Nombre, Apellidos…): tomo la primera columna como nombre.'); hdrIdx = -1; }
    var out = [];
    for (var r = hdrIdx + 1; r < filas.length; r++) {
      var f = filas[r]; if (!f || !f.length) continue;
      var nombre = String(f[mapa.nombre] || '').trim(); if (!nombre) continue;
      var c = { nombre: nombre };
      ['apellidos', 'telefono', 'email', 'notas'].forEach(function (k) { if (mapa[k] !== undefined) c[k] = String(f[mapa[k]] || '').trim(); });
      // «Apellidos, Nombre» en una sola celda
      if (!c.apellidos && nombre.indexOf(',') > 0) { var p = nombre.split(','); c.nombre = p[1].trim(); c.apellidos = p[0].trim(); }
      out.push(c);
    }
    return { clientes: out, avisos: avisos, columnas: Object.keys(mapa) };
  }

  function descargar(wb, nombre) { XLSX.writeFile(wb, nombre); }
  function hoja(datos, cabeceras) { var ws = XLSX.utils.json_to_sheet(datos, { header: cabeceras }); ws['!cols'] = cabeceras.map(function (h) { return { wch: Math.max(12, h.length + 4) }; }); return ws; }

  function plantillaClientes() {
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, hoja([
      { Nombre: 'Salva', Apellidos: 'García', Teléfono: '600 000 000', Email: '', Notas: 'Prefiere empezar por pierna' },
      { Nombre: 'Pablo y Maribel', Apellidos: '', Teléfono: '', Email: '', Notas: 'Pareja, misma sesión' }
    ], ['Nombre', 'Apellidos', 'Teléfono', 'Email', 'Notas']), 'Clientes');
    descargar(wb, 'plantilla-clientes.xlsx');
  }

  function exportarClientes(clientes) {
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, hoja(clientes.map(function (c) { return { Nombre: c.nombre, Apellidos: c.apellidos, 'Teléfono': c.telefono, Email: c.email, Notas: c.notas, Estado: c.activo ? 'Activo' : 'Baja', Alta: (c.alta_en || '').slice(0, 10), Baja: (c.baja_en || '').slice(0, 10) }; }), ['Nombre', 'Apellidos', 'Teléfono', 'Email', 'Notas', 'Estado', 'Alta', 'Baja']), 'Clientes');
    descargar(wb, 'clientes-' + new Date().toISOString().slice(0, 10) + '.xlsx');
  }

  function exportarTodo(d) {
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, hoja(d.clientes.map(function (c) { return { Nombre: c.nombre, Apellidos: c.apellidos, 'Teléfono': c.telefono, Email: c.email, Notas: c.notas, Estado: c.activo ? 'Activo' : 'Baja', Alta: (c.alta_en || '').slice(0, 10) }; }), ['Nombre', 'Apellidos', 'Teléfono', 'Email', 'Notas', 'Estado', 'Alta']), 'Clientes');
    var filas = [];
    d.sesiones.forEach(function (s) {
      var quien = s.cliente ? (s.cliente.nombre + (s.cliente.apellidos ? ' ' + s.cliente.apellidos : '')) : '';
      (s.items || []).sort(function (a, b) { return a.orden - b.orden; }).forEach(function (it) {
        filas.push({ Fecha: s.fecha, Cliente: quien, 'Día': s.dia || '', Orden: it.orden + 1, Ejercicio: it.nombre, Grupo: it.grupo, Series: it.series, Kilos: it.kilos, Hecho: it.hecho ? 'Sí' : '', Notas: it.notas, 'Final de sesión': s.final, Estado: s.estado });
      });
      if (!(s.items || []).length) filas.push({ Fecha: s.fecha, Cliente: quien, 'Día': s.dia || '', Orden: '', Ejercicio: '(sin ejercicios)', Grupo: '', Series: '', Kilos: '', Hecho: '', Notas: s.notas, 'Final de sesión': s.final, Estado: s.estado });
    });
    XLSX.utils.book_append_sheet(wb, hoja(filas, ['Fecha', 'Cliente', 'Día', 'Orden', 'Ejercicio', 'Grupo', 'Series', 'Kilos', 'Hecho', 'Notas', 'Final de sesión', 'Estado']), 'Sesiones');
    XLSX.utils.book_append_sheet(wb, hoja(d.ejercicios.map(function (e) { return { Ejercicio: e.nombre, Grupo: e.grupo, Material: e.equipo }; }), ['Ejercicio', 'Grupo', 'Material']), 'Ejercicios propios');
    descargar(wb, 'la-pizarra-' + new Date().toISOString().slice(0, 10) + '.xlsx');
  }

  return { leer: leer, mapearClientes: mapearClientes, plantillaClientes: plantillaClientes, exportarClientes: exportarClientes, exportarTodo: exportarTodo };
})();
