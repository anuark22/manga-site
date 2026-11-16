/**
 * MangaSite API Client
 * Servicio centralizado para consumir la API de ASP.NET Core
 */

const API_BASE = '/api';

/**
 * Obtiene el token JWT del almacenamiento local
 */
export const getToken = () => localStorage.getItem('mangasite_token');

/**
 * Guarda el token y datos del usuario
 */
export const setAuthData = (token, user) => {
  if (token) localStorage.setItem('mangasite_token', token);
  if (user) localStorage.setItem('mangasite_user', JSON.stringify(user));
};

/**
 * Elimina la sesión del usuario
 */
export const clearAuthData = () => {
  localStorage.removeItem('mangasite_token');
  localStorage.removeItem('mangasite_user');
};

/**
 * Obtiene el usuario autenticado guardado
 */
export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('mangasite_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Wrapper genérico para peticiones HTTP
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    let data = null;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMsg = (data && (data.errorDescription || data.message || data.title)) 
        || `Error ${response.status}: ${response.statusText}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err);
    throw err;
  }
}

// ==========================================
// MANGAS API
// ==========================================
export const mangasApi = {
  /**
   * Obtiene todos los mangas con filtros opcionales
   */
  async getMangas(params = {}) {
    const query = new URLSearchParams();
    if (params.mangaId) query.append('mangaId', params.mangaId);
    if (params.mangaTittle) query.append('mangaTittle', params.mangaTittle);
    if (params.mangaTypeId) query.append('mangaTypeId', params.mangaTypeId);
    if (params.demographyId) query.append('demographyId', params.demographyId);
    if (params.status) query.append('status', params.status);
    if (params.isAmateur !== undefined && params.isAmateur !== '') query.append('isAmateur', params.isAmateur);
    if (params.isErotic !== undefined && params.isErotic !== '') query.append('isErotic', params.isErotic);
    if (params.isFeatured !== undefined && params.isFeatured !== '') query.append('isFeatured', params.isFeatured);

    const queryString = query.toString();
    const res = await request(`/Mangas/GetMangas${queryString ? `?${queryString}` : ''}`);
    return res.items || [];
  },

  /**
   * Obtiene los mangas más populares
   */
  async getPopular(top = 10) {
    const res = await request(`/Mangas/GetPopularMangas?top=${top}`);
    return res.items || [];
  },

  /**
   * Obtiene el detalle completo de un manga por ID
   */
  async getDetail(mangaId) {
    const res = await request(`/Mangas/GetMangaDetail?mangaId=${mangaId}`);
    return (res.items && res.items[0]) || null;
  },

  async createManga(formData) {
    const res = await request('/Mangas/CreateManga', {
      method: 'POST',
      body: formData
    });
    return res;
  },

  async updateManga(formData) {
    const res = await request('/Mangas/UpdateManga', {
      method: 'PUT',
      body: formData
    });
    return res;
  },

  async deleteManga(mangaId) {
    const res = await request(`/Mangas/DeleteManga?mangaId=${mangaId}`, {
      method: 'DELETE'
    });
    return res;
  }
};

// ==========================================
// CAPÍTULOS API
// ==========================================
export const chaptersApi = {
  async getByManga(mangaId) {
    const res = await request(`/MangaChapters/GetMangaChapters?mangaId=${mangaId}`);
    return res.items || [];
  },
  async getById(chapterId) {
    const res = await request(`/MangaChapters/GetMangaChapters?chapterId=${chapterId}`);
    return (res.items && res.items[0]) || null;
  },
  async getPages(chapterId) {
    const res = await request(`/MangaChapters/GetChapterPages?chapterId=${chapterId}`);
    return res.items || [];
  },
  async createChapter(formData) {
    const res = await request('/MangaChapters/CreateMangaChapter', {
      method: 'POST',
      body: formData
    });
    return res;
  },
  async updateChapter(formData) {
    const res = await request('/MangaChapters/UpdateMangaChapter', {
      method: 'PUT',
      body: formData
    });
    return res;
  },
  async deleteChapter(chapterId) {
    const res = await request(`/MangaChapters/DeleteMangaChapter?chapterId=${chapterId}`, {
      method: 'DELETE'
    });
    return res;
  }
};

/**
 * Normaliza la URL de una página/imagen para pasar a través del proxy de Vite si es localhost
 */
export const normalizePageUrl = (url) => {
  if (!url) return '';
  return url.replace(/^https?:\/\/localhost:\d+/i, '');
};

// ==========================================
// NOTICIAS API
// ==========================================
export const noticesApi = {
  async getNotices(isActive = true) {
    const res = await request(`/Notices/GetNotices?isActive=${isActive}`);
    return res.items || [];
  }
};

// ==========================================
// FORO API
// ==========================================
export const forumApi = {
  /**
   * Obtiene las publicaciones del foro con filtros
   */
  async getPosts(params = {}) {
    const query = new URLSearchParams();
    if (params.postId) query.append('postId', params.postId);
    if (params.topic) query.append('topic', params.topic);
    if (params.subTopic) query.append('subTopic', params.subTopic);
    if (params.sortBy) query.append('sortBy', params.sortBy);

    const queryString = query.toString();
    const res = await request(`/Forum/GetPosts${queryString ? `?${queryString}` : ''}`);
    return res.items || [];
  },

  /**
   * Crea una nueva discusión en el foro (Requiere autenticación)
   */
  async createPost({ title, content, topic, subTopic }) {
    const res = await request('/Forum/CreatePost', {
      method: 'POST',
      body: JSON.stringify({
        title,
        content: content || 'Discusión de la comunidad',
        topic,
        subTopic
      })
    });
    return res;
  },

  /**
   * Incrementa las visualizaciones de un post
   */
  async incrementViews(postId) {
    try {
      return await request(`/Forum/IncrementViews?postId=${postId}`, { method: 'POST' });
    } catch {
      // Ignorar error si no es crítico
      return null;
    }
  },

  /**
   * Obtiene comentarios de un post
   */
  async getComments(postId) {
    const res = await request(`/Forum/GetComments?postId=${postId}`);
    return res.items || [];
  },

  /**
   * Agrega un comentario a un post (Requiere autenticación)
   */
  async addComment({ postId, content }) {
    return await request('/Forum/AddComment', {
      method: 'POST',
      body: JSON.stringify({ postId, content })
    });
  }
};

// ==========================================
// FILTROS (Tipos, Demografía, Géneros)
// ==========================================
export const filtersApi = {
  async getGenres() {
    const res = await request('/Genres/GetGenres');
    return res.items || [];
  },

  async getDemographics() {
    const res = await request('/Demographics/GetDemographics');
    return res.items || [];
  },

  async getMangasType() {
    const res = await request('/MangasType/GetMangasType');
    return res.items || [];
  },

  async getMangaGenres(params = {}) {
    const query = new URLSearchParams();
    if (params.genreId) query.append('genreId', params.genreId);
    if (params.mangaId) query.append('mangaId', params.mangaId);
    const queryString = query.toString();
    const res = await request(`/MangaGenres/GetMangaGenres${queryString ? `?${queryString}` : ''}`);
    return res.items || [];
  }
};

// ==========================================
// GÉNEROS API (CRUD)
// ==========================================
export const genresApi = {
  async getGenres(params = {}) {
    const query = new URLSearchParams();
    if (params.genreId) query.append('genreId', params.genreId);
    if (params.genreName) query.append('genreName', params.genreName);
    const qs = query.toString();
    const res = await request(`/Genres/GetGenres${qs ? `?${qs}` : ''}`);
    return res.items || [];
  },
  async createGenre(formData) {
    const res = await request('/Genres/CreateGenre', {
      method: 'POST',
      body: formData
    });
    return res;
  },
  async updateGenre(formData) {
    const res = await request('/Genres/UpdateGenre', {
      method: 'PUT',
      body: formData
    });
    return res;
  },
  async deleteGenre(genreId) {
    const res = await request(`/Genres/DeleteGenre?genreId=${genreId}`, {
      method: 'DELETE'
    });
    return res;
  }
};

// ==========================================
// GRUPOS SCAN API
// ==========================================
export const scansApi = {
  async getScans(scanId, scanName) {
    const query = new URLSearchParams();
    if (scanId) query.append('scanId', scanId);
    if (scanName) query.append('scanName', scanName);
    const qs = query.toString();
    const res = await request(`/ScansGroups/GetScansGroups${qs ? `?${qs}` : ''}`);
    return res.items || [];
  },
  async createScan(formData) {
    const res = await request('/ScansGroups/CreateScanGroup', {
      method: 'POST',
      body: formData
    });
    return res;
  },
  async updateScan(formData) {
    const res = await request('/ScansGroups/UpdateScanGroup', {
      method: 'PUT',
      body: formData
    });
    return res;
  },
  async deleteScan(scanId) {
    const res = await request(`/ScansGroups/DeleteScanGroup?scanId=${scanId}`, {
      method: 'DELETE'
    });
    return res;
  }
};

export const mangaGenresApi = {
  getMangaGenres: filtersApi.getMangaGenres,
  async linkGenre(mangaId, genreId) {
    const res = await request('/MangaGenres/CreateMangaGenre', {
      method: 'POST',
      body: JSON.stringify({ mangaId, genreId })
    });
    return res;
  },
  async unlinkGenre(mangaId, genreId) {
    const res = await request(`/MangaGenres/DeleteMangaGenre?genreId=${genreId}&mangaId=${mangaId}`, {
      method: 'DELETE'
    });
    return res;
  }
};

// ==========================================
// AUTENTICACIÓN Y USUARIOS
// ==========================================
export const authApi = {
  /**
   * Inicia sesión con Email y Password
   */
  async login({ email, password }) {
    const res = await request('/Users/Login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (res.items && res.items.length > 0) {
      const user = res.items[0];
      setAuthData(user.token, user);
      return user;
    }
    throw new Error(res.errorDescription || 'Credenciales inválidas');
  },

  /**
   * Registra un nuevo usuario
   */
  async register({ username, email, password, aceptTerms = true }) {
    const res = await request('/Users/Register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        email,
        password,
        aceptTerms
      })
    });
    return res;
  }
};

// ==========================================
// PERFIL Y CONFIGURACIÓN DE USUARIO
// ==========================================
export const profileApi = {
  /**
   * Obtiene la información del perfil del usuario autenticado
   */
  async getMyProfile() {
    const res = await request('/Users/GetMyProfile');
    return (res.items && res.items[0]) || null;
  },

  /**
   * Actualiza el nombre de usuario y correo electrónico
   */
  async updateProfile({ username, email }) {
    return await request('/Users/UpdateProfile', {
      method: 'PUT',
      body: JSON.stringify({ username, email })
    });
  },

  /**
   * Cambia la contraseña del usuario
   */
  async changePassword({ currentPassword, newPassword, confirmPassword }) {
    return await request('/Users/ChangePassword', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
    });
  }
};

// ==========================================
// LISTA DEL USUARIO (MY LIST)
// ==========================================
export const userListApi = {
  async getMyList() {
    const res = await request('/UserMangaLists/GetMyList');
    return res.items || [];
  },

  async addOrUpdate({ mangaId, readingStatus = 'Reading' }) {
    return await request('/UserMangaLists/AddOrUpdateManga', {
      method: 'POST',
      body: JSON.stringify({ mangaId, readingStatus })
    });
  },

  async remove(mangaId) {
    return await request(`/UserMangaLists/RemoveManga?mangaId=${mangaId}`, {
      method: 'DELETE'
    });
  },

  async check(mangaId) {
    try {
      const res = await request(`/UserMangaLists/CheckMangaInList?mangaId=${mangaId}`);
      return (res.items && res.items[0]) || null;
    } catch {
      return null;
    }
  }
};

// ==========================================
// SOLICITUDES DE SCAN GROUPS API
// ==========================================
export const scanApplicationsApi = {
  /**
   * Envía una solicitud para convertir la cuenta en Scan Group (soporta FormData con logo)
   */
  async apply(formData) {
    const res = await request('/ScanGroupApplications/Apply', {
      method: 'POST',
      body: formData
    });
    return res;
  },

  /**
   * Obtiene la solicitud del usuario autenticado actual para verificar su estado (PENDING, APPROVED, REJECTED)
   */
  async getMyApplication() {
    try {
      const res = await request('/ScanGroupApplications/MyApplication');
      return (res.items && res.items[0]) || null;
    } catch {
      return null;
    }
  },

  /**
   * (Admin) Obtiene las solicitudes de Scan Group con filtro opcional por estado
   */
  async getApplications(status, applicationId) {
    const query = new URLSearchParams();
    if (status) query.append('status', status);
    if (applicationId) query.append('applicationId', applicationId);
    const qs = query.toString();
    const res = await request(`/ScanGroupApplications/GetApplications${qs ? `?${qs}` : ''}`);
    return res.items || [];
  },

  /**
   * (Admin) Aprueba o rechaza una solicitud. Al aprobar, crea el ScanGroup y actualiza el rol del usuario a Scan (3).
   */
  async reviewApplication({ applicationId, isApproved, adminNotes }) {
    const res = await request('/ScanGroupApplications/ReviewApplication', {
      method: 'POST',
      body: JSON.stringify({ applicationId, isApproved, adminNotes })
    });
    return res;
  }
};

// ==========================================
// ROLES & ADMIN USERS API
// ==========================================
export const rolesApi = {
  /**
   * Obtiene todos los roles del sistema
   */
  async getRoles(params = {}) {
    const query = new URLSearchParams();
    if (params.roleId) query.append('roleId', params.roleId);
    if (params.roleName) query.append('roleName', params.roleName);
    if (params.isActive !== undefined) query.append('isActive', params.isActive);
    const qs = query.toString();
    const res = await request(`/Roles/GetRoles${qs ? `?${qs}` : ''}`);
    return res.items || [];
  },

  /**
   * Obtiene un rol por ID
   */
  async getRoleById(roleId) {
    const res = await request(`/Roles/GetRoleById?roleId=${roleId}`);
    return (res.items && res.items[0]) || null;
  },

  /**
   * Crea un nuevo rol
   */
  async createRole({ roleName, roleDescription, isActive = 1, isOwnerRole = 0 }) {
    const res = await request('/Roles/CreateRole', {
      method: 'POST',
      body: JSON.stringify({ roleName, roleDescription, isActive, isOwnerRole })
    });
    return res;
  },

  /**
   * Actualiza un rol existente
   */
  async updateRole({ roleId, roleName, roleDescription, isActive = 1 }) {
    const res = await request('/Roles/UpdateRole', {
      method: 'PUT',
      body: JSON.stringify({ roleId, roleName, roleDescription, isActive })
    });
    return res;
  },

  /**
   * Elimina un rol
   */
  async deleteRole(roleId) {
    const res = await request(`/Roles/DeleteRole?roleId=${roleId}`, {
      method: 'DELETE'
    });
    return res;
  },

  /**
   * Asigna un rol a un usuario
   */
  async assignRole({ userId, roleId }) {
    const res = await request('/Roles/AssignRole', {
      method: 'POST',
      body: JSON.stringify({ userId, roleId })
    });
    return res;
  },

  /**
   * Obtiene usuarios que tienen un rol específico
   */
  async getUsersByRole(roleId) {
    const res = await request(`/Roles/GetUsersByRole?roleId=${roleId}`);
    return res.items || [];
  }
};

export const adminUsersApi = {
  /**
   * Obtiene el listado completo de usuarios registrados para gestión administrativa
   */
  async getUsers(userId) {
    const query = userId ? `?userId=${userId}` : '';
    const res = await request(`/Users/GetUsers${query}`);
    return res.items || [];
  }
};

export default {
  mangas: mangasApi,
  chapters: chaptersApi,
  genres: genresApi,
  mangaGenres: mangaGenresApi,
  scans: scansApi,
  scanApplications: scanApplicationsApi,
  roles: rolesApi,
  adminUsers: adminUsersApi,
  notices: noticesApi,
  forum: forumApi,
  filters: filtersApi,
  auth: authApi,
  profile: profileApi,
  userList: userListApi,
  getToken,
  setAuthData,
  clearAuthData,
  getStoredUser
};
