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

  // Auth endpoints
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
  // Admin endpoints
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
      body:  userData  // Cualquier campo que quieras actualizar
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
}

export const apiService = new ApiService();
export { ApiError };