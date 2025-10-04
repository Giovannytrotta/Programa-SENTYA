// services/api.js
const API_BASE_URL = 'http://localhost:3001';

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Para las cookies JWT
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      console.log(`🚀 Request: ${config.method || 'GET'} ${url}`);
      const response = await fetch(url, config);
      
      if (response.status === 204) {
        return null;
      }

      const data = await response.json().catch(() => null);
      
      // NO lanzar error si es 401 con datos de 2FA
      if (response.status === 401 && data?.msg) {
        if (data.requires_2fa_setup || data.requires_2fa) {
          // Lanzar error especial con los datos
          throw new ApiError(
            data.message || 'Autenticación requerida',
            401,
            data // Pasar todos los datos
          );
        }
      }
      
      if (!response.ok) {
        throw new ApiError(
          data?.message || data?.msg || `Error HTTP: ${response.status}`,
          response.status,
          data
        );
      }

      console.log(`✅ Success: ${url}`, data);
      return data;
      
    } catch (error) {
      if (error instanceof ApiError) {
        console.log(`❌ API Error: ${error.message}`, error);
        throw error;
      }
      
      console.log(`💥 Network Error: ${url}`, error);
      throw new ApiError('Error de conexión. Verifica tu conexión a internet.', 0);
    }
  }

  // ============================================
  // ADMIN AUTH ENDPOINTS (existentes, sin cambios)
  // ============================================
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: credentials
    });
  }

  async loginWith2FA(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: credentials
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST'
    });
  }

  async setup2FA() {
    return this.request('/auth/2fa/setup', {
      method: 'GET'
    });
  }

  async verify2FASetup(token) {
    return this.request('/auth/2fa/verify-setup', {
      method: 'POST',
      body: { token }
    });
  }

  async request2faReset(email) {
    return this.request('/auth/2fa/request-reset', {
      method: 'POST',
      body: { email }
    });
  }

  async confirm2faReset(token) {
    return this.request('/auth/2fa/confirm-reset', {
      method: 'POST',
      body: { token }
    });
  }

  // ============================================
  // 🆕 USER AUTH ENDPOINTS (nuevos)
  // ============================================
  
  /**
   * Login para usuarios regulares (clientes, profesionales, etc.)
   * Usa el endpoint /user/login que es más simple (sin 2FA)
   */
  async loginUser(credentials) {
    return this.request('/user/login', {
      method: 'POST',
      body: credentials
    });
  }

  /**
   * Obtener información del usuario actual (tanto admin como user)
   * NOTA: Usando /user/me que funciona para ambos contextos
   */
  async getCurrentUser() {
    return this.request('/user/me', {
      method: 'GET'
    });
  }

  // ============================================
  // ADMIN ENDPOINTS (existentes, sin cambios)
  // ============================================
  async getAllUsers(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    const queryString = params.toString();
    const endpoint = queryString ? `/auth/admin/users?${queryString}` : '/auth/admin/users';
    
    return this.request(endpoint, {
      method: 'GET'
    });
  }

  async createUser(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: userData
    });
  }

  async updateUser(userId, userData) {
    return this.request(`/auth/admin/users/${userId}`, {
      method: 'PUT',
      body:  userData
    });
  }

  async updateUserStatus(userId, isActive) {
    return this.request(`/auth/admin/users/${userId}/status`, {
      method: 'PUT',
      body: { is_active: isActive }
    });
  }

  async updateUserRole(userId, role) {
    return this.request(`/auth/admin/users/${userId}/role`, {
      method: 'PUT',
      body: { role } 
    });
  }

  async deleteUser(userId, force = false) {
    const endpoint = force ? 
      `/auth/admin/users/${userId}?force=true` : 
      `/auth/admin/users/${userId}`;
      
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }

  async getRoles() {
    return this.request('/auth/roles', {
      method: 'GET'
    });
  }
  //Nuevo centro de servicios sociales aca vienen los inyectados en la base de datos
  async getActiveCSSCenters() {
    return this.request('/auth/admin/css', {
        method: 'GET'
    });
}
//Para actualizacion
async updateUserCSS(userId, cssId) {
    return this.request(`/auth/admin/user/${userId}/css`, {
        method: 'PUT',
        body: JSON.stringify({ css_id: parseInt(cssId) })
    });
}

