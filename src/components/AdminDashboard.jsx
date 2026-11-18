import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  rolesApi, 
  adminUsersApi, 
  scanApplicationsApi, 
  scansApi, 
  mangasApi,
  noticesApi,
  chapterReportsApi,
  normalizePageUrl 
} from '../services/api';
import { getNoticeImage } from '../utils/imageHelper';
import { useAuth } from '../Context/AuthContext';
import { useTheme } from '../Context/ThemeContext';
import '../styles/AdminDashboard.scss';

const REPORT_REASON_LABELS = {
  WRONG_CHAPTER: 'Capítulo incorrecto / desordenado',
  BROKEN_IMAGES: 'Imágenes rotas o faltantes',
  WRONG_MANGA: 'Pertenece a otro manga',
  BAD_QUALITY: 'Mala calidad / ilegible',
  INAPPROPRIATE: 'Contenido inapropiado / spam',
  OTHER: 'Otro motivo'
};

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Pestañas: 'applications' | 'reports' | 'users' | 'roles' | 'notices'
  const [activeTab, setActiveTab] = useState('applications');

  // Estados generales
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Datos maestros
  const [applications, setApplications] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [scansList, setScansList] = useState([]);
  const [mangasCount, setMangasCount] = useState(0);
  const [noticesList, setNoticesList] = useState([]);
  const [reportsList, setReportsList] = useState([]);

  // Filtros de reportes de capítulos
  const [reportsSearch, setReportsSearch] = useState('');
  const [reportsStatusFilter, setReportsStatusFilter] = useState('PENDING');
  const [auditingReport, setAuditingReport] = useState(null);
  const [auditForm, setAuditForm] = useState({ status: 'RESOLVED', actionTaken: 'NONE', adminNotes: '' });
  const [auditSubmitting, setAuditSubmitting] = useState(false);

  // Filtros de noticias
  const [noticesSearch, setNoticesSearch] = useState('');
  const [noticesStatusFilter, setNoticesStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE' | 'FEATURED'
  const [noticesCategoryFilter, setNoticesCategoryFilter] = useState('ALL');

  // Modal Crear / Editar Noticia
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    subtitle: '',
    content: '',
    category: 'Manga',
    file: null,
    extraFile: null,
    imageCaption: '',
    quote: '',
    isFeatured: false,
    readTime: '2 min',
    isActive: true,
    previewMain: '',
    previewExtra: ''
  });
  const [noticeSaving, setNoticeSaving] = useState(false);

  // Filtros de aplicaciones
  const [appStatusFilter, setAppStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [appSearch, setAppSearch] = useState('');

  // Filtros de usuarios
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL'); // 'ALL' | '1' | '2' | '3'

  // Modales de Solicitud (Aprobar / Rechazar)
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewAction, setReviewAction] = useState(null); // 'APPROVE' | 'REJECT'
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Modal Asignar Rol
  const [userToAssign, setUserToAssign] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Modal Crear / Editar Rol
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ roleName: '', roleDescription: '', isActive: 1 });
  const [roleFormLoading, setRoleFormLoading] = useState(false);

  // Notificación Toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Cargar datos del panel de administración
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [apps, users, roles, scans, mangas, notices, reports] = await Promise.all([
        scanApplicationsApi.getApplications().catch(err => {
          console.warn('Error cargando solicitudes:', err);
          return [];
        }),
        adminUsersApi.getUsers().catch(err => {
          console.warn('Error cargando usuarios:', err);
          return [];
        }),
        rolesApi.getRoles().catch(err => {
          console.warn('Error cargando roles:', err);
          return [];
        }),
        scansApi.getScans().catch(err => {
          console.warn('Error cargando scans:', err);
          return [];
        }),
        mangasApi.getMangas().catch(() => []),
        noticesApi.getNotices(null, true).catch(err => {
          console.warn('Error cargando noticias:', err);
          return [];
        }),
        chapterReportsApi.getReports('ALL').catch(err => {
          console.warn('Error cargando reportes de capítulos:', err);
          return [];
        })
      ]);

      setApplications(apps);
      setUsersList(users);
      setRolesList(roles);
      setScansList(scans);
      setMangasCount(mangas.length);
      setNoticesList(notices);
      setReportsList(reports);
    } catch (err) {
      console.error('Error general cargando datos de administración:', err);
      showToast('Error al conectar con los servicios administrativos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && (user?.roleId === 2 || user?.roleName?.toUpperCase() === 'ADMIN')) {
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // ==========================================
  // REVISIÓN DE SOLICITUDES SCAN (APROBAR / RECHAZAR)
  // ==========================================
  const handleOpenReview = (app, actionType) => {
    setSelectedApp(app);
    setReviewAction(actionType);
    setAdminNotes(actionType === 'APPROVE' 
      ? `¡Felicidades! Tu grupo "${app.scanName}" ha sido aprobado. Ahora cuentas con permisos para subir capítulos y administrar tu equipo.` 
      : ''
    );
  };

  const handleCloseReview = () => {
    setSelectedApp(null);
    setReviewAction(null);
    setAdminNotes('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedApp || !reviewAction) return;

    if (reviewAction === 'REJECT' && !adminNotes.trim()) {
      showToast('Por favor ingresa el motivo del rechazo para informar al usuario', 'error');
      return;
    }

    setReviewLoading(true);
    try {
      const isApproved = reviewAction === 'APPROVE';
      await scanApplicationsApi.reviewApplication({
        applicationId: selectedApp.applicationId,
        isApproved,
        adminNotes: adminNotes.trim()
      });

      showToast(
        isApproved 
          ? `Solicitud de "${selectedApp.scanName}" aprobada con éxito. Rol de Scan asignado.` 
          : `Solicitud de "${selectedApp.scanName}" rechazada.`
      );

      handleCloseReview();
      // Recargar datos
      loadAdminData();
    } catch (err) {
      showToast(err.message || 'Error al procesar la revisión de la solicitud', 'error');
    } finally {
      setReviewLoading(false);
    }
  };

  // ==========================================
  // ASIGNACIÓN DE ROLES A USUARIOS
  // ==========================================
  const handleOpenAssignRole = (u) => {
    setUserToAssign(u);
    setSelectedRoleId(String(u.roleId || 1));
  };

  const handleCloseAssignRole = () => {
    setUserToAssign(null);
    setSelectedRoleId('');
  };

  const handleSubmitAssignRole = async (e) => {
    e.preventDefault();
    if (!userToAssign || !selectedRoleId) return;

    setAssignLoading(true);
    try {
      await rolesApi.assignRole({
        userId: userToAssign.userId,
        roleId: parseInt(selectedRoleId, 10)
      });

      const roleObj = rolesList.find(r => String(r.roleId) === String(selectedRoleId));
      const roleName = roleObj ? roleObj.roleName : `Rol #${selectedRoleId}`;

      showToast(`Rol "${roleName}" asignado exitosamente a ${userToAssign.username}`);
      handleCloseAssignRole();

      // Actualizar listado local de usuarios
      setUsersList(prev => prev.map(u => {
        if (u.userId === userToAssign.userId) {
          return {
            ...u,
            roleId: parseInt(selectedRoleId, 10),
            roleName: roleObj ? roleObj.roleName : u.roleName
          };
        }
        return u;
      }));
    } catch (err) {
      showToast(err.message || 'Error al asignar rol al usuario', 'error');
    } finally {
      setAssignLoading(false);
    }
  };

  // ==========================================
  // GESTIÓN DE ROLES (CREAR / EDITAR)
  // ==========================================
  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setRoleForm({ roleName: '', roleDescription: '', isActive: 1 });
    setShowRoleModal(true);
  };

  const handleOpenEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      roleName: role.roleName || '',
      roleDescription: role.roleDescription || '',
      isActive: role.isActive ?? 1
    });
    setShowRoleModal(true);
  };

  const handleSubmitRole = async (e) => {
    e.preventDefault();
    if (!roleForm.roleName.trim()) {
      showToast('Ingresa el nombre del rol', 'error');
      return;
    }

    setRoleFormLoading(true);
    try {
      if (editingRole) {
        await rolesApi.updateRole({
          roleId: editingRole.roleId,
          roleName: roleForm.roleName.trim(),
          roleDescription: roleForm.roleDescription.trim(),
          isActive: roleForm.isActive
        });
        showToast(`Rol "${roleForm.roleName}" actualizado con éxito`);
      } else {
        await rolesApi.createRole({
          roleName: roleForm.roleName.trim(),
          roleDescription: roleForm.roleDescription.trim(),
          isActive: roleForm.isActive,
          isOwnerRole: 0
        });
        showToast(`Rol "${roleForm.roleName}" creado con éxito`);
      }

      setShowRoleModal(false);
      const freshRoles = await rolesApi.getRoles();
      setRolesList(freshRoles);
    } catch (err) {
      showToast(err.message || 'Error al guardar el rol', 'error');
    } finally {
      setRoleFormLoading(false);
    }
  };

  // ==========================================
  // GESTIÓN DE NOTICIAS (CREAR / EDITAR / ESTADOS)
  // ==========================================
  const handleOpenCreateNotice = () => {
    setEditingNotice(null);
    setNoticeForm({
      title: '',
      subtitle: '',
      content: '',
      category: 'Manga',
      file: null,
      extraFile: null,
      imageCaption: '',
      quote: '',
      isFeatured: false,
      readTime: '2 min',
      isActive: true,
      previewMain: '',
      previewExtra: ''
    });
    setShowNoticeModal(true);
  };

  const handleOpenEditNotice = (notice) => {
    setEditingNotice(notice);
    setNoticeForm({
      title: notice.title || notice.noticeTittle || '',
      subtitle: notice.subtitle || '',
      content: notice.content || notice.noticeContent || '',
      category: notice.category || 'Manga',
      file: null,
      extraFile: null,
      imageCaption: notice.imageCaption || '',
      quote: notice.quote || '',
      isFeatured: !!notice.isFeatured,
      readTime: notice.readTime || '2 min',
      isActive: notice.isActive ?? true,
      previewMain: getNoticeImage(notice),
      previewExtra: notice.extraImgUrl || ''
    });
    setShowNoticeModal(true);
  };

  const handleToggleNoticeActive = async (noticeId) => {
    try {
      await noticesApi.toggleActive(noticeId);
      setNoticesList(prev => prev.map(n => {
        if ((n.noticeId || n.id) === noticeId) {
          const nextVal = !n.isActive;
          showToast(`Noticia marcada como ${nextVal ? 'Activa' : 'Inactiva'}`);
          return { ...n, isActive: nextVal };
        }
        return n;
      }));
    } catch (err) {
      console.error('Error cambiando estado activo:', err);
      showToast('No se pudo cambiar el estado de la noticia', 'error');
    }
  };

  const handleToggleNoticeFeatured = async (noticeId) => {
    try {
      await noticesApi.toggleFeatured(noticeId);
      setNoticesList(prev => prev.map(n => {
        if ((n.noticeId || n.id) === noticeId) {
          const nextVal = !n.isFeatured;
          showToast(`Noticia ${nextVal ? 'fijada como Destacada' : 'desmarcada de Destacada'}`);
          return { ...n, isFeatured: nextVal };
        }
        return n;
      }));
    } catch (err) {
      console.error('Error cambiando estado destacada:', err);
      showToast('No se pudo cambiar la condición destacada', 'error');
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta noticia? Esta acción no se puede deshacer.')) return;

    try {
      await noticesApi.deleteNotice(noticeId);
      setNoticesList(prev => prev.filter(n => (n.noticeId || n.id) !== noticeId));
      showToast('Noticia eliminada correctamente');
    } catch (err) {
      console.error('Error al eliminar noticia:', err);
      showToast('No se pudo eliminar la noticia', 'error');
    }
  };

  const handleSubmitNotice = async (e) => {
    e.preventDefault();
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) {
      showToast('Por favor completa el título y el contenido', 'error');
      return;
    }

    setNoticeSaving(true);
    try {
      const formData = new FormData();
      formData.append('Title', noticeForm.title.trim());
      formData.append('Subtitle', noticeForm.subtitle.trim());
      formData.append('Content', noticeForm.content.trim());
      formData.append('Category', noticeForm.category);
      formData.append('ImageCaption', noticeForm.imageCaption.trim());
      formData.append('Quote', noticeForm.quote.trim());
      formData.append('IsFeatured', noticeForm.isFeatured ? 'true' : 'false');
      formData.append('ReadTime', noticeForm.readTime.trim() || '2 min');
      formData.append('IsActive', noticeForm.isActive ? 'true' : 'false');

      if (noticeForm.file) {
        formData.append('File', noticeForm.file);
      }
      if (noticeForm.extraFile) {
        formData.append('ExtraFile', noticeForm.extraFile);
      }

      if (editingNotice) {
        formData.append('NoticeId', editingNotice.noticeId || editingNotice.id);
        await noticesApi.updateNotice(formData);
        showToast('Noticia actualizada con éxito');
      } else {
        await noticesApi.createNotice(formData);
        showToast('Noticia creada y publicada con éxito');
      }

      setShowNoticeModal(false);
      const freshNotices = await noticesApi.getNotices(null, true);
      setNoticesList(freshNotices);
    } catch (err) {
      console.error('Error guardando noticia:', err);
      showToast(err.message || 'Error al guardar la noticia', 'error');
    } finally {
      setNoticeSaving(false);
    }
  };

  // ==========================================
  // AUDITORÍA DE REPORTES DE CAPÍTULOS
  // ==========================================
  const handleOpenAuditReport = (report) => {
    setAuditingReport(report);
    setAuditForm({
      status: report.status === 'PENDING' ? 'RESOLVED' : report.status,
      actionTaken: report.actionTaken || 'NONE',
      adminNotes: report.adminNotes || ''
    });
  };

  const handleCloseAuditReport = () => {
    setAuditingReport(null);
    setAuditForm({ status: 'RESOLVED', actionTaken: 'NONE', adminNotes: '' });
  };

  const handleSubmitAuditReport = async (e) => {
    e.preventDefault();
    if (!auditingReport) return;

    if (auditForm.actionTaken === 'DELETE_CHAPTER' && !window.confirm(`¿Estás seguro de ELIMINAR FÍSICAMENTE el Capítulo ${auditingReport.chapterNumber} de "${auditingReport.mangaTittle}" (subido por ${auditingReport.scanName})? Esta acción borrará sus páginas y resolverá todos los reportes pendientes del capítulo.`)) {
      return;
    }

    setAuditSubmitting(true);
    try {
      await chapterReportsApi.reviewReport({
        reportId: auditingReport.reportId,
        status: auditForm.actionTaken === 'DELETE_CHAPTER' || auditForm.actionTaken === 'HIDE_CHAPTER' ? 'RESOLVED' : auditForm.status,
        actionTaken: auditForm.actionTaken,
        adminNotes: auditForm.adminNotes.trim()
      });

      showToast(
        auditForm.actionTaken === 'DELETE_CHAPTER'
          ? 'Capítulo eliminado y reportes resueltos con éxito.'
          : 'Auditoría de reporte guardada correctamente.',
        'success'
      );
      handleCloseAuditReport();
      await loadAdminData();
    } catch (err) {
      showToast(err.message || 'Error al procesar la auditoría del reporte', 'error');
    } finally {
      setAuditSubmitting(false);
    }
  };

  // ==========================================
  // FILTRADO DE DATOS
  // ==========================================
  const pendingCount = applications.filter(a => a.status === 'PENDING').length;
  const pendingReportsCount = reportsList.filter(r => r.status === 'PENDING').length;

  const filteredReports = reportsList.filter(r => {
    const matchesStatus = reportsStatusFilter === 'ALL' || r.status === reportsStatusFilter;
    const q = reportsSearch.toLowerCase();
    const matchesSearch = !q ||
      (r.mangaTittle && r.mangaTittle.toLowerCase().includes(q)) ||
      (r.scanName && r.scanName.toLowerCase().includes(q)) ||
      (r.reporterUsername && r.reporterUsername.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const filteredApplications = applications.filter(app => {
    const matchesStatus = appStatusFilter === 'ALL' || app.status === appStatusFilter;
    const q = appSearch.toLowerCase();
    const matchesSearch = !q || 
      (app.scanName && app.scanName.toLowerCase().includes(q)) ||
      (app.username && app.username.toLowerCase().includes(q)) ||
      (app.userEmail && app.userEmail.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const filteredUsers = usersList.filter(u => {
    const matchesRole = userRoleFilter === 'ALL' || String(u.roleId) === String(userRoleFilter);
    const q = userSearch.toLowerCase();
    const matchesSearch = !q ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q));
    return matchesRole && matchesSearch;
  });

  const filteredNotices = noticesList.filter(notice => {
    const q = noticesSearch.toLowerCase();
    const title = (notice.title || notice.noticeTittle || '').toLowerCase();
    const sub = (notice.subtitle || '').toLowerCase();
    const content = (notice.content || notice.noticeContent || '').toLowerCase();
    const author = (notice.authorName || '').toLowerCase();
    const matchesSearch = !q || title.includes(q) || sub.includes(q) || content.includes(q) || author.includes(q);

    let matchesStatus = true;
    if (noticesStatusFilter === 'ACTIVE') matchesStatus = !!notice.isActive;
    else if (noticesStatusFilter === 'INACTIVE') matchesStatus = !notice.isActive;
    else if (noticesStatusFilter === 'FEATURED') matchesStatus = !!notice.isFeatured;

    let matchesCat = true;
    if (noticesCategoryFilter !== 'ALL') {
      matchesCat = (notice.category || 'Manga').toUpperCase() === noticesCategoryFilter;
    }

    return matchesSearch && matchesStatus && matchesCat;
  });

  const activeNoticesCount = noticesList.filter(n => n.isActive).length;
  const featuredNoticesCount = noticesList.filter(n => n.isFeatured).length;

  const isAdmin = user && (user.roleId === 2 || user.roleName?.toUpperCase() === 'ADMIN');

  return (
    <div className={`admin-dashboard-wrapper theme-${theme}`}>
      {/* Toast de notificaciones */}
      {toast && (
        <div className={`admin-toast toast-${toast.type}`}>
          <i className={`fa ${toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Control de Acceso: Solo Administradores */}
      {!isAuthenticated ? (
        <div className="auth-guard-container">
          <div className="guard-card">
            <i className="fa fa-lock guard-icon"></i>
            <h2>Acceso Restringido al Panel de Administración</h2>
            <p>Debes iniciar sesión con una cuenta de Administrador para gestionar usuarios, roles y solicitudes.</p>
            <div className="guard-actions">
              <Link to="/login" className="btn-primary">
                <i className="fa fa-sign-in"></i> Iniciar Sesión
              </Link>
              <Link to="/" className="btn-secondary">
                <i className="fa fa-home"></i> Volver al Inicio
              </Link>
            </div>
          </div>
        </div>
      ) : !isAdmin ? (
        <div className="auth-guard-container">
          <div className="guard-card">
            <i className="fa fa-shield guard-icon warning"></i>
            <h2>Acceso Exclusivo para Administradores</h2>
            <p>
              Estás conectado como <strong>{user?.username}</strong> con rol <strong>{user?.roleName || 'Usuario'}</strong>.
              Este centro de control está reservado exclusivamente para la administración general del portal.
            </p>
            <div className="guard-actions">
              {(user?.roleId === 3 || user?.roleName?.toUpperCase() === 'SCAN') ? (
                <Link to="/scan-dashboard" className="btn-primary">
                  <i className="fa fa-cloud-upload"></i> Ir a Mi Panel Scan
                </Link>
              ) : (
                <Link to="/profile" className="btn-primary">
                  <i className="fa fa-user"></i> Ver Mi Perfil
                </Link>
              )}
              <Link to="/manga-section" className="btn-secondary">
                <i className="fa fa-book"></i> Explorar Biblioteca
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="admin-content-container">
          {/* HEADER DEL PANEL ADMINISTRATIVO */}
          <header className="admin-header">
            <div className="header-meta">
              <div className="badge-admin">
                <i className="fa fa-shield"></i> Panel de Control Global
              </div>
              <h1 className="header-title">Centro de Administración del Sistema</h1>
              <p className="header-desc">
                Gestión integral de usuarios, asignación de roles y aprobación de solicitudes para nuevos grupos de scanlation.
              </p>
            </div>

            <div className="user-status-card">
              <div className="status-avatar">
                <i className="fa fa-user-circle"></i>
              </div>
              <div className="status-info">
                <span className="user-name">{user?.username || 'Admin'}</span>
                <span className="user-badge">ADMINISTRADOR</span>
              </div>
            </div>
          </header>

          {/* TARJETAS DE ESTADÍSTICAS RÁPIDAS */}
          <section className="admin-stats-row">
            <div className="stat-card">
              <div className="stat-icon icon-users">
                <i className="fa fa-users"></i>
              </div>
              <div className="stat-data">
                <span className="stat-value">{usersList.length}</span>
                <span className="stat-label">Usuarios Registrados</span>
              </div>
            </div>

            <div className="stat-card highlight">
              <div className="stat-icon icon-requests">
                <i className="fa fa-envelope-open-o"></i>
              </div>
              <div className="stat-data">
                <div className="value-with-badge">
                  <span className="stat-value">{pendingCount}</span>
                  {pendingCount > 0 && <span className="alert-badge">Pendientes</span>}
                </div>
                <span className="stat-label">Solicitudes de Scan</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon icon-scans">
                <i className="fa fa-flag"></i>
              </div>
              <div className="stat-data">
                <span className="stat-value">{scansList.length}</span>
                <span className="stat-label">Grupos Scan Activos</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon icon-roles">
                <i className="fa fa-id-badge"></i>
              </div>
              <div className="stat-data">
                <span className="stat-value">{rolesList.length}</span>
                <span className="stat-label">Roles del Sistema</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon icon-notices">
                <i className="fa fa-newspaper-o"></i>
              </div>
              <div className="stat-data">
                <div className="value-with-badge">
                  <span className="stat-value">{noticesList.length}</span>
                  {featuredNoticesCount > 0 && <span className="alert-badge">{featuredNoticesCount} Destacadas</span>}
                </div>
                <span className="stat-label">Noticias Registradas</span>
              </div>
            </div>
          </section>

          {/* NAVEGACIÓN POR PESTAÑAS */}
          <nav className="admin-nav-tabs">
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
              onClick={() => setActiveTab('applications')}
            >
              <i className="fa fa-inbox"></i> Solicitudes de Scan
              {pendingCount > 0 && (
                <span className="tab-counter-badge">{pendingCount}</span>
              )}
            </button>
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <i className="fa fa-flag"></i> Reportes de Capítulos
              {pendingReportsCount > 0 && (
                <span className="tab-counter-badge">{pendingReportsCount}</span>
              )}
            </button>
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <i className="fa fa-user-circle-o"></i> Usuarios y Roles ({usersList.length})
            </button>
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
              onClick={() => setActiveTab('roles')}
            >
              <i className="fa fa-shield"></i> Roles del Sistema ({rolesList.length})
            </button>
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'notices' ? 'active' : ''}`}
              onClick={() => setActiveTab('notices')}
            >
              <i className="fa fa-newspaper-o"></i> Gestión de Noticias ({noticesList.length})
            </button>
            <Link to="/scan-dashboard" className="nav-tab-btn link-external">
              <i className="fa fa-cloud-upload"></i> Ir a Panel Scan <i className="fa fa-external-link"></i>
            </Link>
          </nav>

          {/* ========================================================= */}
          {/* TAB 1: SOLICITUDES DE SCAN GROUP                          */}
          {/* ========================================================= */}
          {activeTab === 'applications' && (
            <div className="tab-pane applications-tab">
              <div className="panel-box">
                <div className="box-header-row">
                  <div className="box-title-group">
                    <h2 className="box-title">
                      <i className="fa fa-inbox"></i> Solicitudes para Fundar Scan Group ({filteredApplications.length})
                    </h2>
                    <p className="box-subtitle">
                      Revisa, aprueba o rechaza solicitudes de usuarios que desean convertirse en grupos de traducción.
                    </p>
                  </div>

                  <div className="header-filters-row">
                    <div className="status-pills">
                      <button
                        type="button"
                        className={`pill-btn ${appStatusFilter === 'ALL' ? 'active' : ''}`}
                        onClick={() => setAppStatusFilter('ALL')}
                      >
                        Todas ({applications.length})
                      </button>
                      <button
                        type="button"
                        className={`pill-btn pending ${appStatusFilter === 'PENDING' ? 'active' : ''}`}
                        onClick={() => setAppStatusFilter('PENDING')}
                      >
                        Pendientes ({pendingCount})
                      </button>
                      <button
                        type="button"
                        className={`pill-btn approved ${appStatusFilter === 'APPROVED' ? 'active' : ''}`}
                        onClick={() => setAppStatusFilter('APPROVED')}
                      >
                        Aprobadas ({applications.filter(a => a.status === 'APPROVED').length})
                      </button>
                      <button
                        type="button"
                        className={`pill-btn rejected ${appStatusFilter === 'REJECTED' ? 'active' : ''}`}
                        onClick={() => setAppStatusFilter('REJECTED')}
                      >
                        Rechazadas ({applications.filter(a => a.status === 'REJECTED').length})
                      </button>
                    </div>

                    <div className="search-bar-inline">
                      <i className="fa fa-search"></i>
                      <input
                        type="text"
                        placeholder="Buscar por grupo o usuario..."
                        value={appSearch}
                        onChange={(e) => setAppSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="loading-state">
                    <i className="fa fa-spinner fa-spin"></i>
                    <p>Cargando solicitudes...</p>
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="empty-state">
                    <i className="fa fa-check-circle-o"></i>
                    <p>No hay solicitudes de scan en esta categoría.</p>
                    <span>
                      {appStatusFilter === 'PENDING' 
                        ? '¡Excelente! Todas las solicitudes pendientes han sido procesadas.' 
                        : 'No se encontraron registros que coincidan con los filtros seleccionados.'}
                    </span>
                  </div>
                ) : (
                  <div className="applications-list">
                    {filteredApplications.map(app => (
                      <div key={app.applicationId} className={`app-card status-${app.status.toLowerCase()}`}>
                        <div className="app-card-header">
                          <div className="app-scan-info">
                            <div className="app-logo-box">
                              {app.scanImgUrl ? (
                                <img 
                                  src={normalizePageUrl(app.scanImgUrl)} 
                                  alt={app.scanName}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <i className="fa fa-flag"></i>
                              )}
                            </div>
                            <div className="app-titles">
                              <div className="title-row">
                                <h3 className="app-scan-name">{app.scanName}</h3>
                                <span className={`app-status-badge ${app.status.toLowerCase()}`}>
                                  {app.status === 'PENDING' && <><i className="fa fa-clock-o"></i> Pendiente</>}
                                  {app.status === 'APPROVED' && <><i className="fa fa-check"></i> Aprobada</>}
                                  {app.status === 'REJECTED' && <><i className="fa fa-times"></i> Rechazada</>}
                                </span>
                              </div>
                              <div className="app-applicant-meta">
                                <span><i className="fa fa-user"></i> <strong>{app.username}</strong></span>
                                <span><i className="fa fa-envelope"></i> {app.userEmail}</span>
                                <span><i className="fa fa-calendar"></i> {new Date(app.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Acciones para solicitudes pendientes */}
                          {app.status === 'PENDING' && (
                            <div className="app-actions">
                              <button
                                type="button"
                                className="btn-approve"
                                onClick={() => handleOpenReview(app, 'APPROVE')}
                                title="Aprobar solicitud y crear grupo de scan"
                              >
                                <i className="fa fa-check"></i> Aprobar Solicitud
                              </button>
                              <button
                                type="button"
                                className="btn-reject"
                                onClick={() => handleOpenReview(app, 'REJECT')}
                                title="Rechazar solicitud con observaciones"
                              >
                                <i className="fa fa-times"></i> Rechazar
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="app-card-body">
                          <div className="app-desc-section">
                            <h4>Descripción del Proyecto:</h4>
                            <p>{app.scanDescription}</p>
                          </div>

                          {app.applicationMessage && (
                            <div className="app-message-section">
                              <h4>Mensaje de Postulación:</h4>
                              <blockquote>"{app.applicationMessage}"</blockquote>
                            </div>
                          )}

                          <div className="app-links-row">
                            {app.discordUrl && (
                              <a href={app.discordUrl} target="_blank" rel="noopener noreferrer" className="app-link-pill discord">
                                <i className="fa fa-comments"></i> Discord
                              </a>
                            )}
                            {app.websiteUrl && (
                              <a href={app.websiteUrl} target="_blank" rel="noopener noreferrer" className="app-link-pill web">
                                <i className="fa fa-globe"></i> Sitio Web
                              </a>
                            )}
                            {app.createdScanId && (
                              <span className="app-link-pill scan-id">
                                <i className="fa fa-id-card"></i> Scan ID Creado: #{app.createdScanId}
                              </span>
                            )}
                          </div>

                          {/* Historial de revisión si fue procesada */}
                          {app.reviewedByUsername && (
                            <div className="app-review-history">
                              <div className="review-meta">
                                <i className="fa fa-info-circle"></i> Revisada por <strong>{app.reviewedByUsername}</strong> el {new Date(app.reviewedAt).toLocaleString()}
                              </div>
                              {app.adminNotes && (
                                <p className="review-notes">Notas administrativas: <em>"{app.adminNotes}"</em></p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: USUARIOS Y ASIGNACIÓN DE ROLES                     */}
          {/* ========================================================= */}
          {activeTab === 'users' && (
            <div className="tab-pane users-tab">
              <div className="panel-box">
                <div className="box-header-row">
                  <div className="box-title-group">
                    <h2 className="box-title">
                      <i className="fa fa-users"></i> Directorio y Asignación de Roles ({filteredUsers.length})
                    </h2>
                    <p className="box-subtitle">
                      Asigna roles de Scan, Administrador o Cliente a cualquier usuario registrado en la base de datos.
                    </p>
                  </div>

                  <div className="header-filters-row">
                    <select
                      className="form-select role-filter-select"
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                    >
                      <option value="ALL">-- Todos los Roles --</option>
                      {rolesList.map(r => (
                        <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                      ))}
                    </select>

                    <div className="search-bar-inline">
                      <i className="fa fa-search"></i>
                      <input
                        type="text"
                        placeholder="Buscar por usuario o email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="users-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Usuario</th>
                        <th>Correo Electrónico</th>
                        <th>Rol Actual</th>
                        <th>Grupo Scan</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => {
                        const scanGroup = scansList.find(s => s.scanId === u.scanId);
                        return (
                          <tr key={u.userId}>
                            <td className="col-id">#{u.userId}</td>
                            <td className="col-user">
                              <div className="user-table-cell">
                                <div className="user-cell-avatar">
                                  {(u.username || 'U')[0].toUpperCase()}
                                </div>
                                <span className="user-cell-name">{u.username}</span>
                              </div>
                            </td>
                            <td className="col-email">{u.email}</td>
                            <td className="col-role">
                              <span className={`role-tag role-${(u.roleName || 'CLIENTE').toLowerCase()}`}>
                                {u.roleName || (u.roleId === 2 ? 'ADMIN' : u.roleId === 3 ? 'SCAN' : 'CLIENTE')}
                              </span>
                            </td>
                            <td className="col-scan">
                              {scanGroup ? (
                                <span className="scan-pill">
                                  <i className="fa fa-flag"></i> {scanGroup.scanName}
                                </span>
                              ) : (
                                <span className="no-scan">Ninguno</span>
                              )}
                            </td>
                            <td className="col-status">
                              {u.isBlocked === 1 ? (
                                <span className="status-blocked">Bloqueado</span>
                              ) : (
                                <span className="status-active">Activo</span>
                              )}
                            </td>
                            <td className="col-actions">
                              <button
                                type="button"
                                className="btn-assign-role"
                                onClick={() => handleOpenAssignRole(u)}
                                title="Cambiar rol de usuario"
                              >
                                <i className="fa fa-pencil-square-o"></i> Asignar Rol
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: ROLES DEL SISTEMA                                  */}
          {/* ========================================================= */}
          {activeTab === 'roles' && (
            <div className="tab-pane roles-tab">
              <div className="panel-box">
                <div className="box-header-row">
                  <div className="box-title-group">
                    <h2 className="box-title">
                      <i className="fa fa-shield"></i> Roles Configurados en el Sistema ({rolesList.length})
                    </h2>
                    <p className="box-subtitle">
                      Administra los niveles de autorización y permisos disponibles en la plataforma.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleOpenCreateRole}
                  >
                    <i className="fa fa-plus"></i> Crear Nuevo Rol
                  </button>
                </div>

                <div className="roles-grid">
                  {rolesList.map(r => (
                    <div key={r.roleId} className="role-card">
                      <div className="role-card-header">
                        <div className="role-icon-box">
                          <i className={`fa ${r.roleId === 2 ? 'fa-star' : r.roleId === 3 ? 'fa-pencil-square-o' : 'fa-user'}`}></i>
                        </div>
                        <div className="role-title-box">
                          <h3 className="role-name">{r.roleName}</h3>
                          <span className="role-id">ID Rol: #{r.roleId}</span>
                        </div>
                        <span className={`role-status-badge ${r.isActive ? 'active' : 'inactive'}`}>
                          {r.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <p className="role-desc">{r.roleDescription || 'Sin descripción'}</p>

                      <div className="role-card-footer">
                        <div className="role-user-count">
                          <i className="fa fa-users"></i> {r.userCount || 0} Usuarios asignados
                        </div>
                        <button
                          type="button"
                          className="btn-edit-role"
                          onClick={() => handleOpenEditRole(r)}
                        >
                          <i className="fa fa-pencil"></i> Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: GESTIÓN DE NOTICIAS                                */}
          {/* ========================================================= */}
          {activeTab === 'notices' && (
            <div className="tab-pane notices-tab">
              <div className="panel-box">
                <div className="box-header-row">
                  <div className="box-title-group">
                    <h2 className="box-title">
                      <i className="fa fa-newspaper-o"></i> Publicaciones y Noticias del Sistema ({filteredNotices.length})
                    </h2>
                    <p className="box-subtitle">
                      Crea, edita y configura las noticias de la web, define noticias destacadas para el carrusel hero y administra su visibilidad.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleOpenCreateNotice}
                  >
                    <i className="fa fa-plus-circle"></i> Nueva Noticia
                  </button>
                </div>

                {/* TOOLBAR ESTILIZADA DE FILTROS Y BÚSQUEDA */}
                <div className="notices-toolbar-card">
                  {/* Píldoras de estado */}
                  <div className="notices-status-pills">
                    <button
                      type="button"
                      className={`pill-btn ${noticesStatusFilter === 'ALL' ? 'active' : ''}`}
                      onClick={() => setNoticesStatusFilter('ALL')}
                    >
                      <span>Todas</span>
                      <span className="pill-count">{noticesList.length}</span>
                    </button>
                    <button
                      type="button"
                      className={`pill-btn pill-active ${noticesStatusFilter === 'ACTIVE' ? 'active' : ''}`}
                      onClick={() => setNoticesStatusFilter('ACTIVE')}
                    >
                      <i className="fa fa-eye"></i>
                      <span>Activas</span>
                      <span className="pill-count">{activeNoticesCount}</span>
                    </button>
                    <button
                      type="button"
                      className={`pill-btn pill-inactive ${noticesStatusFilter === 'INACTIVE' ? 'active' : ''}`}
                      onClick={() => setNoticesStatusFilter('INACTIVE')}
                    >
                      <i className="fa fa-eye-slash"></i>
                      <span>Inactivas</span>
                      <span className="pill-count">{noticesList.length - activeNoticesCount}</span>
                    </button>
                    <button
                      type="button"
                      className={`pill-btn pill-featured ${noticesStatusFilter === 'FEATURED' ? 'active' : ''}`}
                      onClick={() => setNoticesStatusFilter('FEATURED')}
                    >
                      <i className="fa fa-star"></i>
                      <span>Destacadas</span>
                      <span className="pill-count">{featuredNoticesCount}</span>
                    </button>
                  </div>

                  {/* Controles de Búsqueda y Categoría */}
                  <div className="notices-controls-group">
                    {/* Selector de Categoría con ícono y flecha personalizada */}
                    <div className="modern-select-box">
                      <i className="fa fa-tag select-icon"></i>
                      <select
                        className="modern-select-input"
                        value={noticesCategoryFilter}
                        onChange={(e) => setNoticesCategoryFilter(e.target.value)}
                        aria-label="Filtrar por categoría"
                      >
                        <option value="ALL">Todas las Categorías</option>
                        <option value="MANGA">Manga</option>
                        <option value="ANIME">Anime</option>
                        <option value="LANZAMIENTOS">Lanzamientos</option>
                        <option value="COMUNIDAD">Comunidad</option>
                        <option value="EDITORIAL">Editorial</option>
                      </select>
                      <i className="fa fa-chevron-down select-caret"></i>
                    </div>

                    {/* Barra de Búsqueda moderna */}
                    <div className="modern-search-box">
                      <i className="fa fa-search search-icon"></i>
                      <input
                        type="text"
                        className="modern-search-input"
                        placeholder="Buscar noticias..."
                        value={noticesSearch}
                        onChange={(e) => setNoticesSearch(e.target.value)}
                        aria-label="Buscar noticias por título, subtítulo o contenido"
                      />
                      {noticesSearch && (
                        <button
                          type="button"
                          className="btn-clear-input"
                          onClick={() => setNoticesSearch('')}
                          title="Limpiar búsqueda"
                        >
                          <i className="fa fa-times"></i>
                        </button>
                      )}
                    </div>

                    {/* Botón de limpiar filtros cuando hay filtros activos */}
                    {(noticesSearch || noticesStatusFilter !== 'ALL' || noticesCategoryFilter !== 'ALL') && (
                      <button
                        type="button"
                        className="btn-reset-toolbar"
                        onClick={() => {
                          setNoticesSearch('');
                          setNoticesStatusFilter('ALL');
                          setNoticesCategoryFilter('ALL');
                        }}
                        title="Restablecer todos los filtros"
                      >
                        <i className="fa fa-undo"></i> Limpiar
                      </button>
                    )}
                  </div>
                </div>

                {/* GRILLA / LISTADO DE NOTICIAS */}
                {filteredNotices.length === 0 ? (
                  <div className="empty-results-box">
                    <i className="fa fa-newspaper-o"></i>
                    <p>No se encontraron noticias con los filtros seleccionados.</p>
                  </div>
                ) : (
                  <div className="notices-admin-grid">
                    {filteredNotices.map((notice) => {
                      const nId = notice.noticeId || notice.id;
                      return (
                        <div key={nId} className={`notice-admin-card ${!notice.isActive ? 'inactive' : ''}`}>
                          <div className="notice-admin-thumb">
                            <img src={getNoticeImage(notice)} alt={notice.title} />
                            <div className="thumb-badges">
                              <span className={`status-pill ${notice.isActive ? 'active' : 'inactive'}`}>
                                {notice.isActive ? 'Activa' : 'Inactiva'}
                              </span>
                              {notice.isFeatured && (
                                <span className="featured-pill">
                                  <i className="fa fa-star"></i> Destacada
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="notice-admin-body">
                            <div className="notice-meta-line">
                              <span className="category-tag">{notice.category || 'Manga'}</span>
                              <span className="readtime-tag">
                                <i className="fa fa-clock-o"></i> {notice.readTime || '2 min'}
                              </span>
                              <span className="date-tag">
                                <i className="fa fa-calendar"></i> {new Date(notice.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <h3 className="notice-admin-title">{notice.title || notice.noticeTittle}</h3>
                            {notice.subtitle && (
                              <p className="notice-admin-sub">{notice.subtitle}</p>
                            )}
                            <p className="notice-admin-excerpt">{notice.content || notice.noticeContent}</p>

                            <div className="notice-admin-footer">
                              <div className="author-tag">
                                <i className="fa fa-user-circle"></i> {notice.authorName || 'Admin'}
                              </div>

                              <div className="actions-button-group">
                                {/* Toggle Destacada */}
                                <button
                                  type="button"
                                  className={`btn-icon-action ${notice.isFeatured ? 'btn-star active' : 'btn-star'}`}
                                  onClick={() => handleToggleNoticeFeatured(nId)}
                                  title={notice.isFeatured ? 'Quitar de Destacadas' : 'Marcar como Noticia Destacada'}
                                >
                                  <i className={`fa ${notice.isFeatured ? 'fa-star' : 'fa-star-o'}`}></i>
                                </button>

                                {/* Toggle Activa */}
                                <button
                                  type="button"
                                  className={`btn-icon-action ${notice.isActive ? 'btn-visibility' : 'btn-visibility inactive'}`}
                                  onClick={() => handleToggleNoticeActive(nId)}
                                  title={notice.isActive ? 'Desactivar Noticia' : 'Activar Noticia'}
                                >
                                  <i className={`fa ${notice.isActive ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                                </button>

                                {/* Ver en la Web */}
                                <Link
                                  to={`/news/${nId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-icon-action btn-view"
                                  title="Ver en el portal de noticias"
                                >
                                  <i className="fa fa-external-link"></i>
                                </Link>

                                {/* Editar */}
                                <button
                                  type="button"
                                  className="btn-icon-action btn-edit"
                                  onClick={() => handleOpenEditNotice(notice)}
                                  title="Editar noticia completa"
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>

                                {/* Eliminar */}
                                <button
                                  type="button"
                                  className="btn-icon-action btn-delete"
                                  onClick={() => handleDeleteNotice(nId)}
                                  title="Eliminar noticia"
                                >
                                  <i className="fa fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: AUDITORÍA DE REPORTES DE CAPÍTULOS                 */}
          {/* ========================================================= */}
          {activeTab === 'reports' && (
            <div className="tab-pane applications-tab reports-tab">
              <div className="panel-box">
                <div className="box-header-row">
                  <div className="box-title-group">
                    <h2 className="box-title">
                      <i className="fa fa-flag"></i> Auditoría de Reportes de Capítulos ({filteredReports.length})
                    </h2>
                    <p className="box-subtitle">
                      Revisa reportes enviados por la comunidad, inspecciona capítulos con fallos y toma acciones sobre el capítulo o Scan Group.
                    </p>
                  </div>

                  <div className="header-filters-row">
                    <div className="status-pills">
                      <button
                        type="button"
                        className={`pill-btn ${reportsStatusFilter === 'ALL' ? 'active' : ''}`}
                        onClick={() => setReportsStatusFilter('ALL')}
                      >
                        Todos ({reportsList.length})
                      </button>
                      <button
                        type="button"
                        className={`pill-btn pending ${reportsStatusFilter === 'PENDING' ? 'active' : ''}`}
                        onClick={() => setReportsStatusFilter('PENDING')}
                      >
                        Pendientes ({pendingReportsCount})
                      </button>
                      <button
                        type="button"
                        className={`pill-btn approved ${reportsStatusFilter === 'RESOLVED' ? 'active' : ''}`}
                        onClick={() => setReportsStatusFilter('RESOLVED')}
                      >
                        Resueltos ({reportsList.filter(r => r.status === 'RESOLVED').length})
                      </button>
                      <button
                        type="button"
                        className={`pill-btn rejected ${reportsStatusFilter === 'DISMISSED' ? 'active' : ''}`}
                        onClick={() => setReportsStatusFilter('DISMISSED')}
                      >
                        Descartados ({reportsList.filter(r => r.status === 'DISMISSED').length})
                      </button>
                    </div>

                    <div className="search-bar-inline">
                      <i className="fa fa-search"></i>
                      <input
                        type="text"
                        placeholder="Buscar por manga, scan group o usuario..."
                        value={reportsSearch}
                        onChange={(e) => setReportsSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {filteredReports.length === 0 ? (
                  <div className="empty-state">
                    <i className="fa fa-check-circle-o"></i>
                    <p>No hay reportes en esta categoría.</p>
                    <span>No se encontraron reportes de capítulos con los filtros seleccionados.</span>
                  </div>
                ) : (
                  <div className="applications-list">
                    {filteredReports.map(rep => {
                      const statusClass = rep.status === 'RESOLVED' ? 'approved' : rep.status === 'DISMISSED' ? 'rejected' : 'pending';
                      return (
                        <div key={rep.reportId} className={`app-card status-${statusClass}`}>
                          <div className="app-card-header">
                            <div className="app-scan-info">
                              <div className="app-logo-box" style={{ background: 'rgba(239, 68, 68, 0.14)', color: '#ef4444' }}>
                                <i className="fa fa-flag"></i>
                              </div>
                              <div className="app-titles">
                                <div className="title-row">
                                  <h3 className="app-scan-name">
                                    {rep.mangaTittle} &mdash; Cap. {rep.chapterNumber}
                                  </h3>
                                  <span className={`app-status-badge ${statusClass}`}>
                                    {rep.status === 'PENDING' && <><i className="fa fa-clock-o"></i> Pendiente</>}
                                    {rep.status === 'RESOLVED' && <><i className="fa fa-check"></i> Resuelto</>}
                                    {rep.status === 'DISMISSED' && <><i className="fa fa-times"></i> Descartado</>}
                                  </span>
                                  {!rep.chapterExists && (
                                    <span className="app-status-badge rejected">
                                      <i className="fa fa-trash"></i> Capítulo eliminado
                                    </span>
                                  )}
                                </div>
                                <div className="app-applicant-meta">
                                  <span><i className="fa fa-users"></i> Scan Group: <strong>{rep.scanName}</strong></span>
                                  <span><i className="fa fa-user"></i> Reportado por: <strong>{rep.reporterUsername}</strong> ({rep.reporterEmail})</span>
                                  <span><i className="fa fa-calendar"></i> {new Date(rep.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>

                            <div className="app-actions">
                              {rep.chapterExists && rep.chapterId && (
                                <Link
                                  to={`/manga/${rep.mangaId}/chapter/${rep.chapterId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-secondary"
                                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                  <i className="fa fa-external-link"></i> Inspeccionar Capítulo
                                </Link>
                              )}
                              <button
                                type="button"
                                className="btn-approve"
                                onClick={() => handleOpenAuditReport(rep)}
                              >
                                <i className="fa fa-gavel"></i> {rep.status === 'PENDING' ? 'Auditar Reporte' : 'Ver / Editar Resolución'}
                              </button>
                            </div>
                          </div>

                          <div className="app-card-body">
                            <div className="app-desc-section">
                              <h4>Motivo del Reporte:</h4>
                              <p style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span className="app-link-pill" style={{ background: 'rgba(245, 158, 11, 0.16)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.35)' }}>
                                  <i className="fa fa-exclamation-circle"></i> {REPORT_REASON_LABELS[rep.reason] || rep.reason}
                                </span>
                                {rep.chapterTitle && <span style={{ opacity: 0.75 }}>({rep.chapterTitle})</span>}
                              </p>
                            </div>

                            {rep.description && (
                              <div className="app-message-section">
                                <h4>Detalle del Usuario:</h4>
                                <blockquote>"{rep.description}"</blockquote>
                              </div>
                            )}

                            {rep.reviewedBy && (
                              <div className="app-review-history">
                                <div className="review-meta">
                                  <i className="fa fa-info-circle"></i> Auditado por <strong>{rep.reviewerUsername || 'Admin'}</strong> el {new Date(rep.reviewedAt).toLocaleString()} &bull; Acción: <strong>{rep.actionTaken || 'NONE'}</strong>
                                </div>
                                {rep.adminNotes && (
                                  <p className="review-notes">Notas administrativas: <em>"{rep.adminNotes}"</em></p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: AUDITAR REPORTE DE CAPÍTULO                        */}
      {/* ========================================================= */}
      {auditingReport && (
        <div className="admin-modal-backdrop" onClick={handleCloseAuditReport}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                <i className="fa fa-gavel"></i> Auditar Reporte #{auditingReport.reportId}
              </h3>
              <button type="button" className="btn-close" onClick={handleCloseAuditReport}>
                <i className="fa fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitAuditReport} className="admin-modal-form">
              <div className="review-summary-box">
                <p><strong>Manga / Capítulo:</strong> {auditingReport.mangaTittle} &mdash; Capítulo {auditingReport.chapterNumber}</p>
                <p><strong>Scan Group responsable:</strong> {auditingReport.scanName}</p>
                <p><strong>Reportado por:</strong> {auditingReport.reporterUsername} ({auditingReport.reporterEmail})</p>

                <div className="alert-box warning" style={{ marginTop: '10px' }}>
                  <i className="fa fa-exclamation-triangle"></i> <strong>Motivo:</strong> {REPORT_REASON_LABELS[auditingReport.reason] || auditingReport.reason}
                  {auditingReport.description && (
                    <div style={{ marginTop: '6px', opacity: 0.92 }}>"{auditingReport.description}"</div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">Acción a tomar sobre el Capítulo / Scan Group:</label>
                <select
                  className="form-select"
                  value={auditForm.actionTaken}
                  onChange={(e) => {
                    const action = e.target.value;
                    setAuditForm(prev => ({
                      ...prev,
                      actionTaken: action,
                      status: action === 'NONE' ? prev.status : 'RESOLVED'
                    }));
                  }}
                >
                  <option value="NONE">Sin acción sobre el capítulo (solo actualizar estado)</option>
                  <option value="SCAN_WARNED">Advertencia registrada al Scan Group</option>
                  {auditingReport.chapterExists && (
                    <>
                      <option value="HIDE_CHAPTER">Ocultar Capítulo (desactivar visibilidad)</option>
                      <option value="DELETE_CHAPTER">Eliminar Capítulo y sus páginas permanentemente</option>
                    </>
                  )}
                </select>
              </div>

              {auditForm.actionTaken === 'NONE' && (
                <div className="form-group">
                  <label className="input-label">Estado del reporte:</label>
                  <select
                    className="form-select"
                    value={auditForm.status}
                    onChange={(e) => setAuditForm(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="RESOLVED">Resuelto</option>
                    <option value="DISMISSED">Descartado (falso reporte / capítulo correcto)</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="input-label">Notas de auditoría (opcional):</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  maxLength={1000}
                  value={auditForm.adminNotes}
                  onChange={(e) => setAuditForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                  placeholder="Detalle de la revisión o advertencia para el historial..."
                />
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseAuditReport}
                  disabled={auditSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`btn-primary ${auditForm.actionTaken === 'DELETE_CHAPTER' ? 'btn-danger' : 'btn-success'}`}
                  disabled={auditSubmitting}
                >
                  {auditSubmitting ? (
                    <><i className="fa fa-spinner fa-spin"></i> Procesando...</>
                  ) : auditForm.actionTaken === 'DELETE_CHAPTER' ? (
                    <><i className="fa fa-trash"></i> Eliminar Capítulo y Resolver</>
                  ) : (
                    <><i className="fa fa-check"></i> Guardar Auditoría</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REVISAR SOLICITUD SCAN (APROBAR / RECHAZAR)        */}
      {/* ========================================================= */}
      {selectedApp && (
        <div className="admin-modal-backdrop" onClick={handleCloseReview}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                <i className={`fa ${reviewAction === 'APPROVE' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                {reviewAction === 'APPROVE' ? 'Aprobar Solicitud de Scan' : 'Rechazar Solicitud de Scan'}
              </h3>
              <button type="button" className="btn-close" onClick={handleCloseReview}>
                <i className="fa fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="admin-modal-form">
              <div className="review-summary-box">
                <p><strong>Grupo:</strong> {selectedApp.scanName}</p>
                <p><strong>Solicitante:</strong> {selectedApp.username} ({selectedApp.userEmail})</p>
                {reviewAction === 'APPROVE' ? (
                  <div className="alert-box success">
                    <i className="fa fa-info-circle"></i> Al aprobar esta solicitud:
                    <ul>
                      <li>Se registrará automáticamente el grupo <strong>"{selectedApp.scanName}"</strong> en la plataforma.</li>
                      <li>El usuario <strong>{selectedApp.username}</strong> pasará a tener el rol <strong>SCAN (RoleId: 3)</strong>.</li>
                      <li>Quedará vinculado directamente a su nuevo grupo para subir capítulos.</li>
                    </ul>
                  </div>
                ) : (
                  <div className="alert-box warning">
                    <i className="fa fa-exclamation-triangle"></i> La solicitud quedará marcada como rechazada y el usuario podrá ver tus observaciones en su panel.
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="input-label">
                  {reviewAction === 'APPROVE' 
                    ? 'Mensaje o notas de bienvenida (Opcional):' 
                    : 'Motivo del rechazo (Requerido): *'}
                </label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={reviewAction === 'APPROVE' 
                    ? 'Ej. ¡Bienvenidos al equipo de colaboradores! Recuerden seguir las directrices de calidad.' 
                    : 'Ej. Faltan enlaces a muestras de trabajo previas o el grupo no cumple los requisitos.'}
                  required={reviewAction === 'REJECT'}
                />
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseReview}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`btn-primary ${reviewAction === 'APPROVE' ? 'btn-success' : 'btn-danger'}`}
                  disabled={reviewLoading}
                >
                  {reviewLoading ? (
                    <><i className="fa fa-spinner fa-spin"></i> Procesando...</>
                  ) : reviewAction === 'APPROVE' ? (
                    <><i className="fa fa-check"></i> Confirmar y Aprobar Scan</>
                  ) : (
                    <><i className="fa fa-times"></i> Confirmar Rechazo</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ASIGNAR ROL A USUARIO                              */}
      {/* ========================================================= */}
      {userToAssign && (
        <div className="admin-modal-backdrop" onClick={handleCloseAssignRole}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                <i className="fa fa-id-badge"></i> Asignar Rol a {userToAssign.username}
              </h3>
              <button type="button" className="btn-close" onClick={handleCloseAssignRole}>
                <i className="fa fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitAssignRole} className="admin-modal-form">
              <p className="modal-lead">
                Selecciona el rol que deseas otorgar al usuario <strong>{userToAssign.username}</strong> ({userToAssign.email}):
              </p>

              <div className="form-group">
                <label className="input-label">Rol del Sistema: *</label>
                <select
                  className="form-select"
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  required
                >
                  {rolesList.map(r => (
                    <option key={r.roleId} value={r.roleId}>
                      {r.roleName} - {r.roleDescription}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseAssignRole}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={assignLoading}
                >
                  {assignLoading ? (
                    <><i className="fa fa-spinner fa-spin"></i> Guardando...</>
                  ) : (
                    <><i className="fa fa-save"></i> Guardar Asignación</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREAR / EDITAR ROL                                 */}
      {/* ========================================================= */}
      {showRoleModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowRoleModal(false)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                <i className="fa fa-shield"></i> {editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}
              </h3>
              <button type="button" className="btn-close" onClick={() => setShowRoleModal(false)}>
                <i className="fa fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitRole} className="admin-modal-form">
              <div className="form-group">
                <label className="input-label">Nombre del Rol: *</label>
                <input
                  type="text"
                  className="form-input"
                  value={roleForm.roleName}
                  onChange={(e) => setRoleForm({ ...roleForm, roleName: e.target.value })}
                  placeholder="Ej. MODERADOR"
                  required
                />
              </div>

              <div className="form-group">
                <label className="input-label">Descripción: *</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={roleForm.roleDescription}
                  onChange={(e) => setRoleForm({ ...roleForm, roleDescription: e.target.value })}
                  placeholder="Descripción de las facultades de este rol"
                  required
                />
              </div>

              <div className="form-group">
                <label className="custom-check-label">
                  <input
                    type="checkbox"
                    checked={roleForm.isActive === 1}
                    onChange={(e) => setRoleForm({ ...roleForm, isActive: e.target.checked ? 1 : 0 })}
                  />
                  <span>Rol Activo</span>
                </label>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowRoleModal(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={roleFormLoading}
                >
                  {roleFormLoading ? (
                    <><i className="fa fa-spinner fa-spin"></i> Guardando...</>
                  ) : (
                    <><i className="fa fa-save"></i> Guardar Rol</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREAR / EDITAR NOTICIA                             */}
      {/* ========================================================= */}
      {showNoticeModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowNoticeModal(false)}>
          <div className="admin-modal-dialog modal-notice-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                <i className="fa fa-newspaper-o"></i>
                {editingNotice ? `Editar Noticia #${editingNotice.noticeId || editingNotice.id}` : 'Crear Nueva Noticia'}
              </h3>
              <button type="button" className="btn-close" onClick={() => setShowNoticeModal(false)}>
                <i className="fa fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitNotice} className="admin-modal-form">
              {/* Título */}
              <div className="form-group">
                <label className="input-label">Título de la Noticia *</label>
                <input
                  type="text"
                  className="form-input"
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  placeholder="Ej. One Piece entra en pausa programada de 3 semanas"
                  required
                />
              </div>

              {/* Subtítulo */}
              <div className="form-group">
                <label className="input-label">Subtítulo / Bajada (Opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={noticeForm.subtitle}
                  onChange={(e) => setNoticeForm({ ...noticeForm, subtitle: e.target.value })}
                  placeholder="Ej. Eiichiro Oda comparte un mensaje especial con los seguidores"
                />
              </div>

              {/* Fila: Categoría y Tiempo de Lectura */}
              <div className="form-row-grid">
                <div className="form-group">
                  <label className="input-label">Categoría *</label>
                  <select
                    className="form-select"
                    value={noticeForm.category}
                    onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
                  >
                    <option value="Manga">Manga</option>
                    <option value="Anime">Anime</option>
                    <option value="Lanzamientos">Lanzamientos</option>
                    <option value="Comunidad">Comunidad</option>
                    <option value="Editorial">Editorial</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="input-label">Tiempo Estimado de Lectura</label>
                  <input
                    type="text"
                    className="form-input"
                    value={noticeForm.readTime}
                    onChange={(e) => setNoticeForm({ ...noticeForm, readTime: e.target.value })}
                    placeholder="Ej. 2 min, 3 min"
                  />
                </div>
              </div>

              {/* Fila: Imagen Principal y Captura de Foto */}
              <div className="form-row-grid">
                <div className="form-group">
                  <label className="input-label">
                    Imagen Principal {editingNotice ? '(Opcional para cambiarla)' : '*'}
                  </label>
                  <input
                    type="file"
                    className="form-input"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setNoticeForm({
                          ...noticeForm,
                          file,
                          previewMain: URL.createObjectURL(file)
                        });
                      }
                    }}
                  />
                  {noticeForm.previewMain && (
                    <div className="modal-img-preview">
                      <img src={noticeForm.previewMain} alt="Vista previa principal" />
                      <span>Vista previa de imagen principal</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="input-label">
                    Imagen Secundaria / Ilustración (Opcional)
                  </label>
                  <input
                    type="file"
                    className="form-input"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setNoticeForm({
                          ...noticeForm,
                          extraFile: file,
                          previewExtra: URL.createObjectURL(file)
                        });
                      }
                    }}
                  />
                  {noticeForm.previewExtra && (
                    <div className="modal-img-preview">
                      <img src={noticeForm.previewExtra} alt="Vista previa secundaria" />
                      <span>Vista previa de imagen secundaria</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pie de foto de la imagen */}
              <div className="form-group">
                <label className="input-label">Pie de Foto de la Imagen Principal (Opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={noticeForm.imageCaption}
                  onChange={(e) => setNoticeForm({ ...noticeForm, imageCaption: e.target.value })}
                  placeholder="Ej. Arte promocional oficial del lanzamiento"
                />
              </div>

              {/* Cita Destacada */}
              <div className="form-group">
                <label className="input-label">Cita Destacada / Quote (Opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={noticeForm.quote}
                  onChange={(e) => setNoticeForm({ ...noticeForm, quote: e.target.value })}
                  placeholder="Ej. «Lo que viene superará todas las expectativas» — Autor"
                />
              </div>

              {/* Contenido / Cuerpo */}
              <div className="form-group">
                <label className="input-label">Contenido Completo de la Noticia *</label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  placeholder="Escribe el cuerpo completo del artículo..."
                  required
                />
              </div>

              {/* Opciones: Destacada y Activa */}
              <div className="form-checkboxes-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={noticeForm.isFeatured}
                    onChange={(e) => setNoticeForm({ ...noticeForm, isFeatured: e.target.checked })}
                  />
                  <span><strong>Fijar como Noticia Destacada</strong> (aparecerá en el banner principal hero)</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={noticeForm.isActive}
                    onChange={(e) => setNoticeForm({ ...noticeForm, isActive: e.target.checked })}
                  />
                  <span><strong>Noticia Activa</strong> (visible para todos los usuarios en la web)</span>
                </label>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowNoticeModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={noticeSaving}
                >
                  {noticeSaving ? (
                    <><i className="fa fa-spinner fa-spin"></i> Guardando...</>
                  ) : editingNotice ? (
                    <><i className="fa fa-save"></i> Guardar Cambios</>
                  ) : (
                    <><i className="fa fa-paper-plane"></i> Publicar Noticia</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
