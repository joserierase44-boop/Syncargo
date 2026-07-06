// ── API Client Syncargo ────────────────────────────────────
const API_BASE = 'http://localhost:3000/api';

const PORTALES = {
  admin: '/admin/index.html',
  local: '/local/index.html',
  distribuidor: '/distribuidor/index.html',
  transportista: '/transportista/index.html'
};

const ESTADO_LABELS = {
  programada: 'Programada', confirmada: 'Confirmada', en_ruta: 'En ruta',
  llego_local: 'Llegó al local', descargando: 'Descargando', completada: 'Completada',
  cancelada: 'Cancelada', pendiente: 'Pendiente', rechazada: 'Rechazada',
  disponible: 'Disponible', reservada: 'Reservada', bloqueada: 'Bloqueada'
};

const api = {
  getToken: () => localStorage.getItem('syncargo_token'),
  getUser:  () => { try { return JSON.parse(localStorage.getItem('syncargo_user') || 'null'); } catch(e) { return null; } },
  setAuth:  (token, user) => {
    localStorage.setItem('syncargo_token', token);
    localStorage.setItem('syncargo_user', JSON.stringify(user));
  },
  clearAuth: () => {
    localStorage.removeItem('syncargo_token');
    localStorage.removeItem('syncargo_user');
  },

  request: async (method, path, body = null) => {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    const token = api.getToken();
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body) opts.body = JSON.stringify(body);
    try {
      const res = await fetch(`${API_BASE}${path}`, opts);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
      return data;
    } catch(err) {
      if (err.message.includes('Failed to fetch')) throw new Error('No se puede conectar con el servidor. Verifica que el backend esté corriendo.');
      throw err;
    }
  },

  get:    (path)       => api.request('GET',    path),
  post:   (path, body) => api.request('POST',   path, body),
  put:    (path, body) => api.request('PUT',    path, body),
  delete: (path)       => api.request('DELETE', path),

  login:  (email, password) => api.post('/auth/login', { email, password }),
  perfil: ()                => api.get('/auth/perfil'),
  dashboard: (rol)          => api.get(`/dashboard/${rol}`),

  usuarios: {
    listar: (q='')    => api.get(`/usuarios${q}`),
    crear: (d)        => api.post('/usuarios', d),
    actualizar: (id,d)=> api.put(`/usuarios/${id}`, d),
    eliminar: (id)    => api.delete(`/usuarios/${id}`)
  },

  locales: {
    listar: ()        => api.get('/locales'),
    miLocal: ()       => api.get('/locales/mi-local'),
    crear: (d)        => api.post('/locales', d),
    actualizar:(id,d) => api.put(`/locales/${id}`, d)
  },

  ventanas: {
    disponibles: (p='') => api.get(`/ventanas/disponibles${p}`),
    miLocal: (f='')     => api.get(`/ventanas/mi-local${f ? '?fecha='+f : ''}`),
    crear: (d)          => api.post('/ventanas', d),
    bloquear: (id)      => api.put(`/ventanas/${id}/bloquear`),
    eliminar: (id)      => api.delete(`/ventanas/${id}`)
  },

  reservas: {
    mias: ()           => api.get('/reservas/mias'),
    crear: (d)         => api.post('/reservas', d),
    responder: (id, d) => api.put(`/reservas/${id}/responder`, d),
    cancelar: (id)     => api.put(`/reservas/${id}/cancelar`)
  },

  entregas: {
    todas: (q='')          => api.get(`/entregas${q}`),
    misEntregas: (q='')    => api.get(`/entregas/mis-entregas${q}`),
    obtener: (id)          => api.get(`/entregas/${id}`),
    asignar: (id, tid)     => api.put(`/entregas/${id}/asignar`, { transportista_id: tid }),
    actualizarEstado:(id,e)=> api.put(`/entregas/${id}/estado`, { estado: e })
  },

  incidencias: {
    crear: (d)    => api.post('/incidencias', d),
    listar: (eid) => api.get(`/incidencias?entrega_id=${eid}`)
  }
};

// ── Auth guard ─────────────────────────────────────────────
function requireAuth(rolRequerido) {
  const user  = api.getUser();
  const token = api.getToken();
  if (!token || !user) {
    window.location.href = '/login.html';
    return null;
  }
  if (rolRequerido && user.rol !== rolRequerido) {
    api.clearAuth();
    window.location.href = '/login.html';
    return null;
  }
  return user;
}

// ── Logout universal ───────────────────────────────────────
function logout() {
  api.clearAuth();
  window.location.href = '/login.html';
}

// ── Obtener iniciales para avatar ──────────────────────────
function getInitials(nombre) {
  if (!nombre) return '?';
  return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ── Toast notifications ────────────────────────────────────
function showToast(titulo, mensaje = '', tipo = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  const icons = { success: 'ti-circle-check', danger: 'ti-alert-circle', warning: 'ti-alert-triangle', info: 'ti-info-circle' };
  toast.innerHTML = `
    <i class="ti ${icons[tipo] || 'ti-info-circle'}" style="font-size:18px;margin-top:1px;flex-shrink:0"></i>
    <div style="flex:1"><div class="toast-title">${titulo}</div>${mensaje ? `<div class="toast-msg">${mensaje}</div>` : ''}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all .3s';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ── Badge helper ───────────────────────────────────────────
function badge(estado) {
  return `<span class="badge badge-${estado}">${ESTADO_LABELS[estado] || estado}</span>`;
}

function formatFecha(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('es-EC', { day:'2-digit', month:'short', year:'numeric' });
}

function formatHora(str) {
  if (!str) return '—';
  return new Date(str).toLocaleTimeString('es-EC', { hour:'2-digit', minute:'2-digit' });
}
