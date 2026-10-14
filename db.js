// Acceso a la base del gimnasio (Supabase). Todo lo que toca datos pasa por aquí.
window.DB = (function () {
  'use strict';
  var cfg = window.PIZARRA_CONFIG;
  var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { realtime: { params: { eventsPerSecond: 5 } } });
  function must(r) { if (r.error) { console.error(r.error); throw new Error(r.error.message || 'Error de la base'); } return r.data; }
  function hoyISO() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  return {
    sb: sb,
    hoyISO: hoyISO,

    // ---- configuración del gimnasio ----
    getConfig: async function () { var d = must(await sb.from('config').select('clave,valor')); var o = {}; d.forEach(function (r) { o[r.clave] = r.valor; }); return o; },
    setConfig: async function (clave, valor) { must(await sb.from('config').upsert({ clave: clave, valor: valor, actualizado_en: new Date().toISOString() })); },

    // ---- clientes ----
    clientes: async function (opts) {
      opts = opts || {};
      var q = sb.from('clientes').select('*').order('nombre').order('apellidos');
      if (!opts.incluirBajas) q = q.eq('activo', true);
      return must(await q);
    },
    cliente: async function (id) { return must(await sb.from('clientes').select('*').eq('id', id).single()); },
    crearCliente: async function (c) { return must(await sb.from('clientes').insert(c).select().single()); },
    crearClientes: async function (arr) {
      var out = [];
      for (var i = 0; i < arr.length; i += 200) out = out.concat(must(await sb.from('clientes').insert(arr.slice(i, i + 200)).select('id,nombre,apellidos')));
      return out;
    },
    actualizarCliente: async function (id, patch) { must(await sb.from('clientes').update(patch).eq('id', id)); },
    darDeBaja: async function (id) { must(await sb.from('clientes').update({ activo: false, baja_en: new Date().toISOString() }).eq('id', id)); },
    reactivar: async function (id) { must(await sb.from('clientes').update({ activo: true, baja_en: null }).eq('id', id)); },

    // ---- ejercicios ----
    ejercicios: async function () {
      var out = [], from = 0;
      while (true) {
        var d = must(await sb.from('ejercicios').select('id,nombre,grupo,equipo,origen,imagen,activo').eq('activo', true).order('nombre').range(from, from + 999));
        out = out.concat(d); if (d.length < 1000) break; from += 1000;
      }
      return out;
    },
    crearEjercicio: async function (e) { return must(await sb.from('ejercicios').insert(e).select().single()); },
    actualizarEjercicio: async function (id, patch) { must(await sb.from('ejercicios').update(patch).eq('id', id)); },

    // ---- sesiones del tablero ----
    sesionesDelDia: async function (fecha) {
      var d = must(await sb.from('sesiones').select('*, cliente:clientes(id,nombre,apellidos,activo), items:sesion_ejercicios(*)').eq('fecha', fecha).order('orden').order('creado_en'));
      d.forEach(function (s) { s.items = (s.items || []).sort(function (a, b) { return a.orden - b.orden || (a.creado_en < b.creado_en ? -1 : 1); }); });
      return d;
    },
    sesion: async function (id) {
      var d = must(await sb.from('sesiones').select('*, cliente:clientes(id,nombre,apellidos,activo), items:sesion_ejercicios(*)').eq('id', id).maybeSingle());
      if (d) d.items = (d.items || []).sort(function (a, b) { return a.orden - b.orden || (a.creado_en < b.creado_en ? -1 : 1); });
      return d;
    },
    // La página del cliente llega con los 8 primeros caracteres del id de su sesión (lo que cabe en el QR).
    sesionPorPrefijo: async function (fecha, prefijo) {
      var d = await this.sesionesDelDia(fecha);
      return d.filter(function (s) { return s.id.indexOf(prefijo) === 0; })[0] || null;
    },
    sesionesCliente: async function (clienteId, limit) {
      var d = must(await sb.from('sesiones').select('*, items:sesion_ejercicios(*)').eq('cliente_id', clienteId).order('fecha', { ascending: false }).order('creado_en', { ascending: false }).limit(limit || 40));
      d.forEach(function (s) { s.items = (s.items || []).sort(function (a, b) { return a.orden - b.orden; }); });
      return d;
    },
    sesionesEntre: async function (clienteIds, desde, hasta) {
      if (!clienteIds.length) return [];
      return must(await sb.from('sesiones').select('id,cliente_id,fecha,dia,estado').in('cliente_id', clienteIds).gte('fecha', desde).lte('fecha', hasta));
    },
    ultimasSesionesPorCliente: async function (desde) {
      // Para la lista de clientes: sesiones recientes, se reduce en el navegador.
      return must(await sb.from('sesiones').select('cliente_id,fecha,dia').gte('fecha', desde).order('fecha', { ascending: false }).limit(5000));
    },
    ultimosItems: async function (clienteIds, antesDe) {
      if (!clienteIds.length) return [];
      return must(await sb.from('sesion_ejercicios').select('nombre,series,kilos,grupo,sesiones!inner(cliente_id,fecha)').in('sesiones.cliente_id', clienteIds).lt('sesiones.fecha', antesDe).order('creado_en', { ascending: false }).limit(2000));
    },
    crearSesion: async function (s) { return must(await sb.from('sesiones').insert(s).select('*, cliente:clientes(id,nombre,apellidos,activo), items:sesion_ejercicios(*)').single()); },
    actualizarSesion: async function (id, patch) { must(await sb.from('sesiones').update(patch).eq('id', id)); },
    borrarSesion: async function (id) { must(await sb.from('sesiones').delete().eq('id', id)); },
    crearItems: async function (arr) { if (!arr.length) return []; return must(await sb.from('sesion_ejercicios').insert(arr).select()); },
    actualizarItem: async function (id, patch) { must(await sb.from('sesion_ejercicios').update(patch).eq('id', id)); },
    borrarItem: async function (id) { must(await sb.from('sesion_ejercicios').delete().eq('id', id)); },
    reordenarItems: async function (pares) { // [{id, orden}]
      for (var i = 0; i < pares.length; i++) must(await sb.from('sesion_ejercicios').update({ orden: pares[i].orden }).eq('id', pares[i].id));
    },

    // ---- observaciones ----
    observaciones: async function (clienteId, limit) { return must(await sb.from('observaciones').select('*').eq('cliente_id', clienteId).order('fecha', { ascending: false }).order('creado_en', { ascending: false }).limit(limit || 20)); },
    crearObservacion: async function (o) { return must(await sb.from('observaciones').insert(o).select().single()); },
    borrarObservacion: async function (id) { must(await sb.from('observaciones').delete().eq('id', id)); },

    // ---- exportación ----
    todoParaExcel: async function () {
      var clientes = must(await sb.from('clientes').select('*').order('nombre'));
      var sesiones = [], from = 0;
      while (true) {
        var d = must(await sb.from('sesiones').select('id,fecha,dia,estado,final,notas,cliente:clientes(nombre,apellidos),items:sesion_ejercicios(nombre,grupo,series,kilos,notas,orden,hecho)').order('fecha', { ascending: false }).range(from, from + 999));
        sesiones = sesiones.concat(d); if (d.length < 1000) break; from += 1000;
      }
      var ejercicios = must(await sb.from('ejercicios').select('nombre,grupo,equipo,origen,activo').eq('origen', 'propio').order('nombre'));
      return { clientes: clientes, sesiones: sesiones, ejercicios: ejercicios };
    },

    // ---- tiempo real ----
    suscribir: function (nombre, cb) {
      var ch = sb.channel(nombre + '-' + Math.random().toString(36).slice(2, 8))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sesiones' }, cb)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sesion_ejercicios' }, cb)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'config' }, cb)
        .subscribe();
      return function () { sb.removeChannel(ch); };
    }
  };
})();
