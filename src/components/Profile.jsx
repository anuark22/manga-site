import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { profileApi, userListApi } from '../services/api';
import { getMangaImage } from '../utils/imageHelper';
import '../styles/Profile.scss';

const Profile = () => {
  const { user, token, isAuthenticated, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [userMangas, setUserMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'password' | 'mylist'

  // Estado del formulario de perfil
  const [editForm, setEditForm] = useState({
    username: '',
    email: ''
  });
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  // Estado del formulario de cambio de contraseña
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  // Carga inicial del perfil y lista del usuario
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const [profile, myList] = await Promise.all([
          profileApi.getMyProfile().catch(() => null),
          userListApi.getMyList().catch(() => [])
        ]);

        if (isMounted) {
          if (profile) {
            setProfileData(profile);
            setEditForm({
              username: profile.username || user?.username || '',
              email: profile.email || user?.email || ''
            });
          } else if (user) {
            // Fallback con los datos de sesión si la API devuelve nulo
            setEditForm({
              username: user.username || '',
              email: user.email || ''
            });
          }
          if (myList) {
            setUserMangas(myList);
          }
        }
      } catch (err) {
        console.error('Error al cargar datos del perfil:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserData();
    return () => { isMounted = false; };
  }, [isAuthenticated, user]);

  // Manejador para actualizar información personal
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileFeedback(null);

    const { username, email } = editForm;
    if (!username.trim() || username.trim().length < 3) {
      setProfileFeedback({ type: 'error', text: 'El nombre de usuario debe tener al menos 3 caracteres.' });
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setProfileFeedback({ type: 'error', text: 'Introduce un correo electrónico válido.' });
      return;
    }

    setProfileUpdating(true);
    try {
      const res = await profileApi.updateProfile({
        username: username.trim(),
        email: email.trim()
      });

      if (res && res.error) {
        setProfileFeedback({ type: 'error', text: res.errorDescription || 'No se pudo actualizar el perfil.' });
      } else {
        setProfileFeedback({ type: 'success', text: '¡Datos de perfil actualizados exitosamente!' });
        updateUser({ username: username.trim(), email: email.trim() });
        setProfileData(prev => prev ? ({ ...prev, username: username.trim(), email: email.trim() }) : prev);
      }
    } catch (err) {
      setProfileFeedback({
        type: 'error',
        text: err.data?.errorDescription || err.message || 'Error al conectar con el servidor.'
      });
    } finally {
      setProfileUpdating(false);
    }
  };

  // Manejador para cambio de contraseña
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordFeedback(null);

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword) {
      setPasswordFeedback({ type: 'error', text: 'Introduce tu contraseña actual.' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', text: 'La nueva contraseña y su confirmación no coinciden.' });
      return;
    }

    setPasswordUpdating(true);
    try {
      const res = await profileApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });

      if (res && res.error) {
        setPasswordFeedback({ type: 'error', text: res.errorDescription || 'Error al cambiar la contraseña.' });
      } else {
        setPasswordFeedback({ type: 'success', text: '¡Tu contraseña ha sido actualizada con éxito!' });
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      setPasswordFeedback({
        type: 'error',
        text: err.data?.errorDescription || err.message || 'Contraseña actual incorrecta o error de validación.'
      });
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Reciente';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Pantalla cuando el usuario no está autenticado
  if (!isAuthenticated && !loading) {
    return (
      <div className="profile-page-wrapper">
        <div className="profile-unauth-card">
          <div className="unauth-icon-circle">
            <i className="fa fa-user-lock" aria-hidden="true"></i>
          </div>
          <h2>Acceso a tu Perfil</h2>
          <p>Debes iniciar sesión con tu cuenta para ver y editar tu información de usuario.</p>
          <div className="unauth-actions">
            <Link to="/login" className="btn-primary">
              <i className="fa fa-sign-in" aria-hidden="true"></i> Iniciar Sesión
            </Link>
            <Link to="/register" className="btn-secondary">
              Crear Cuenta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentUsername = profileData?.username || user?.username || 'Usuario';
  const currentEmail = profileData?.email || user?.email || '';
  const currentRole = profileData?.roleName || user?.roleName || 'CLIENTE';
  const registerDate = formatDate(profileData?.createdAt);

  return (
    <div className="profile-page-wrapper">
      <div className="profile-container">

        {/* Banner Superior de Perfil */}
        <div className="profile-header-card">
          <div className="profile-header-content">
            <div className="profile-avatar-circle">
              <span>{currentUsername.charAt(0).toUpperCase()}</span>
            </div>
            <div className="profile-main-meta">
              <div className="profile-title-row">
                <h1>{currentUsername}</h1>
                <span className={`role-badge role-${currentRole.toLowerCase()}`}>
                  <i className="fa fa-shield" aria-hidden="true"></i> {currentRole}
                </span>
              </div>
              <p className="profile-email">
                <i className="fa fa-envelope" aria-hidden="true"></i> {currentEmail}
              </p>
              <div className="profile-tags-row">
                <span className="profile-tag">
                  <i className="fa fa-calendar-check-o" aria-hidden="true"></i> Miembro desde {registerDate}
                </span>
                <span className="profile-tag active-status">
                  <i className="fa fa-check-circle" aria-hidden="true"></i> Cuenta Activa
                </span>
              </div>
            </div>
          </div>

          <div className="profile-stats-grid">
            <div className="stat-card" onClick={() => navigate('/my-list')}>
              <i className="fa fa-bookmark stat-icon" aria-hidden="true"></i>
              <div className="stat-info">
                <span className="stat-number">{userMangas.length}</span>
                <span className="stat-label">Mangas en tu Lista</span>
              </div>
            </div>

            <div className="stat-card">
              <i className="fa fa-comments stat-icon" aria-hidden="true"></i>
              <div className="stat-info">
                <span className="stat-number">Comunidad</span>
                <span className="stat-label">Participa en Foros</span>
              </div>
            </div>

            <div className="stat-card logout-stat" onClick={handleLogout} title="Cerrar sesión activa">
              <i className="fa fa-sign-out stat-icon" aria-hidden="true"></i>
              <div className="stat-info">
                <span className="stat-number">Salir</span>
                <span className="stat-label">Cerrar Sesión</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación del Perfil */}
        <div className="profile-tabs-bar">
          <button 
            type="button" 
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <i className="fa fa-user" aria-hidden="true"></i>
            <span>Datos Personales</span>
          </button>
          <button 
            type="button" 
            className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <i className="fa fa-lock" aria-hidden="true"></i>
            <span>Seguridad & Contraseña</span>
          </button>
          <button 
            type="button" 
            className={`tab-btn ${activeTab === 'mylist' ? 'active' : ''}`}
            onClick={() => setActiveTab('mylist')}
          >
            <i className="fa fa-list" aria-hidden="true"></i>
            <span>Mi Lista ({userMangas.length})</span>
          </button>
        </div>

        {/* Contenido de la pestaña activa */}
        <div className="profile-tab-content">

          {/* TAB 1: DATOS PERSONALES / ACTUALIZAR PERFIL */}
          {activeTab === 'info' && (
            <div className="profile-card-section">
              <div className="section-title">
                <h2><i className="fa fa-edit" aria-hidden="true"></i> Actualizar Información Personal</h2>
                <p>Edita tu nombre de usuario y correo electrónico asociados a tu cuenta.</p>
              </div>

              {profileFeedback && (
                <div className={`alert-banner ${profileFeedback.type}`}>
                  <i className={`fa ${profileFeedback.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`} aria-hidden="true"></i>
                  <span>{profileFeedback.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-group">
                  <label htmlFor="profile-username">
                    <i className="fa fa-user" aria-hidden="true"></i> Nombre de Usuario
                  </label>
                  <input 
                    type="text" 
                    id="profile-username" 
                    name="username"
                    value={editForm.username}
                    onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Mínimo 3 caracteres"
                    required
                  />
                  <small>Visible en tus publicaciones y comentarios del foro.</small>
                </div>

                <div className="form-group">
                  <label htmlFor="profile-email">
                    <i className="fa fa-envelope" aria-hidden="true"></i> Correo Electrónico
                  </label>
                  <input 
                    type="email" 
                    id="profile-email" 
                    name="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="ejemplo@correo.com"
                    required
                  />
                  <small>Utilizado para inicio de sesión y recuperación de contraseña.</small>
                </div>

                <div className="form-group readonly-group">
                  <label>
                    <i className="fa fa-shield" aria-hidden="true"></i> Nivel de Acceso / Rol
                  </label>
                  <input 
                    type="text" 
                    value={currentRole} 
                    disabled 
                    className="input-disabled"
                  />
                  <small>Asignado por la administración del sistema.</small>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={profileUpdating}
                  >
                    {profileUpdating ? (
                      <>
                        <i className="fa fa-spinner fa-spin" aria-hidden="true"></i>
                        <span>Guardando cambios...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa fa-save" aria-hidden="true"></i>
                        <span>Guardar Cambios</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: CAMBIAR CONTRASEÑA */}
          {activeTab === 'password' && (
            <div className="profile-card-section">
              <div className="section-title">
                <h2><i className="fa fa-key" aria-hidden="true"></i> Cambiar Contraseña</h2>
                <p>Protege tu cuenta actualizando periódicamente tu clave de acceso.</p>
              </div>

              {passwordFeedback && (
                <div className={`alert-banner ${passwordFeedback.type}`}>
                  <i className={`fa ${passwordFeedback.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`} aria-hidden="true"></i>
                  <span>{passwordFeedback.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="profile-form">
                <div className="form-group password-group">
                  <label htmlFor="current-password">
                    <i className="fa fa-lock" aria-hidden="true"></i> Contraseña Actual
                  </label>
                  <div className="password-input-wrapper">
                    <input 
                      type={showPassword.current ? 'text' : 'password'}
                      id="current-password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Tu contraseña actual"
                      required
                    />
                    <button 
                      type="button" 
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(p => ({ ...p, current: !p.current }))}
                      title={showPassword.current ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      <i className={`fa ${showPassword.current ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
                    </button>
                  </div>
                </div>

                <div className="form-group password-group">
                  <label htmlFor="new-password">
                    <i className="fa fa-key" aria-hidden="true"></i> Nueva Contraseña
                  </label>
                  <div className="password-input-wrapper">
                    <input 
                      type={showPassword.new ? 'text' : 'password'}
                      id="new-password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                    <button 
                      type="button" 
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(p => ({ ...p, new: !p.new }))}
                      title={showPassword.new ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      <i className={`fa ${showPassword.new ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
                    </button>
                  </div>
                  <small>Debe contener al menos 6 caracteres seguros.</small>
                </div>

                <div className="form-group password-group">
                  <label htmlFor="confirm-password">
                    <i className="fa fa-check-square" aria-hidden="true"></i> Confirmar Nueva Contraseña
                  </label>
                  <div className="password-input-wrapper">
                    <input 
                      type={showPassword.confirm ? 'text' : 'password'}
                      id="confirm-password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Repite la nueva contraseña"
                      required
                    />
                    <button 
                      type="button" 
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(p => ({ ...p, confirm: !p.confirm }))}
                      title={showPassword.confirm ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      <i className={`fa ${showPassword.confirm ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
                    </button>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={passwordUpdating}
                  >
                    {passwordUpdating ? (
                      <>
                        <i className="fa fa-spinner fa-spin" aria-hidden="true"></i>
                        <span>Actualizando contraseña...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa fa-refresh" aria-hidden="true"></i>
                        <span>Actualizar Contraseña</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: RESUMEN DE MI LISTA */}
          {activeTab === 'mylist' && (
            <div className="profile-card-section">
              <div className="section-title-between">
                <div>
                  <h2><i className="fa fa-bookmark" aria-hidden="true"></i> Mangas en tu Lista de Lectura</h2>
                  <p>Tus títulos guardados para leer y seguir su progreso.</p>
                </div>
                <Link to="/my-list" className="btn-secondary">
                  Ver Lista Completa <i className="fa fa-arrow-right" aria-hidden="true"></i>
                </Link>
              </div>

              {userMangas.length === 0 ? (
                <div className="empty-list-card">
                  <i className="fa fa-book-open" style={{ fontSize: '36px', opacity: 0.5, marginBottom: '12px' }}></i>
                  <h3>Aún no has agregado mangas</h3>
                  <p>Explora la biblioteca y agrega tus series favoritas para darles seguimiento.</p>
                  <Link to="/manga-section" className="btn-primary" style={{ marginTop: '12px' }}>
                    Explorar Biblioteca
                  </Link>
                </div>
              ) : (
                <div className="profile-manga-grid">
                  {userMangas.map(manga => {
                    const id = manga.mangaId || manga.id;
                    const name = manga.mangaName || manga.mangaTittle;
                    const type = manga.mangaType || manga.mangaTypeName || 'Manga';
                    const image = getMangaImage(manga);

                    return (
                      <Link to={`/manga/${id}`} key={id} className="profile-manga-card">
                        <img src={image} alt={name} />
                        <div className="profile-manga-info">
                          <b>{name}</b>
                          <span className="badge-type">{type}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default Profile;