async getAllWorkshops(filters = {}) {
  const params = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key]) {
      params.append(key, filters[key]);
    }
  });
  
  const queryString = params.toString();
  const endpoint = queryString ? `/workshops/?${queryString}` : '/workshops/';
  
  return this.request(endpoint, {
    method: 'GET'
  });
}

/**
 * Crear nuevo taller (solo admin/coordinator)
 */
async createWorkshop(workshopData) {
  return this.request('/workshops/', {
    method: 'POST',
    body: workshopData
  });
}

/**
 * Obtener detalle de un taller
 */
async getWorkshopDetails(workshopId) {
  return this.request(`/workshops/${workshopId}`, {
    method: 'GET'
  });
}

/**
 * Actualizar taller (solo admin/coordinator)
 */
async updateWorkshop(workshopId, workshopData) {
  return this.request(`/workshops/${workshopId}`, {
    method: 'PUT',
    body: workshopData
  });
}

/**
 * Eliminar taller (solo admin/coordinator)
 */
async deleteWorkshop(workshopId) {
  return this.request(`/workshops/${workshopId}`, {
    method: 'DELETE'
  });
}

/**
 * Obtener todas las áreas temáticas activas
 */
async getThematicAreas() {
  return this.request('/thematic-areas/', {
    method: 'GET'
  });
}

/**
 * Obtener lista de profesionales activos (para select en talleres)
 */
async getProfessionals() {
  return this.request('/user/professionals', {
    method: 'GET'
  });
}

// ============================================
// SESSIONS
// ============================================

/**
 * Crear nueva sesión/clase de un taller
 */

async createSession(sessionData) {
  return this.request('/sessions', {
    method: 'POST',
    body: sessionData
  });
}

/**
 * Obtener todas las sesiones de un taller específico
 */

async getWorkshopSessions(workshopId) {
  return this.request(`/sessions/workshop/${workshopId}`, {
    method: 'GET'
  });
}

/**
 * Obtener detalle de una sesión específica
 */
async getSessionDetails(sessionId) {
  return this.request(`/sessions/${sessionId}`, {
    method: 'GET'
  });
}

/* Actualizar una sesión*/

async updateSession(sessionId, sessionData) {
  return this.request(`/sessions/${sessionId}`, {
    method: 'PUT',
    body: sessionData
  });
}

/**
 * Eliminar una sesión
 */
async deleteSession(sessionId) {
  return this.request(`/sessions/${sessionId}`, {
    method: 'DELETE'
  });
}

/**
 * Marcar sesión como completada
 */
async completeSession(sessionId) {
  return this.request(`/sessions/${sessionId}/complete`, {
    method: 'POST'
  });
}

/**
 * Cancelar sesión con razón
 */
async cancelSession(sessionId, reason) {
  return this.request(`/sessions/${sessionId}/cancel`, {
    method: 'POST',
    body: { reason }
  });
}

/**
 * Obtener mis sesiones (para profesionales)
 */
async getMySessions() {
  return this.request('/sessions/my-sessions', {
    method: 'GET'
  });
}

// ============================================
// WORKSHOP USERS (INSCRIPCIONES) 
// ============================================

/**
 * Inscribir un usuario a un taller
 */
async enrollUserToWorkshop(enrollmentData) {
  return this.request('/workshop-users/enroll', {
    method: 'POST',
    body: enrollmentData
  });
}

/**
 * Desinscribir un usuario de un taller
 */
async unenrollUserFromWorkshop(enrollmentId, reason) {
  return this.request(`/workshop-users/${enrollmentId}`, {
    method: 'DELETE',
    body: { reason }
  });
}

/**
 * Obtener estudiantes inscritos en un taller
 */
async getWorkshopStudents(workshopId) {
  return this.request(`/workshop-users/workshop/${workshopId}/students`, {
    method: 'GET'
  });
}

/**
 * Obtener talleres de un usuario
 */
async getUserWorkshops(userId) {
  return this.request(`/workshop-users/user/${userId}/workshops`, {
    method: 'GET'
  });
}

/**
 * Obtener lista de espera de un taller
 */
async getWorkshopWaitlist(workshopId) {
  return this.request(`/workshop-users/workshop/${workshopId}/waitlist`, {
    method: 'GET'
  });
}


}





export const apiService = new ApiService();
export { ApiError };