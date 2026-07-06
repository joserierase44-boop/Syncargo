/* === SYNCARGO CORE JS === */
const API = 'http://localhost:3000/api';

// Auth helpers
const auth = {
  token: () => localStorage.getItem('syncargo_token'),
  usuario: () => JSON.parse(localStorage.getItem('syncargo_usuario') || 'null'),
  guardar: (token, usuario) => {
    localStorage.setItem('syncargo_token', token);
    localStorage.setItem('syncargo_usuario', JSON.stringify(usuario));
  },
  limpiar: () => {
    localStorage.removeItem('syncargo_token');
    localStorage.removeItem('syncargo_usuario');
  },
  requerirAuth: () => {
    if (!auth.token()) { window.location.href = '/'; return false; }
    return true;
  }
};

// HTTP client
const http = {
  headers: () => ({
    'Content-Type': 'application/json',
    ...(auth.token() ? { 'Authorization': `Bearer ${auth.token()}` } : {})
  }),
  get: (url) => fetch(`${API}${url}`, { headers: http.headers() }).then(r => r.json()),
  post: (url, body) => fetch(`${API}${url}`, { method: 'POST', headers: http.headers(), body: JSON.stringify(body) }).then(r => r.json()),
  put: (url, body) => fetch(`${API}${url}`, { method: 'PUT', headers: http.headers(), body: JSON.stringify(body) }).then(r => r.json()),
  delete: (url) => fetch(`${API}${url}`, { method: 'DELETE', headers: http.headers() }).then(r => r.json())
};

// Toast notifications
const toast = {
  show: (msg, tipo = 'default', dur = 3500) => {
    let c = document.getElementById('toast-container');
    if (!c) { c = document.createElement('div'); c.id = 'toast-container'; document.body.appendChild(c); }
    const t = document.createElement('div');
    t.className = `toast ${tipo}`;
    t.innerHTML = `<span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => t.remove(), dur);
  },
  success: (msg) => toast.show('✓ ' + msg, 'success'),
  error: (msg)   => toast.show('✕ ' + msg, 'error'),
  info: (msg)    => toast.show('ℹ ' + msg, 'default'),
  warning: (msg) => toast.show('⚠ ' + msg, 'warning')
};

// Modal helpers
const modal = {
  open: (id) => document.getElementById(id)?.classList.remove('hidden'),
  close: (id) => document.getElementById(id)?.classList.add('hidden'),
  closeOnOverlay: (id) => {
    const el = document.getElementById(id);
    el?.addEventListener('click', (e) => { if (e.target === el) modal.close(id); });
  }
};

// Estado badges
const ESTADO_LABELS = {
  programada: 'Programada', confirmada: 'Confirmada', en_ruta: 'En ruta',
  llego_local: 'Llegó al local', descargando: 'Descargando',
  completada: 'Completada', cancelada: 'Cancelada',
  pendiente: 'Pendiente', rechazada: 'Rechazada',
  disponible: 'Disponible', reservada: 'Reservada', bloqueada: 'Bloqueada'
};

const estadoBadge = (estado) =>
  `<span class="badge estado-${estado}">${ESTADO_LABELS[estado] || estado}</span>`;

// Formateo de fechas/horas
const fmt = {
  fecha: (d) => d ? new Date(d).toLocaleDateString('es-EC', {day:'2-digit',month:'2-digit',year:'numeric'}) : '-',
  hora: (h) => h ? h.substring(0,5) : '-',
  datetime: (d) => d ? new Date(d).toLocaleString('es-EC') : '-',
  tiempoTranscurrido: (d) => {
    if (!d) return '-';
    const mins = Math.floor((Date.now() - new Date(d)) / 60000);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins/60)}h ${mins%60}m`;
  }
};

// Sidebar activo
const setNavActivo = (id) => {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
};

// Cargar datos de usuario en sidebar
const inicializarSidebar = () => {
  const u = auth.usuario();
  if (!u) return;
  const el = document.getElementById('sidebar-user');
  if (el) {
    const iniciales = u.nombre.split(' ').map(p=>p[0]).join('').substring(0,2).toUpperCase();
    el.innerHTML = `
      <div class="user-avatar">${iniciales}</div>
      <div style="flex:1;min-width:0">
        <div class="user-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.nombre}</div>
        <div class="user-role-badge">${u.rol}</div>
      </div>
      <button class="btn-logout" onclick="cerrarSesion()" title="Cerrar sesión">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button>`;
  }
};

const cerrarSesion = () => {
  auth.limpiar();
  window.location.href = '/';
};

// Confirmar acción
const confirmar = (msg) => confirm(msg);

// Paginación simple
const paginar = (items, pagina, porPagina = 10) => {
  const inicio = (pagina - 1) * porPagina;
  return { items: items.slice(inicio, inicio + porPagina), total: items.length, paginas: Math.ceil(items.length / porPagina) };
};

// Loading state en botones
const btnLoading = (btn, loading, textoOriginal) => {
  if (loading) { btn.disabled = true; btn.innerHTML = '<span>Cargando...</span>'; }
  else { btn.disabled = false; btn.innerHTML = textoOriginal; }
};

// Debounce
const debounce = (fn, delay = 300) => {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
};

// Socket.io helper (se inicializa en cada portal si se importa socket.io)
let socket = null;
const conectarWS = () => {
  if (typeof io !== 'undefined' && auth.token()) {
    socket = io('http://localhost:3000');
    const u = auth.usuario();
    if (u) socket.emit('join_room', `user_${u.id}`);
    socket.on('nueva_notificacion', (notif) => {
      toast.info(notif.titulo);
      const badge = document.getElementById('notif-badge');
      if (badge) { badge.textContent = parseInt(badge.textContent||0) + 1; badge.classList.remove('hidden'); }
    });
    socket.on('estado_entrega_actualizado', (data) => {
      console.log('[WS] Estado entrega actualizado:', data);
      if (typeof onEntregaActualizada === 'function') onEntregaActualizada(data);
    });
  }
};

// Icons SVG inline (comunes)
const icons = {
  home: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  users: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  store: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><rect x="9" y="12" width="6" height="10"/></svg>`,
  calendar: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  truck: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
  chart: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
  clock: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  bell: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  search: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  list: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  alert: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  history: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>`,
  settings: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  map: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
  plus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
  x: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  location: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
};
