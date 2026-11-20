import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  mangasApi, 
  chaptersApi, 
  chapterReportsApi,
  genresApi, 
  mangaGenresApi, 
  scansApi, 
  scanApplicationsApi,
  filtersApi, 
  normalizePageUrl 
} from '../services/api';
import { useAuth } from '../Context/AuthContext';
import { useTheme } from '../Context/ThemeContext';
import imageHelper, { getMangaImage } from '../utils/imageHelper';
import ConfirmModal from './ConfirmModal';
import '../styles/ScanDashboard.scss';

const AUDIT_REASON_LABELS = {
  WRONG_CHAPTER: 'Capítulo incorrecto o desordenado',
  BROKEN_IMAGES: 'Imágenes rotas o faltantes',
  WRONG_MANGA: 'El capítulo pertenece a otro manga',
  BAD_QUALITY: 'Mala calidad / traducción ilegible',
  INAPPROPRIATE: 'Contenido inapropiado o spam',
  OTHER: 'Otro motivo'
};

const ScanDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', confirmText: 'Eliminar', variant: 'danger', loading: false, onConfirm: null });
  const navigate = useNavigate();

  // Pestaña activa: 'chapters' | 'mangas' | 'genres' | 'scans' | 'audits'
  const [activeTab, setActiveTab] = useState('chapters');

  // Estado general
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [scanAudits, setScanAudits] = useState([]);

  // Datos globales
  const [mangas, setMangas] = useState([]);
  const [genres, setGenres] = useState([]);
  const [demographics, setDemographics] = useState([]);
  const [mangaTypes, setMangaTypes] = useState([]);
  const [scans, setScans] = useState([]);

  // ==========================================
  // TAB 1: SUBIDA DINÁMICA DE CAPÍTULOS
  // ==========================================
  const [selectedMangaId, setSelectedMangaId] = useState('');
  const [selectedManga, setSelectedManga] = useState(null);
  const [mangaChapters, setMangaChapters] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  // Formulario nuevo capítulo
  const [chapterNumber, setChapterNumber] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [scanId, setScanId] = useState('');
  const [chapterStatus, setChapterStatus] = useState(true);

  // Páginas preparadas para subir (Drag & drop)
  // Cada item: { id, file, name, size, previewUrl }
  const [chapterPages, setChapterPages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const appendFileInputRef = useRef(null);

  // Estados para reordenamiento visual y UX avanzada
  const [draggedPageIndex, setDraggedPageIndex] = useState(null);
  const [dragOverPageIndex, setDragOverPageIndex] = useState(null);
  const [lightboxPageIndex, setLightboxPageIndex] = useState(null);
  const [editingPositionIndex, setEditingPositionIndex] = useState(null);
  const [targetPositionInput, setTargetPositionInput] = useState('');
  const [sequenceWarnings, setSequenceWarnings] = useState([]);

  // Edición de capítulo existente
  const [editingChapter, setEditingChapter] = useState(null);

  // ==========================================
  // TAB 2: GESTIÓN DE MANGAS
  // ==========================================
  const [showMangaModal, setShowMangaModal] = useState(false);
  const [mangaFormLoading, setMangaFormLoading] = useState(false);
  const [mangaSearch, setMangaSearch] = useState('');
  const [editingManga, setEditingManga] = useState(null);
  const [mangaFormData, setMangaFormData] = useState({
    mangaTittle: '',
    alternativeNames: '',
    mangaka: '',
    mangaTypeId: '',
    demographyId: '',
    editorialName: '',
    mangaDescription: '',
    status: 'Publishing',
    rating: 5,
    isAmateur: false,
    isErotic: false,
    isFeatured: false,
    selectedGenres: []
  });
  const [mangaCoverFile, setMangaCoverFile] = useState(null);
  const [mangaCoverPreview, setMangaCoverPreview] = useState('');

  // ==========================================
  // TAB 3: GESTIÓN DE GÉNEROS
  // ==========================================
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [genreFormLoading, setGenreFormLoading] = useState(false);
  const [editingGenre, setEditingGenre] = useState(null);
  const [genreName, setGenreName] = useState('');
  const [genreDescription, setGenreDescription] = useState('');
  const [genreFile, setGenreFile] = useState(null);
  const [genrePreview, setGenrePreview] = useState('');

  // ==========================================
  // TAB 4: GRUPOS SCAN
  // ==========================================
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanFormLoading, setScanFormLoading] = useState(false);
  const [newScanName, setNewScanName] = useState('');
  const [newScanDescription, setNewScanDescription] = useState('');
  const [newScanFile, setNewScanFile] = useState(null);
  const [newScanPreview, setNewScanPreview] = useState('');

  // Solicitud del usuario actual (para postulantes a scan)
  const [myApplication, setMyApplication] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({
    scanName: '',
    scanDescription: '',
    discordUrl: '',
    websiteUrl: '',
    applicationMessage: '',
    file: null,
    preview: ''
  });
  const [applyLoading, setApplyLoading] = useState(false);

  // Mostrar mensaje toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Cargar datos maestros al iniciar
  const loadMasterData = async () => {
    setLoading(true);
    try {
      const [mList, gList, dList, tList, sList, myApp, auditsList] = await Promise.all([
        mangasApi.getMangas().catch(() => []),
        filtersApi.getGenres().catch(() => []),
        filtersApi.getDemographics().catch(() => []),
        filtersApi.getMangasType().catch(() => []),
        scansApi.getScans().catch(() => []),
        isAuthenticated ? scanApplicationsApi.getMyApplication().catch(() => null) : Promise.resolve(null),
        isAuthenticated ? chapterReportsApi.getMyScanReports().catch(() => []) : Promise.resolve([])
      ]);

      setMangas(mList);
      setGenres(gList);
      setDemographics(dList);
      setMangaTypes(tList);
      setScans(sList);
      setMyApplication(myApp);
      setScanAudits(auditsList);

      if (mList.length > 0 && !selectedMangaId) {
        setSelectedMangaId(mList[0].mangaId);
      }

      // Si es un usuario Scan específico, preseleccionar su grupo exclusivo
      const isScan = user?.roleId === 3 || user?.roleName?.toUpperCase() === 'SCAN';
      const isAdminUser = user?.roleId === 2 || user?.roleName?.toUpperCase() === 'ADMIN';

      if (sList.length > 0) {
        if (isScan && !isAdminUser) {
          const userGroup = sList.find(s => 
            (user?.scanId && s.scanId === user.scanId) || 
            (user?.userId && s.createdBy === user.userId)
          ) || sList[0];
          setScanId(userGroup.scanId);
        } else if (!scanId) {
          setScanId(sList[0].scanId);
        }
      }
    } catch (err) {
      console.error('Error cargando datos maestros:', err);
      showToast('Error al cargar datos maestros del servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  // 2. Al cambiar el manga seleccionado, cargar sus capítulos
  useEffect(() => {
    if (!selectedMangaId) return;

    const found = mangas.find(m => String(m.mangaId) === String(selectedMangaId));
    setSelectedManga(found || null);

    const loadChapters = async () => {
      setChaptersLoading(true);
      try {
        const chs = await chaptersApi.getByManga(selectedMangaId);
        // Ordenar por número descendente para ver los más recientes arriba
        const sorted = [...chs].sort((a, b) => b.chapterNumber - a.chapterNumber);
        setMangaChapters(sorted);

        // Sugerir el siguiente número de capítulo
        if (sorted.length > 0) {
          const highest = Math.max(...sorted.map(c => c.chapterNumber));
          setChapterNumber(highest + 1);
        } else {
          setChapterNumber(1);
        }
      } catch (err) {
        console.warn('Error cargando capítulos del manga:', err);
        setMangaChapters([]);
        setChapterNumber(1);
      } finally {
        setChaptersLoading(false);
      }
    };

    loadChapters();
  }, [selectedMangaId, mangas]);

  // ==========================================
  // MANEJO DE ARCHIVOS DINÁMICOS DE CAPÍTULOS
  // ==========================================
  const handleFilesSelect = (filesList) => {
    if (!filesList || filesList.length === 0) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const validFiles = Array.from(filesList).filter(f => allowed.includes(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name));

    if (validFiles.length === 0) {
      showToast('Solo se permiten imágenes en formato JPG, PNG o WEBP', 'error');
      return;
    }

    // Ordenamiento natural por nombre de archivo (01, 02, ..., 10)
    validFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    const newPages = validFiles.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random()}`,
      file,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      sizeBytes: file.size,
      previewUrl: URL.createObjectURL(file)
    }));

    setChapterPages(prev => [...prev, ...newPages]);
    showToast(`Se añadieron ${newPages.length} páginas para el capítulo`);

    // Resetear los inputs de archivo para permitir re-selección
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (appendFileInputRef.current) appendFileInputRef.current.value = '';
  };

  // Drag and drop de archivos sobre la zona dropzone
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // ==========================================
  // DRAG & DROP ENTRE TARJETAS DE PÁGINAS
  // ==========================================
  const handleCardDragStart = (e, index) => {
    setDraggedPageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleCardDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverPageIndex !== index) {
      setDragOverPageIndex(index);
    }
  };

  const handleCardDragEnd = () => {
    setDraggedPageIndex(null);
    setDragOverPageIndex(null);
  };

  const handleCardDrop = (e, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedPageIndex === null || draggedPageIndex === targetIndex) {
      setDraggedPageIndex(null);
      setDragOverPageIndex(null);
      return;
    }

    setChapterPages(prev => {
      const copy = [...prev];
      const [draggedItem] = copy.splice(draggedPageIndex, 1);
      copy.splice(targetIndex, 0, draggedItem);
      return copy;
    });

    setDraggedPageIndex(null);
    setDragOverPageIndex(null);
    showToast(`Página reubicada a la posición #${targetIndex + 1}`);
  };

  // Salto directo a posición por teclado / clic
  const jumpToPosition = (fromIndex, toPositionOneBased) => {
    const parsed = parseInt(toPositionOneBased, 10);
    if (isNaN(parsed)) {
      setEditingPositionIndex(null);
      return;
    }
    const toIndex = Math.max(0, Math.min(chapterPages.length - 1, parsed - 1));
    if (fromIndex === toIndex) {
      setEditingPositionIndex(null);
      return;
    }

    setChapterPages(prev => {
      const copy = [...prev];
      const [movedItem] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, movedItem);
      return copy;
    });
    setEditingPositionIndex(null);
    showToast(`Página movida a la posición #${toIndex + 1}`);
  };

  // Reordenar páginas paso a paso
  const movePage = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= chapterPages.length) return;

    setChapterPages(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  const removePage = (index) => {
    setChapterPages(prev => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].previewUrl);
      copy.splice(index, 1);
      return copy;
    });
  };

  const clearAllPages = () => {
    if (chapterPages.length === 0) return;
    setConfirmState({
      isOpen: true,
      title: 'Quitar páginas seleccionadas',
      message: '¿Deseas quitar todas las páginas seleccionadas de la cola de subida?',
      confirmText: 'Sí, quitar todas',
      variant: 'warning',
      loading: false,
      onConfirm: () => {
        chapterPages.forEach(p => URL.revokeObjectURL(p.previewUrl));
        setChapterPages([]);
        setSequenceWarnings([]);
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const reversePagesOrder = () => {
    setChapterPages(prev => [...prev].reverse());
    showToast('Orden de páginas invertido');
  };

  const sortPagesByName = (ascending = true) => {
    setChapterPages(prev => {
      const copy = [...prev];
      copy.sort((a, b) => {
        const cmp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        return ascending ? cmp : -cmp;
      });
      return copy;
    });
    showToast(ascending ? 'Páginas ordenadas por nombre (01 → 99)' : 'Páginas ordenadas por nombre (99 → 01)');
  };

  // Detección inteligente de posibles saltos en la secuencia de páginas
  useEffect(() => {
    if (chapterPages.length < 2) {
      setSequenceWarnings([]);
      return;
    }

    const numbers = [];
    chapterPages.forEach((page, idx) => {
      // Extrae la última secuencia de dígitos antes de la extensión (ej. "ch01_p05" -> 5)
      const matches = page.name.match(/(\d+)(?!.*\d)/);
      if (matches) {
        numbers.push({ index: idx, num: parseInt(matches[1], 10), name: page.name });
      }
    });

    if (numbers.length >= Math.ceil(chapterPages.length * 0.75)) {
      const missing = [];
      for (let i = 0; i < numbers.length - 1; i++) {
        const curr = numbers[i].num;
        const next = numbers[i + 1].num;
        if (next > curr + 1) {
          const diff = next - curr - 1;
          if (diff <= 3) {
            for (let m = curr + 1; m < next; m++) {
              missing.push(m);
            }
          } else {
            missing.push(`${curr + 1}...${next - 1}`);
          }
        }
      }
      if (missing.length > 0) {
        setSequenceWarnings([`Posible salto detectado en nombres: falta página #${missing.join(', #')}`]);
      } else {
        setSequenceWarnings([]);
      }
    } else {
      setSequenceWarnings([]);
    }
  }, [chapterPages]);

  // Navegación con teclado en el modal Lightbox de zoom
  useEffect(() => {
    if (lightboxPageIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxPageIndex(null);
      if (e.key === 'ArrowLeft') {
        setLightboxPageIndex(prev => (prev > 0 ? prev - 1 : prev));
      }
      if (e.key === 'ArrowRight') {
        setLightboxPageIndex(prev => (prev < chapterPages.length - 1 ? prev + 1 : prev));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxPageIndex, chapterPages.length]);

  // Cálculo del peso total de páginas
  const totalSizeBytes = chapterPages.reduce((acc, p) => acc + (p.file?.size || p.sizeBytes || 0), 0);
  const totalSizeFormatted = totalSizeBytes > 1024 * 1024
    ? (totalSizeBytes / (1024 * 1024)).toFixed(2) + ' MB'
    : (totalSizeBytes / 1024).toFixed(1) + ' KB';

  // Subir Capítulo a la API
  const handleUploadChapter = async (e) => {
    e.preventDefault();

    if (!selectedMangaId) {
      showToast('Por favor selecciona un manga de destino', 'error');
      return;
    }

    if (!chapterNumber || isNaN(Number(chapterNumber))) {
      showToast('Ingresa un número de capítulo válido', 'error');
      return;
    }

    if (chapterPages.length === 0) {
      showToast('Debes adjuntar al menos una página para el capítulo', 'error');
      return;
    }

    if (!scanId) {
      showToast('Selecciona o registra un grupo de scanlation', 'error');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('ChapterNumber', Number(chapterNumber));
      formData.append('ChapterTitle', chapterTitle.trim() || `Capítulo ${chapterNumber}`);
      formData.append('MangaId', Number(selectedMangaId));
      formData.append('ScanId', Number(scanId));
      formData.append('ChapterStatus', chapterStatus);

      // Adjuntar páginas en su orden establecido
      chapterPages.forEach(item => {
        formData.append('Files', item.file);
      });

      setUploadProgress(40);
      const res = await chaptersApi.createChapter(formData);
      setUploadProgress(100);

      showToast(`¡Capítulo ${chapterNumber} publicado exitosamente! 🎉`, 'success');

      // Limpiar formulario de subida
      setChapterTitle('');
      chapterPages.forEach(p => URL.revokeObjectURL(p.previewUrl));
      setChapterPages([]);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Recargar capítulos del manga
      const chs = await chaptersApi.getByManga(selectedMangaId);
      const sorted = [...chs].sort((a, b) => b.chapterNumber - a.chapterNumber);
      setMangaChapters(sorted);
      if (sorted.length > 0) {
        setChapterNumber(Math.max(...sorted.map(c => c.chapterNumber)) + 1);
      }
    } catch (err) {
      console.error('Error al subir capítulo:', err);
      showToast(err.message || 'Error al procesar la subida del capítulo', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Eliminar Capítulo
  const handleDeleteChapter = (chap) => {
    if (!isAdmin && (!myScan || Number(chap.scanId) !== Number(myScan.scanId))) {
      showToast('Solo puedes eliminar capítulos subidos por tu propio Grupo Scan.', 'error');
      return;
    }

    setConfirmState({
      isOpen: true,
      title: `Eliminar Capítulo ${chap.chapterNumber}`,
      message: `¿Estás seguro de eliminar el Capítulo ${chap.chapterNumber} ("${chap.chapterTitle || 'Sin título'}")? Se eliminarán también todas sus páginas.`,
      confirmText: 'Eliminar Capítulo',
      variant: 'danger',
      loading: false,
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, loading: true }));
        try {
          await chaptersApi.deleteChapter(chap.chapterId);
          showToast(`Capítulo ${chap.chapterNumber} eliminado`);
          setMangaChapters(prev => prev.filter(c => c.chapterId !== chap.chapterId));
          setConfirmState(prev => ({ ...prev, isOpen: false, loading: false }));
        } catch (err) {
          showToast(err.message || 'Error al eliminar el capítulo', 'error');
          setConfirmState(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  // Guardar edición de capítulo
  const handleUpdateChapter = async (e) => {
    e.preventDefault();
    if (!editingChapter) return;

    try {
      const formData = new FormData();
      formData.append('ChapterId', editingChapter.chapterId);
      formData.append('ChapterNumber', editingChapter.chapterNumber);
      formData.append('ChapterTitle', editingChapter.chapterTitle);
      formData.append('ChapterStatus', editingChapter.chapterStatus);

      await chaptersApi.updateChapter(formData);
      showToast('Capítulo actualizado con éxito');

      setMangaChapters(prev => prev.map(c => c.chapterId === editingChapter.chapterId ? { ...c, ...editingChapter } : c));
      setEditingChapter(null);
    } catch (err) {
      showToast(err.message || 'Error al actualizar el capítulo', 'error');
    }
  };

  // ==========================================
  // MANEJO DE MANGAS (CREAR / EDITAR)
  // ==========================================
  const handleOpenNewManga = () => {
    setEditingManga(null);
    setMangaFormData({
      mangaTittle: '',
      alternativeNames: '',
      mangaka: '',
      mangaTypeId: mangaTypes[0]?.mangaTypeId || '1',
      demographyId: demographics[0]?.demographyId || '1',
      editorialName: 'Shueisha',
      mangaDescription: '',
      status: 'Publishing',
      rating: 5,
      isAmateur: false,
      isErotic: false,
      isFeatured: false,
      selectedGenres: []
    });
    setMangaCoverFile(null);
    setMangaCoverPreview('');
    setShowMangaModal(true);
  };

  const handleEditManga = (m) => {
    setEditingManga(m);
    setMangaFormData({
      mangaTittle: m.mangaTittle || m.mangaName || '',
      alternativeNames: m.alternativeNames || '',
      mangaka: m.mangaka || m.author || '',
      mangaTypeId: m.mangaTypeId || '1',
      demographyId: m.demographyId || '1',
      editorialName: m.editorialName || '',
      mangaDescription: m.mangaDescription || m.synopsis || '',
      status: m.status || 'Publishing',
      rating: m.rating || 5,
      isAmateur: Boolean(m.isAmateur),
      isErotic: Boolean(m.isErotic),
      isFeatured: Boolean(m.isFeatured),
      selectedGenres: []
    });
    setMangaCoverFile(null);
    setMangaCoverPreview(m.mangaFrontImgUrl ? normalizePageUrl(m.mangaFrontImgUrl) : '');
    setShowMangaModal(true);
  };

  const handleSaveManga = async (e) => {
    e.preventDefault();
    if (!mangaFormData.mangaTittle.trim()) {
      showToast('El título del manga es obligatorio', 'error');
      return;
    }

    if (!editingManga && !mangaCoverFile) {
      showToast('Debes seleccionar una imagen de portada para el nuevo manga', 'error');
      return;
    }

    setMangaFormLoading(true);
    try {
      const formData = new FormData();
      if (editingManga) {
        formData.append('MangaId', editingManga.mangaId);
      }
      formData.append('MangaTittle', mangaFormData.mangaTittle.trim());
      formData.append('AlternativeNames', mangaFormData.alternativeNames.trim());
      formData.append('Mangaka', mangaFormData.mangaka.trim());
      formData.append('MangaTypeId', Number(mangaFormData.mangaTypeId) || 1);
      if (mangaFormData.demographyId) {
        formData.append('DemographyId', Number(mangaFormData.demographyId));
      }
      formData.append('EditorialName', mangaFormData.editorialName.trim() || 'Independiente');
      formData.append('MangaDescription', mangaFormData.mangaDescription.trim());
      formData.append('Status', mangaFormData.status);
      formData.append('Rating', Number(mangaFormData.rating) || 5);
      formData.append('IsAmateur', mangaFormData.isAmateur);
      formData.append('IsErotic', mangaFormData.isErotic);
      formData.append('IsFeatured', mangaFormData.isFeatured);

      if (mangaCoverFile) {
        formData.append('File', mangaCoverFile);
      }

      if (editingManga) {
        await mangasApi.updateManga(formData);
        showToast(`Manga "${mangaFormData.mangaTittle}" actualizado exitosamente`);
      } else {
        const res = await mangasApi.createManga(formData);
        const newMangaId = res?.items?.[0]?.mangaId || res?.mangaId;

        // Si se seleccionaron géneros, asociarlos
        if (newMangaId && mangaFormData.selectedGenres.length > 0) {
          for (const gId of mangaFormData.selectedGenres) {
            try {
              await mangaGenresApi.linkGenre(newMangaId, gId);
            } catch (err) {
              console.warn('Error vinculando género:', err);
            }
          }
        }
        showToast(`¡Manga "${mangaFormData.mangaTittle}" creado exitosamente!`);
      }

      setShowMangaModal(false);
      // Recargar mangas
      const fresh = await mangasApi.getMangas();
      setMangas(fresh);
    } catch (err) {
      console.error('Error guardando manga:', err);
      showToast(err.message || 'Error al guardar el manga', 'error');
    } finally {
      setMangaFormLoading(false);
    }
  };

  const handleDeleteManga = (m) => {
    if (!isAdmin) {
      showToast('Solo los administradores pueden eliminar mangas.', 'error');
      return;
    }

    setConfirmState({
      isOpen: true,
      title: 'Eliminar Manga',
      message: `¿Estás seguro de eliminar el manga "${m.mangaTittle || m.mangaName}"? Esta acción borrará también todos sus capítulos.`,
      confirmText: 'Eliminar Manga',
      variant: 'danger',
      loading: false,
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, loading: true }));
        try {
          await mangasApi.deleteManga(m.mangaId);
          showToast(`Manga "${m.mangaTittle || m.mangaName}" eliminado`);
          setMangas(prev => prev.filter(item => item.mangaId !== m.mangaId));
          if (selectedMangaId === m.mangaId) {
            setSelectedMangaId('');
          }
          setConfirmState(prev => ({ ...prev, isOpen: false, loading: false }));
        } catch (err) {
          showToast(err.message || 'Error al eliminar el manga', 'error');
          setConfirmState(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  // ==========================================
  // MANEJO DE GÉNEROS (CREAR / EDITAR)
  // ==========================================
  const handleOpenNewGenre = () => {
    setEditingGenre(null);
    setGenreName('');
    setGenreDescription('');
    setGenreFile(null);
    setGenrePreview('');
    setShowGenreModal(true);
  };

  const handleEditGenre = (g) => {
    setEditingGenre(g);
    setGenreName(g.genreName || '');
    setGenreDescription(g.genreDescription || '');
    setGenreFile(null);
    setGenrePreview(g.genreImgUrl ? normalizePageUrl(g.genreImgUrl) : '');
    setShowGenreModal(true);
  };

  const handleSaveGenre = async (e) => {
    e.preventDefault();
    if (!genreName.trim()) {
      showToast('Ingresa el nombre del género', 'error');
      return;
    }

    setGenreFormLoading(true);
    try {
      const formData = new FormData();
      if (editingGenre) {
        formData.append('GenreId', editingGenre.genreId);
      }
      formData.append('GenreName', genreName.trim());
      formData.append('GenreDescription', genreDescription.trim());
      if (genreFile) {
        formData.append('File', genreFile);
      }

      if (editingGenre) {
        await genresApi.updateGenre(formData);
        showToast(`Género "${genreName}" actualizado`);
      } else {
        await genresApi.createGenre(formData);
        showToast(`Género "${genreName}" creado con éxito`);
      }

      setShowGenreModal(false);
      const freshGenres = await filtersApi.getGenres();
      setGenres(freshGenres);
    } catch (err) {
      showToast(err.message || 'Error al guardar género', 'error');
    } finally {
      setGenreFormLoading(false);
    }
  };

  const handleDeleteGenre = (g) => {
    setConfirmState({
      isOpen: true,
      title: 'Eliminar Género',
      message: `¿Estás seguro de eliminar el género "${g.genreName}"?`,
      confirmText: 'Eliminar Género',
      variant: 'danger',
      loading: false,
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, loading: true }));
        try {
          await genresApi.deleteGenre(g.genreId);
          showToast(`Género "${g.genreName}" eliminado`);
          setGenres(prev => prev.filter(item => item.genreId !== g.genreId));
          setConfirmState(prev => ({ ...prev, isOpen: false, loading: false }));
        } catch (err) {
          showToast(err.message || 'Error al eliminar género', 'error');
          setConfirmState(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  // ==========================================
  // MANEJO DE GRUPOS SCAN
  // ==========================================
  const handleSaveScan = async (e) => {
    e.preventDefault();
    if (!newScanName.trim()) {
      showToast('Ingresa el nombre del grupo scan', 'error');
      return;
    }

    setScanFormLoading(true);
    try {
      const formData = new FormData();
      formData.append('ScanName', newScanName.trim());
      formData.append('ScanDescription', newScanDescription.trim() || 'Grupo de scanlation');
      formData.append('EmailNotificaction', 1);
      formData.append('ScanStatus', true);
      if (newScanFile) {
        formData.append('File', newScanFile);
      }

      await scansApi.createScan(formData);
      showToast(`Grupo Scan "${newScanName}" creado`);
      setShowScanModal(false);
      setNewScanName('');
      setNewScanDescription('');
      setNewScanFile(null);
      setNewScanPreview('');

      const freshScans = await scansApi.getScans();
      setScans(freshScans);
    } catch (err) {
      showToast(err.message || 'Error al registrar grupo scan', 'error');
    } finally {
      setScanFormLoading(false);
    }
  };

  // ==========================================
  // MANEJO DE POSTULACIÓN DE SCAN (CLIENTES)
  // ==========================================
  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!applyForm.scanName.trim()) {
      showToast('Ingresa el nombre del grupo de scan', 'error');
      return;
    }
    if (!applyForm.scanDescription.trim()) {
      showToast('Ingresa una descripción de tu grupo', 'error');
      return;
    }

    setApplyLoading(true);
    try {
      const formData = new FormData();
      formData.append('ScanName', applyForm.scanName.trim());
      formData.append('ScanDescription', applyForm.scanDescription.trim());
      if (applyForm.discordUrl.trim()) formData.append('DiscordUrl', applyForm.discordUrl.trim());
      if (applyForm.websiteUrl.trim()) formData.append('WebsiteUrl', applyForm.websiteUrl.trim());
      if (applyForm.applicationMessage.trim()) formData.append('ApplicationMessage', applyForm.applicationMessage.trim());
      formData.append('EmailNotification', 'false');
      if (applyForm.file) {
        formData.append('File', applyForm.file);
      }

      await scanApplicationsApi.apply(formData);
      showToast('¡Solicitud enviada con éxito! Será revisada por los administradores.');
      setShowApplyModal(false);

      const updatedApp = await scanApplicationsApi.getMyApplication();
      setMyApplication(updatedApp);
    } catch (err) {
      showToast(err.message || 'Error al enviar la solicitud', 'error');
    } finally {
      setApplyLoading(false);
    }
  };

  // Verificación de autenticación y rol
  const isAdmin = isAuthenticated && (
    user?.roleId === 2 || 
    user?.roleName?.toUpperCase() === 'ADMIN'
  );

  const isScanRole = isAuthenticated && (
    user?.roleId === 3 || 
    user?.roleName?.toUpperCase() === 'SCAN'
  );

  const isAuthorized = isAdmin || isScanRole;

  // Encontrar el grupo de scan exclusivo del usuario
  const myScan = scans.find(s => 
    (user?.scanId && s.scanId === user.scanId) || 
    (user?.userId && s.createdBy === user.userId)
  ) || (scans.length > 0 && isScanRole && !isAdmin ? scans[0] : null);

  // Filtrado de mangas en Tab 2
  const filteredMangas = mangas.filter(m => {
    const q = mangaSearch.toLowerCase();
    const title = (m.mangaTittle || m.mangaName || '').toLowerCase();
    const author = (m.mangaka || m.author || '').toLowerCase();
    return title.includes(q) || author.includes(q);
  });

  return (
    <div className={`scan-dashboard-wrapper theme-${theme}`}>
      {/* Toast de notificaciones */}
      {toast && (
        <div className={`dashboard-toast toast-${toast.type}`}>
          <i className={`fa ${toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Control de Acceso no autorizado */}
      {!isAuthenticated ? (
        <div className="auth-guard-container">
          <div className="guard-card">
            <i className="fa fa-lock guard-icon"></i>
            <h2>Acceso Restringido al Panel de Scan</h2>
            <p>Debes iniciar sesión con una cuenta de Scan o Administrador para gestionar y subir contenido.</p>
            <div className="guard-actions">
              <Link to="/login" className="btn-primary">
                <i className="fa fa-sign-in"></i> Iniciar Sesión
              </Link>
              <Link to="/manga-section" className="btn-secondary">
                <i className="fa fa-th-large"></i> Volver a la Biblioteca
              </Link>
            </div>
          </div>
        </div>
      ) : !isAuthorized ? (
        <div className="auth-guard-container">
          <div className="guard-card">
            {myApplication && myApplication.status === 'PENDING' ? (
              <>
                <i className="fa fa-clock-o guard-icon warning"></i>
                <h2>Solicitud en Revisión</h2>
                <p>
                  Has postulado al grupo <strong>"{myApplication.scanName}"</strong> el {new Date(myApplication.createdAt).toLocaleDateString()}.
                </p>
                <div className="guard-hint" style={{ marginTop: '8px', padding: '10px 14px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <i className="fa fa-info-circle"></i> Nuestro equipo de administración está revisando tu solicitud. Una vez aprobada, se te otorgará automáticamente el rol de <strong>Scan</strong> y podrás acceder a este panel.
                </div>
                <div className="guard-actions">
                  <Link to="/profile" className="btn-secondary">
                    <i className="fa fa-user"></i> Ver Mi Perfil
                  </Link>
                  <Link to="/manga-section" className="btn-primary">
                    <i className="fa fa-book"></i> Explorar Mangas
                  </Link>
                </div>
              </>
            ) : myApplication && myApplication.status === 'REJECTED' ? (
              <>
                <i className="fa fa-times-circle guard-icon" style={{ color: '#ef4444' }}></i>
                <h2>Solicitud No Aprobada</h2>
                <p>
                  Tu postulación para <strong>"{myApplication.scanName}"</strong> no fue aprobada por los administradores.
                </p>
                {myApplication.adminNotes && (
                  <div className="guard-hint" style={{ marginTop: '8px', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    Motivo: <em>"{myApplication.adminNotes}"</em>
                  </div>
                )}
                <div className="guard-actions">
                  <button type="button" className="btn-primary" onClick={() => setShowApplyModal(true)}>
                    <i className="fa fa-refresh"></i> Enviar Nueva Solicitud
                  </button>
                  <Link to="/manga-section" className="btn-secondary">
                    <i className="fa fa-book"></i> Explorar Biblioteca
                  </Link>
                </div>
              </>
            ) : (
              <>
                <i className="fa fa-users guard-icon"></i>
                <h2>¿Perteneces a un Scan de Manga?</h2>
                <p>
                  Estás conectado como <strong>{user?.username}</strong> ({user?.roleName || 'Cliente'}). Para subir capítulos y publicar proyectos en la plataforma, solicita la aprobación de tu grupo de scanlation.
                </p>
                <div className="guard-actions">
                  <button type="button" className="btn-primary" onClick={() => setShowApplyModal(true)}>
                    <i className="fa fa-paper-plane"></i> Postular Mi Grupo de Scan
                  </button>
                  <Link to="/manga-section" className="btn-secondary">
                    <i className="fa fa-book"></i> Explorar Mangas
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="dashboard-content-container">
          {/* HEADER DEL PANEL */}
          <header className="dashboard-header">
            <div className="header-meta">
              <div className="badge-role">
                <i className="fa fa-pencil-square-o"></i> Panel de Scanlation
              </div>
              <h1 className="header-title">Centro de Gestión y Publicación</h1>
              <p className="header-desc">
                Sube nuevos capítulos con previsualización dinámica, registra obras manga y administra los géneros de la plataforma.
              </p>
            </div>

            <div className="user-status-card">
              <div className="status-avatar">
                <i className="fa fa-user-circle"></i>
              </div>
              <div className="status-info">
                <span className="user-name">{user?.username || 'Admin'}</span>
                <span className="user-badge">{user?.roleName || 'SCAN / ADMIN'}</span>
              </div>
            </div>
          </header>

          {/* TARJETAS DE ESTADÍSTICAS RÁPIDAS */}
          <section className="stats-row">
            <div className="stat-card">
              <div className="stat-icon icon-manga">
                <i className="fa fa-book"></i>
              </div>
              <div className="stat-data">
                <span className="stat-value">{mangas.length}</span>
                <span className="stat-label">Mangas Registrados</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon icon-chapters">
                <i className="fa fa-file-text-o"></i>
              </div>
              <div className="stat-data">
                <span className="stat-value">{mangaChapters.length}</span>
                <span className="stat-label">Capítulos ({selectedManga?.mangaTittle || 'Seleccionado'})</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon icon-genres">
                <i className="fa fa-tags"></i>
              </div>
              <div className="stat-data">
                <span className="stat-value">{genres.length}</span>
                <span className="stat-label">Géneros Disponibles</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon icon-scans">
                <i className="fa fa-users"></i>
              </div>
              <div className="stat-data">
                <span className="stat-value">{scans.length}</span>
                <span className="stat-label">Grupos Scan</span>
              </div>
            </div>
          </section>

          {/* NAVEGACIÓN POR PESTAÑAS */}
          <nav className="dashboard-nav-tabs">
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'chapters' ? 'active' : ''}`}
              onClick={() => setActiveTab('chapters')}
            >
              <i className="fa fa-cloud-upload"></i> Subir Capítulos
            </button>
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'mangas' ? 'active' : ''}`}
              onClick={() => setActiveTab('mangas')}
            >
              <i className="fa fa-book"></i> Gestionar Mangas
            </button>
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'genres' ? 'active' : ''}`}
              onClick={() => setActiveTab('genres')}
            >
              <i className="fa fa-tags"></i> Géneros
            </button>
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'scans' ? 'active' : ''}`}
              onClick={() => setActiveTab('scans')}
            >
              <i className="fa fa-users"></i> Grupos Scan
            </button>
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'audits' ? 'active' : ''}`}
              onClick={() => setActiveTab('audits')}
            >
              <i className="fa fa-exclamation-triangle"></i> Auditorías ({scanAudits.length})
            </button>
          </nav>

          {/* Aviso destacado si el Scan Group tiene advertencias o capítulos sancionados */}
          {scanAudits.some(a => a.actionTaken === 'SCAN_WARNED' || a.actionTaken === 'HIDE_CHAPTER' || a.actionTaken === 'CHAPTER_DELETED') && activeTab !== 'audits' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '12px 18px',
                marginBottom: '18px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.14)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                color: 'inherit'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px' }}>
                <i className="fa fa-exclamation-triangle" style={{ color: '#f59e0b', fontSize: '18px' }}></i>
                <span>
                  Tu Grupo Scan tiene <strong>{scanAudits.filter(a => a.actionTaken === 'SCAN_WARNED' || a.actionTaken === 'HIDE_CHAPTER' || a.actionTaken === 'CHAPTER_DELETED').length}</strong> notificación(es) o advertencia(s) de auditoría administrativa.
                </span>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setActiveTab('audits')}
                style={{ padding: '6px 14px', fontSize: '12.5px' }}
              >
                <i className="fa fa-eye"></i> Revisar Auditorías
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: SUBIDA DINÁMICA DE CAPÍTULOS                       */}
          {/* ========================================================= */}
          {activeTab === 'chapters' && (
            <div className="tab-pane chapters-tab">
              <div className="chapter-split-layout">
                {/* Columna Izquierda: Formulario de Subida Dinámica */}
                <div className="upload-form-column">
                  <div className="panel-box">
                    <h2 className="box-title">
                      <i className="fa fa-upload"></i> Publicar Nuevo Capítulo
                    </h2>

                    <form onSubmit={handleUploadChapter} className="chapter-form">
                      {/* Paso 1: Seleccionar Manga */}
                      <div className="form-group">
                        <label className="input-label">
                          <i className="fa fa-book"></i> 1. Selecciona el Manga de Destino *
                        </label>
                        <select
                          className="form-select manga-picker-select"
                          value={selectedMangaId}
                          onChange={(e) => setSelectedMangaId(e.target.value)}
                          required
                        >
                          <option value="">-- Elige un manga --</option>
                          {mangas.map(m => (
                            <option key={m.mangaId} value={m.mangaId}>
                              {m.mangaTittle || m.mangaName} ({m.mangaTypeName || 'Manga'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Resumen del manga seleccionado */}
                      {selectedManga && (
                        <div className="selected-manga-summary">
                          <img
                            src={getMangaImage(selectedManga)}
                            alt={selectedManga.mangaTittle}
                            className="summary-cover"
                            onError={(e) => { e.target.onerror = null; e.target.src = imageHelper.defaultManga; }}
                          />
                          <div className="summary-details">
                            <h4>{selectedManga.mangaTittle || selectedManga.mangaName}</h4>
                            <p>Autor: <strong>{selectedManga.mangaka || selectedManga.author || 'Desconocido'}</strong></p>
                            <p>Capítulos subidos: <strong>{mangaChapters.length}</strong></p>
                            <span className="summary-badge">{selectedManga.status || 'Publishing'}</span>
                          </div>
                        </div>
                      )}

                      {/* Paso 2: Metadatos del Capítulo */}
                      <div className="form-row">
                        <div className="form-group col-half">
                          <label className="input-label">
                            <i className="fa fa-hashtag"></i> 2. Número de Capítulo *
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            className="form-input"
                            value={chapterNumber}
                            onChange={(e) => setChapterNumber(e.target.value)}
                            placeholder="Ej. 1"
                            required
                          />
                        </div>

                        <div className="form-group col-half">
                          <label className="input-label">
                            <i className="fa fa-users"></i> Grupo Scan *
                          </label>
                          {isAdmin ? (
                            <select
                              className="form-select"
                              value={scanId}
                              onChange={(e) => setScanId(e.target.value)}
                              required
                            >
                              <option value="">-- Selecciona Scan --</option>
                              {scans.map(s => (
                                <option key={s.scanId} value={s.scanId}>
                                  {s.scanName}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="exclusive-scan-lock-badge" title="Este capítulo se publicará a nombre de tu grupo exclusivo">
                              <i className="fa fa-flag"></i>
                              <span><strong>{myScan?.scanName || 'Tu Grupo Scan'}</strong> (#{myScan?.scanId || scanId})</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="input-label">
                          <i className="fa fa-pencil"></i> Título del Capítulo (Opcional)
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={chapterTitle}
                          onChange={(e) => setChapterTitle(e.target.value)}
                          placeholder="Ej. The Death and the Strawberry"
                        />
                      </div>

                      {/* Paso 3: Subida Dinámica de Páginas (Drag & Drop) */}
                      <div className="form-group pages-upload-section">
                        <div className="dropzone-header">
                          <label className="input-label">
                            <i className="fa fa-picture-o"></i> 3. Páginas del Capítulo ({chapterPages.length} seleccionadas) *
                          </label>
                          {chapterPages.length > 0 && (
                            <div className="dropzone-actions-bar">
                              <button
                                type="button"
                                className="btn-action-tool"
                                onClick={() => sortPagesByName(true)}
                                title="Ordenar automáticamente por nombre (01 → 99)"
                              >
                                <i className="fa fa-sort-numeric-asc"></i> 01 → 99
                              </button>
                              <button
                                type="button"
                                className="btn-action-tool"
                                onClick={() => sortPagesByName(false)}
                                title="Ordenar automáticamente por nombre (99 → 01)"
                              >
                                <i className="fa fa-sort-numeric-desc"></i> 99 → 01
                              </button>
                              <button
                                type="button"
                                className="btn-action-tool"
                                onClick={reversePagesOrder}
                                title="Invertir el orden actual de las páginas"
                              >
                                <i className="fa fa-exchange"></i> Invertir
                              </button>
                              <button
                                type="button"
                                className="btn-action-tool btn-tool-add"
                                onClick={() => appendFileInputRef.current && appendFileInputRef.current.click()}
                                title="Añadir más páginas a la lista"
                              >
                                <i className="fa fa-plus-circle"></i> Añadir más
                              </button>
                              <button
                                type="button"
                                className="btn-action-tool danger"
                                onClick={clearAllPages}
                                title="Quitar todas las páginas"
                              >
                                <i className="fa fa-trash"></i> Vaciar
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Alerta de detección de saltos en secuencia */}
                        {sequenceWarnings.length > 0 && (
                          <div className="sequence-warning-banner">
                            <i className="fa fa-exclamation-triangle"></i>
                            <div className="warning-content">
                              <strong>Advertencia de secuencia:</strong>
                              <span>{sequenceWarnings.join(' · ')}</span>
                            </div>
                          </div>
                        )}

                        {/* Zona interactiva Dropzone */}
                        <div
                          className={`dropzone-area ${chapterPages.length > 0 ? 'compact' : ''}`}
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFilesSelect(e.target.files)}
                          />
                          <input
                            ref={appendFileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFilesSelect(e.target.files)}
                          />
                          <div className="dropzone-prompt">
                            <i className="fa fa-cloud-upload dropzone-icon"></i>
                            <p className="prompt-main">
                              {chapterPages.length > 0
                                ? 'Arrastra o haz clic para añadir más páginas'
                                : 'Arrastra y suelta aquí las páginas del capítulo'}
                            </p>
                            <p className="prompt-sub">
                              Formatos JPG, PNG, WEBP. Puedes reordenar arrastrando las miniaturas o haciendo clic en el número de página.
                            </p>
                          </div>
                        </div>

                        {/* Cuadrícula de Previsualización Dinámica con Drag & Drop y Reordenamiento */}
                        {chapterPages.length > 0 && (
                          <div className="pages-preview-container">
                            <div className="preview-grid-toolbar">
                              <span className="grid-hint">
                                <i className="fa fa-info-circle"></i> Arrastra las tarjetas para reordenar, o haz clic en <strong>#</strong> para editar la posición.
                              </span>
                              <span className="grid-weight">
                                <i className="fa fa-database"></i> Peso total: <strong>{totalSizeFormatted}</strong>
                              </span>
                            </div>

                            <div className="pages-preview-grid">
                              {chapterPages.map((page, index) => {
                                const isDragging = draggedPageIndex === index;
                                const isDragOver = dragOverPageIndex === index;
                                const isEditingPos = editingPositionIndex === index;

                                return (
                                  <div
                                    key={page.id}
                                    className={`page-thumbnail-card ${isDragging ? 'is-dragging' : ''} ${isDragOver ? 'is-drag-over' : ''} ${index === 0 ? 'is-cover' : ''}`}
                                    draggable={!isEditingPos}
                                    onDragStart={(e) => handleCardDragStart(e, index)}
                                    onDragOver={(e) => handleCardDragOver(e, index)}
                                    onDragEnd={handleCardDragEnd}
                                    onDrop={(e) => handleCardDrop(e, index)}
                                  >
                                    <div
                                      className="thumbnail-wrapper"
                                      onDoubleClick={() => setLightboxPageIndex(index)}
                                      title="Doble clic para ver en tamaño completo"
                                    >
                                      <img src={page.previewUrl} alt={page.name} />

                                      {/* Badge de Portada para la página #1 */}
                                      {index === 0 && (
                                        <span className="cover-badge">
                                          <i className="fa fa-bookmark"></i> PORTADA
                                        </span>
                                      )}

                                      {/* Badge o Input de número de página */}
                                      {isEditingPos ? (
                                        <div className="page-position-editor" onClick={(e) => e.stopPropagation()}>
                                          <span>#</span>
                                          <input
                                            type="number"
                                            min="1"
                                            max={chapterPages.length}
                                            value={targetPositionInput}
                                            onChange={(e) => setTargetPositionInput(e.target.value)}
                                            onBlur={() => jumpToPosition(index, targetPositionInput)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') jumpToPosition(index, targetPositionInput);
                                              if (e.key === 'Escape') setEditingPositionIndex(null);
                                            }}
                                            autoFocus
                                          />
                                        </div>
                                      ) : (
                                        <span
                                          className="page-order-badge clickable"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingPositionIndex(index);
                                            setTargetPositionInput(String(index + 1));
                                          }}
                                          title="Clic para escribir otra posición"
                                        >
                                          #{index + 1} <i className="fa fa-pencil"></i>
                                        </span>
                                      )}

                                      {/* Botón flotante para zoom / Lightbox */}
                                      <button
                                        type="button"
                                        className="btn-card-zoom"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setLightboxPageIndex(index);
                                        }}
                                        title="Inspeccionar página en grande"
                                      >
                                        <i className="fa fa-search-plus"></i>
                                      </button>
                                    </div>

                                    <div className="thumbnail-info">
                                      <span className="file-name" title={page.name}>{page.name}</span>
                                      <span className="file-size">{page.size}</span>
                                    </div>

                                    <div className="thumbnail-controls">
                                      <button
                                        type="button"
                                        className="btn-order"
                                        onClick={() => movePage(index, -1)}
                                        disabled={index === 0}
                                        title="Mover antes"
                                      >
                                        <i className="fa fa-arrow-left"></i>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-remove"
                                        onClick={() => removePage(index)}
                                        title="Eliminar esta página"
                                      >
                                        <i className="fa fa-times"></i>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-order"
                                        onClick={() => movePage(index, 1)}
                                        disabled={index === chapterPages.length - 1}
                                        title="Mover después"
                                      >
                                        <i className="fa fa-arrow-right"></i>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Resumen de Pre-vuelo (Pre-flight Check) */}
                      {chapterPages.length > 0 && selectedManga && (
                        <div className="preflight-summary-card">
                          <div className="summary-cover-thumb">
                            <img src={chapterPages[0].previewUrl} alt="Portada" />
                            <span className="cover-label">Pág. #1</span>
                          </div>
                          <div className="summary-info-col">
                            <h4 className="summary-title">
                              <i className="fa fa-check-circle"></i> Capítulo {chapterNumber || '?'} listo para publicación
                            </h4>
                            <p className="summary-manga">
                              Manga destino: <strong>{selectedManga.mangaTittle}</strong>
                            </p>
                            <div className="summary-tags-row">
                              <span className="summary-tag">
                                <i className="fa fa-files-o"></i> {chapterPages.length} páginas
                              </span>
                              <span className="summary-tag">
                                <i className="fa fa-database"></i> {totalSizeFormatted}
                              </span>
                              <span className="summary-tag">
                                <i className="fa fa-file-image-o"></i> Cierre: Pág. #{chapterPages.length} ({chapterPages[chapterPages.length - 1].name})
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Barra de progreso de subida */}
                      {uploading && (
                        <div className="upload-progress-box">
                          <div className="progress-info">
                            <span>Subiendo y procesando páginas en el servidor...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                        </div>
                      )}

                      {/* Botón de envío */}
                      <button
                        type="submit"
                        className="btn-submit-upload"
                        disabled={uploading || chapterPages.length === 0}
                      >
                        {uploading ? (
                          <>
                            <i className="fa fa-spinner fa-spin"></i> Subiendo Capítulo...
                          </>
                        ) : (
                          <>
                            <i className="fa fa-cloud-upload"></i> Publicar Capítulo ({chapterPages.length} Páginas)
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Columna Derecha: Lista de Capítulos del Manga Seleccionado */}
                <div className="chapters-list-column">
                  <div className="panel-box">
                    <div className="box-header-row">
                      <h2 className="box-title">
                        <i className="fa fa-list-ol"></i> Capítulos de {selectedManga?.mangaTittle || 'Manga'} ({mangaChapters.length})
                      </h2>
                      {selectedManga && (
                        <Link
                          to={`/manga/${selectedManga.mangaId}`}
                          className="btn-link-action"
                          title="Ver en la vista pública"
                        >
                          <i className="fa fa-external-link"></i> Ver Manga
                        </Link>
                      )}
                    </div>

                    {chaptersLoading ? (
                      <div className="loading-state">
                        <i className="fa fa-spinner fa-spin"></i>
                        <p>Cargando capítulos...</p>
                      </div>
                    ) : mangaChapters.length === 0 ? (
                      <div className="empty-state">
                        <i className="fa fa-book-open"></i>
                        <p>Este manga aún no tiene capítulos subidos.</p>
                        <span>¡Sé el primero en publicar el capítulo 1 usando el formulario de la izquierda!</span>
                      </div>
                    ) : (
                      <div className="chapters-table-wrapper">
                        <table className="dashboard-table">
                          <thead>
                            <tr>
                              <th>Capítulo</th>
                              <th>Título</th>
                              <th>Fecha</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mangaChapters.map(chap => {
                              const canModifyChapter = isAdmin || (myScan && Number(chap.scanId) === Number(myScan.scanId));
                              return (
                                <tr key={chap.chapterId}>
                                  <td className="chapter-col-number">
                                    <strong>Cap. {chap.chapterNumber}</strong>
                                  </td>
                                  <td className="chapter-col-title">
                                    <span>{chap.chapterTitle || 'Sin título'}</span>
                                    {chap.scanName && (
                                      <span style={{ marginLeft: '8px', fontSize: '11px', opacity: 0.75 }}>
                                        ({chap.scanName})
                                      </span>
                                    )}
                                  </td>
                                  <td className="chapter-col-date">
                                    {chap.uploadedAt ? chap.uploadedAt.substring(0, 10) : 'Reciente'}
                                  </td>
                                  <td className="chapter-col-actions">
                                    <Link
                                      to={`/manga/${selectedMangaId}/chapter/${chap.chapterId}`}
                                      className="btn-action-read"
                                      title="Leer en el visor"
                                    >
                                      <i className="fa fa-eye"></i>
                                    </Link>
                                    {canModifyChapter && (
                                      <>
                                        <button
                                          type="button"
                                          className="btn-action-edit"
                                          onClick={() => setEditingChapter({ ...chap })}
                                          title="Editar datos"
                                        >
                                          <i className="fa fa-pencil"></i>
                                        </button>
                                        <button
                                          type="button"
                                          className="btn-action-delete"
                                          onClick={() => handleDeleteChapter(chap)}
                                          title="Eliminar capítulo y páginas"
                                        >
                                          <i className="fa fa-trash"></i>
                                        </button>
                                      </>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: GESTIÓN DE MANGAS (CRUD)                           */}
          {/* ========================================================= */}
          {activeTab === 'mangas' && (
            <div className="tab-pane mangas-tab">
              <div className="panel-box">
                <div className="box-header-row">
                  <div className="box-title-group">
                    <h2 className="box-title">
                      <i className="fa fa-book"></i> Catálogo de Mangas ({filteredMangas.length})
                    </h2>
                    <p className="box-subtitle">Registra nuevas obras, actualiza sinopsis, demografías y géneros.</p>
                  </div>

                  <div className="header-actions">
                    <div className="search-bar-inline">
                      <i className="fa fa-search"></i>
                      <input
                        type="text"
                        placeholder="Buscar manga o autor..."
                        value={mangaSearch}
                        onChange={(e) => setMangaSearch(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleOpenNewManga}
                    >
                      <i className="fa fa-plus"></i> Registrar Manga
                    </button>
                  </div>
                </div>

                {filteredMangas.length === 0 ? (
                  <div className="empty-state">
                    <i className="fa fa-search"></i>
                    <p>No se encontraron mangas con los criterios de búsqueda.</p>
                  </div>
                ) : (
                  <div className="mangas-grid">
                    {filteredMangas.map(m => (
                      <div key={m.mangaId} className="manga-admin-card">
                        <div className="manga-card-cover-box">
                          <img
                            src={getMangaImage(m)}
                            alt={m.mangaTittle || m.mangaName}
                            className="card-cover-img"
                            onError={(e) => { e.target.onerror = null; e.target.src = imageHelper.defaultManga; }}
                          />
                          <span className={`card-type-tag ${m.mangaTypeName || 'Manga'}`}>
                            {m.mangaTypeName || 'Manga'}
                          </span>
                        </div>
                        <div className="manga-card-body">
                          <h3 className="manga-name">{m.mangaTittle || m.mangaName}</h3>
                          <p className="manga-author">Autor: <span>{m.mangaka || m.author || 'Desconocido'}</span></p>
                          <p className="manga-demography">Demografía: <span>{m.demographyName || 'General'}</span></p>
                          <div className="manga-tags-row">
                            <span className="badge-status">{m.status || 'Publishing'}</span>
                            <span className="badge-rating"><i className="fa fa-star"></i> {m.rating || 5}</span>
                          </div>
                        </div>
                        <div className="manga-card-footer">
                          <button
                            type="button"
                            className="btn-card-action upload"
                            onClick={() => {
                              setSelectedMangaId(m.mangaId);
                              setActiveTab('chapters');
                            }}
                            title="Subir capítulos a este manga"
                          >
                            <i className="fa fa-upload"></i> Subir Cap.
                          </button>
                          <button
                            type="button"
                            className="btn-card-action edit"
                            onClick={() => handleEditManga(m)}
                            title="Editar información"
                          >
                            <i className="fa fa-pencil"></i>
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              className="btn-card-action delete"
                              onClick={() => handleDeleteManga(m)}
                              title="Eliminar manga"
                            >
                              <i className="fa fa-trash"></i>
                            </button>
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
          {/* TAB 3: GESTIÓN DE GÉNEROS (CRUD)                          */}
          {/* ========================================================= */}
          {activeTab === 'genres' && (
            <div className="tab-pane genres-tab">
              <div className="panel-box">
                <div className="box-header-row">
                  <div className="box-title-group">
                    <h2 className="box-title">
                      <i className="fa fa-tags"></i> Géneros de la Plataforma ({genres.length})
                    </h2>
                    <p className="box-subtitle">Crea nuevos géneros con imagen ilustrativa o edita los existentes.</p>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleOpenNewGenre}
                  >
                    <i className="fa fa-plus"></i> Crear Género
                  </button>
                </div>

                <div className="genres-grid-admin">
                  {genres.map(g => (
                    <div key={g.genreId} className="genre-admin-card">
                      <div className="genre-card-img-box">
                        {g.genreImgUrl ? (
                          <img src={normalizePageUrl(g.genreImgUrl)} alt={g.genreName} />
                        ) : (
                          <div className="genre-card-placeholder">
                            <i className="fa fa-tag"></i>
                          </div>
                        )}
                      </div>
                      <div className="genre-card-content">
                        <h4 className="genre-title">{g.genreName}</h4>
                        <p className="genre-desc">{g.genreDescription || 'Sin descripción'}</p>
                      </div>
                      <div className="genre-card-actions">
                        <button
                          type="button"
                          className="btn-action-edit"
                          onClick={() => handleEditGenre(g)}
                          title="Editar género"
                        >
                          <i className="fa fa-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="btn-action-delete"
                          onClick={() => handleDeleteGenre(g)}
                          title="Eliminar género"
                        >
                          <i className="fa fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: GRUPOS SCAN                                        */}
          {/* ========================================================= */}
          {activeTab === 'scans' && (
            <div className="tab-pane scans-tab">
              <div className="panel-box">
                {isScanRole && !isAdmin && myScan ? (
                  <div className="my-exclusive-scan-container">
                    <div className="box-header-row">
                      <div className="box-title-group">
                        <h2 className="box-title">
                          <i className="fa fa-flag"></i> Mi Grupo de Scan: {myScan.scanName}
                        </h2>
                        <p className="box-subtitle">Panel exclusivo de administración y métricas de tu equipo de scanlation.</p>
                      </div>
                    </div>

                    <div className="my-scan-hero-card">
                      <div className="hero-avatar-box">
                        {myScan.scanImgUrl ? (
                          <img src={normalizePageUrl(myScan.scanImgUrl)} alt={myScan.scanName} />
                        ) : (
                          <i className="fa fa-flag"></i>
                        )}
                      </div>
                      <div className="hero-details">
                        <div className="hero-title-row">
                          <h3>{myScan.scanName}</h3>
                          <span className="hero-status-pill active">Activo</span>
                        </div>
                        <p className="hero-desc">{myScan.scanDescription || 'Grupo de traducción, edición y maquetación de manga.'}</p>
                        <div className="hero-meta-row">
                          <span><i className="fa fa-id-card"></i> <strong>ID Grupo:</strong> #{myScan.scanId}</span>
                          <span><i className="fa fa-user"></i> <strong>Miembro:</strong> {user?.username}</span>
                          <span><i className="fa fa-file-text-o"></i> <strong>Capítulos en plataforma:</strong> {mangaChapters.filter(c => c.scanId === myScan.scanId).length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="box-header-row">
                      <div className="box-title-group">
                        <h2 className="box-title">
                          <i className="fa fa-users"></i> Grupos de Scanlation ({scans.length})
                        </h2>
                        <p className="box-subtitle">Equipos registrados que suben capítulos y proyectos a la web.</p>
                      </div>
                      {isAdmin && (
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => setShowScanModal(true)}
                        >
                          <i className="fa fa-plus"></i> Registrar Grupo Scan
                        </button>
                      )}
                    </div>

                    <div className="scans-grid-admin">
                      {scans.map(s => (
                        <div key={s.scanId} className="scan-team-card">
                          <div className="team-avatar-box">
                            {s.scanImgUrl ? (
                              <img src={normalizePageUrl(s.scanImgUrl)} alt={s.scanName} />
                            ) : (
                              <i className="fa fa-users"></i>
                            )}
                          </div>
                          <div className="team-details">
                            <h4>{s.scanName}</h4>
                            <p>{s.scanDescription || 'Grupo de traducción y edición'}</p>
                            <span className="team-id-badge">ID Scan: #{s.scanId}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: AUDITORÍAS Y ADVERTENCIAS PARA EL SCAN GROUP       */}
          {/* ========================================================= */}
          {activeTab === 'audits' && (
            <div className="tab-pane audits-tab">
              <div className="panel-box">
                <div className="box-header-row" style={{ marginBottom: '20px' }}>
                  <div>
                    <h2 className="box-title">
                      <i className="fa fa-exclamation-triangle"></i> Auditorías y Advertencias de Capítulos ({scanAudits.length})
                    </h2>
                    <p className="box-subtitle" style={{ margin: '4px 0 0', opacity: 0.75, fontSize: '13.5px' }}>
                      Revisa los reportes recibidos en capítulos subidos por tu Grupo Scan y las resoluciones o advertencias emitidas por Administración.
                    </p>
                  </div>
                </div>

                {scanAudits.length === 0 ? (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.75 }}>
                    <i className="fa fa-check-circle" style={{ fontSize: '38px', color: '#10b981', marginBottom: '12px' }}></i>
                    <h3 style={{ margin: '0 0 6px' }}>¡Excelente trabajo!</h3>
                    <p style={{ margin: 0 }}>Tu Grupo Scan no tiene advertencias ni reportes pendientes de auditoría.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {scanAudits.map((audit) => {
                      const isWarning = audit.actionTaken === 'SCAN_WARNED';
                      const isDeleted = audit.actionTaken === 'CHAPTER_DELETED' || audit.actionTaken === 'DELETE_CHAPTER';
                      const isHidden = audit.actionTaken === 'HIDE_CHAPTER';
                      const badgeColor = isDeleted ? '#ef4444' : (isWarning || isHidden) ? '#f59e0b' : audit.status === 'RESOLVED' ? '#10b981' : '#38bdf8';

                      return (
                        <div
                          key={audit.reportId}
                          style={{
                            padding: '16px 18px',
                            borderRadius: '12px',
                            border: `1px solid ${isWarning || isDeleted ? 'rgba(245, 158, 11, 0.4)' : 'rgba(148, 163, 184, 0.2)'}`,
                            background: 'rgba(15, 23, 42, 0.35)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                            <div>
                              <h3 style={{ margin: '0 0 4px', fontSize: '16px' }}>
                                {audit.mangaTittle} &mdash; Capítulo {audit.chapterNumber}
                                {audit.chapterTitle ? ` (${audit.chapterTitle})` : ''}
                              </h3>
                              <span style={{ fontSize: '12.5px', opacity: 0.75 }}>
                                Grupo: <strong>{audit.scanName}</strong> &bull; Reportado el {new Date(audit.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, background: `${badgeColor}22`, color: badgeColor }}>
                                {isWarning && '⚠ Advertencia al Scan Group'}
                                {isDeleted && '🗑 Capítulo Eliminado'}
                                {isHidden && '👁 Capítulo Ocultado'}
                                {!isWarning && !isDeleted && !isHidden && (audit.status === 'PENDING' ? '⏳ En revisión por Admin' : '✓ Resuelto')}
                              </span>
                              {audit.chapterExists && audit.chapterId && (
                                <Link
                                  to={`/manga/${audit.mangaId}/chapter/${audit.chapterId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-secondary"
                                  style={{ padding: '4px 10px', fontSize: '12px', textDecoration: 'none' }}
                                >
                                  <i className="fa fa-external-link"></i> Ver Capítulo
                                </Link>
                              )}
                            </div>
                          </div>

                          <div style={{ fontSize: '13.5px', marginBottom: '8px' }}>
                            <strong>Motivo reportado:</strong> {AUDIT_REASON_LABELS[audit.reason] || audit.reason}
                            {audit.description && (
                              <p style={{ margin: '4px 0 0', opacity: 0.85, fontStyle: 'italic' }}>"{audit.description}"</p>
                            )}
                          </div>

                          {audit.adminNotes && (
                            <div
                              style={{
                                marginTop: '10px',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                background: 'rgba(245, 158, 11, 0.12)',
                                borderLeft: '3px solid #f59e0b',
                                fontSize: '13px'
                              }}
                            >
                              <strong>Observación de Administración{audit.reviewerUsername ? ` (${audit.reviewerUsername})` : ''}:</strong>
                              <p style={{ margin: '4px 0 0' }}>{audit.adminNotes}</p>
                            </div>
                          )}
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
      {/* MODAL: REGISTRAR / EDITAR MANGA                           */}
      {/* ========================================================= */}
      {showMangaModal && (
        <div className="modal-backdrop" onClick={() => setShowMangaModal(false)}>
          <div className="modal-dialog modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="fa fa-book"></i> {editingManga ? 'Editar Manga' : 'Registrar Nuevo Manga'}
              </h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowMangaModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManga} className="modal-form">
              <div className="modal-body-scroll">
                <div className="form-row">
                  <div className="form-group col-half">
                    <label className="input-label">Título del Manga *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={mangaFormData.mangaTittle}
                      onChange={(e) => setMangaFormData({ ...mangaFormData, mangaTittle: e.target.value })}
                      placeholder="Ej. Chainsaw Man"
                      required
                    />
                  </div>

                  <div className="form-group col-half">
                    <label className="input-label">Nombres Alternativos</label>
                    <input
                      type="text"
                      className="form-input"
                      value={mangaFormData.alternativeNames}
                      onChange={(e) => setMangaFormData({ ...mangaFormData, alternativeNames: e.target.value })}
                      placeholder="Ej. Cheinsō Man"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group col-third">
                    <label className="input-label">Mangaka / Autor *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={mangaFormData.mangaka}
                      onChange={(e) => setMangaFormData({ ...mangaFormData, mangaka: e.target.value })}
                      placeholder="Ej. Tatsuki Fujimoto"
                      required
                    />
                  </div>

                  <div className="form-group col-third">
                    <label className="input-label">Tipo de Manga *</label>
                    <select
                      className="form-select"
                      value={mangaFormData.mangaTypeId}
                      onChange={(e) => setMangaFormData({ ...mangaFormData, mangaTypeId: e.target.value })}
                      required
                    >
                      {mangaTypes.map(t => (
                        <option key={t.mangaTypeId} value={t.mangaTypeId}>
                          {t.mangaTypeName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group col-third">
                    <label className="input-label">Demografía *</label>
                    <select
                      className="form-select"
                      value={mangaFormData.demographyId}
                      onChange={(e) => setMangaFormData({ ...mangaFormData, demographyId: e.target.value })}
                      required
                    >
                      {demographics.map(d => (
                        <option key={d.demographyId} value={d.demographyId}>
                          {d.name || d.demographyName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group col-half">
                    <label className="input-label">Editorial</label>
                    <input
                      type="text"
                      className="form-input"
                      value={mangaFormData.editorialName}
                      onChange={(e) => setMangaFormData({ ...mangaFormData, editorialName: e.target.value })}
                      placeholder="Ej. Shueisha"
                    />
                  </div>

                  <div className="form-group col-half">
                    <label className="input-label">Estado de Publicación</label>
                    <select
                      className="form-select"
                      value={mangaFormData.status}
                      onChange={(e) => setMangaFormData({ ...mangaFormData, status: e.target.value })}
                    >
                      <option value="Publishing">En Publicación (Publishing)</option>
                      <option value="Finished">Finalizado (Finished)</option>
                      <option value="On Hiatus">En Pausa (On Hiatus)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="input-label">Sinopsis / Descripción *</label>
                  <textarea
                    rows={4}
                    className="form-textarea"
                    value={mangaFormData.mangaDescription}
                    onChange={(e) => setMangaFormData({ ...mangaFormData, mangaDescription: e.target.value })}
                    placeholder="Describe la trama del manga..."
                    required
                  />
                </div>

                {/* Portada */}
                <div className="form-group">
                  <label className="input-label">
                    Imagen de Portada {!editingManga && '*'}
                  </label>
                  <div className="cover-picker-box">
                    {mangaCoverPreview && (
                      <img src={mangaCoverPreview} alt="Preview Portada" className="cover-preview-img" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setMangaCoverFile(file);
                          setMangaCoverPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Checkboxes de Géneros (solo en creación) */}
                {!editingManga && genres.length > 0 && (
                  <div className="form-group">
                    <label className="input-label">Asignar Géneros</label>
                    <div className="genres-checkbox-grid">
                      {genres.map(g => {
                        const isChecked = mangaFormData.selectedGenres.includes(g.genreId);
                        return (
                          <label key={g.genreId} className="genre-check-item">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...mangaFormData.selectedGenres, g.genreId]
                                  : mangaFormData.selectedGenres.filter(id => id !== g.genreId);
                                setMangaFormData({ ...mangaFormData, selectedGenres: next });
                              }}
                            />
                            <span>{g.genreName}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Flags adicionales */}
                <div className="checkboxes-row">
                  <label className="custom-check-label">
                    <input
                      type="checkbox"
                      checked={mangaFormData.isAmateur}
                      onChange={(e) => setMangaFormData({ ...mangaFormData, isAmateur: e.target.checked })}
                    />
                    <span>¿Es Obra Amateur?</span>
                  </label>
                  <label className="custom-check-label">
                    <input
                      type="checkbox"
                      checked={mangaFormData.isErotic}
                      onChange={(e) => setMangaFormData({ ...mangaFormData, isErotic: e.target.checked })}
                    />
                    <span>¿Contenido Erótico?</span>
                  </label>
                  <label className="custom-check-label">
                    <input
                      type="checkbox"
                      checked={mangaFormData.isFeatured}
                      onChange={(e) => setMangaFormData({ ...mangaFormData, isFeatured: e.target.checked })}
                    />
                    <span>¿Destacar en la portada?</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowMangaModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={mangaFormLoading}
                >
                  {mangaFormLoading ? (
                    <><i className="fa fa-spinner fa-spin"></i> Guardando...</>
                  ) : (
                    <><i className="fa fa-save"></i> Guardar Manga</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDITAR CAPÍTULO                                    */}
      {/* ========================================================= */}
      {editingChapter && (
        <div className="modal-backdrop" onClick={() => setEditingChapter(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fa fa-pencil"></i> Editar Capítulo #{editingChapter.chapterNumber}</h3>
              <button type="button" className="btn-modal-close" onClick={() => setEditingChapter(null)}>✕</button>
            </div>
            <form onSubmit={handleUpdateChapter} className="modal-form">
              <div className="modal-body-scroll">
                <div className="form-group">
                  <label className="input-label">Número de Capítulo</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={editingChapter.chapterNumber}
                    onChange={(e) => setEditingChapter({ ...editingChapter, chapterNumber: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Título del Capítulo</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingChapter.chapterTitle || ''}
                    onChange={(e) => setEditingChapter({ ...editingChapter, chapterTitle: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="custom-check-label">
                    <input
                      type="checkbox"
                      checked={editingChapter.chapterStatus}
                      onChange={(e) => setEditingChapter({ ...editingChapter, chapterStatus: e.target.checked })}
                    />
                    <span>Capítulo Activo y Visible para Lectores</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditingChapter(null)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREAR / EDITAR GÉNERO                              */}
      {/* ========================================================= */}
      {showGenreModal && (
        <div className="modal-backdrop" onClick={() => setShowGenreModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fa fa-tags"></i> {editingGenre ? 'Editar Género' : 'Crear Nuevo Género'}</h3>
              <button type="button" className="btn-modal-close" onClick={() => setShowGenreModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveGenre} className="modal-form">
              <div className="modal-body-scroll">
                <div className="form-group">
                  <label className="input-label">Nombre del Género *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={genreName}
                    onChange={(e) => setGenreName(e.target.value)}
                    placeholder="Ej. Cyberpunk"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Descripción</label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    value={genreDescription}
                    onChange={(e) => setGenreDescription(e.target.value)}
                    placeholder="Describe las características de este género..."
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Imagen Representativa</label>
                  <div className="cover-picker-box">
                    {genrePreview && (
                      <img src={genrePreview} alt="Preview Género" className="cover-preview-img" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setGenreFile(file);
                          setGenrePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowGenreModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={genreFormLoading}>
                  {genreFormLoading ? <><i className="fa fa-spinner fa-spin"></i> Guardando...</> : 'Guardar Género'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REGISTRAR GRUPO SCAN                               */}
      {/* ========================================================= */}
      {showScanModal && (
        <div className="modal-backdrop" onClick={() => setShowScanModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fa fa-users"></i> Registrar Grupo Scan</h3>
              <button type="button" className="btn-modal-close" onClick={() => setShowScanModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveScan} className="modal-form">
              <div className="modal-body-scroll">
                <div className="form-group">
                  <label className="input-label">Nombre del Grupo Scan *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newScanName}
                    onChange={(e) => setNewScanName(e.target.value)}
                    placeholder="Ej. Shinigami Scanlation"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Descripción</label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    value={newScanDescription}
                    onChange={(e) => setNewScanDescription(e.target.value)}
                    placeholder="Detalles del grupo, idiomas o proyectos..."
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Logo / Imagen</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setNewScanFile(file);
                        setNewScanPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowScanModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={scanFormLoading}>
                  {scanFormLoading ? <><i className="fa fa-spinner fa-spin"></i> Registrando...</> : 'Registrar Scan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: POSTULACIÓN PARA SCAN GROUP (CLIENTES)             */}
      {/* ========================================================= */}
      {showApplyModal && (
        <div className="modal-backdrop" onClick={() => setShowApplyModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fa fa-paper-plane"></i> Solicitud de Scan Group</h3>
              <button type="button" className="btn-modal-close" onClick={() => setShowApplyModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmitApplication} className="modal-form">
              <div className="modal-body-scroll">
                <div className="form-group">
                  <label className="input-label">Nombre del Grupo Scan *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={applyForm.scanName}
                    onChange={(e) => setApplyForm({ ...applyForm, scanName: e.target.value })}
                    placeholder="Ej. Phoenix Scanlation"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Descripción del Grupo / Proyectos *</label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    value={applyForm.scanDescription}
                    onChange={(e) => setApplyForm({ ...applyForm, scanDescription: e.target.value })}
                    placeholder="Describe los tipos de manga que traducen, frecuencia o experiencia..."
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group col-half">
                    <label className="input-label">Servidor Discord</label>
                    <input
                      type="url"
                      className="form-input"
                      value={applyForm.discordUrl}
                      onChange={(e) => setApplyForm({ ...applyForm, discordUrl: e.target.value })}
                      placeholder="https://discord.gg/..."
                    />
                  </div>
                  <div className="form-group col-half">
                    <label className="input-label">Sitio Web / Red Social</label>
                    <input
                      type="url"
                      className="form-input"
                      value={applyForm.websiteUrl}
                      onChange={(e) => setApplyForm({ ...applyForm, websiteUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="input-label">Mensaje para Administradores</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    value={applyForm.applicationMessage}
                    onChange={(e) => setApplyForm({ ...applyForm, applicationMessage: e.target.value })}
                    placeholder="Cuéntanos por qué te gustaría publicar en OurMangaSite..."
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Logo del Grupo (Opcional)</label>
                  <div className="cover-picker-box">
                    {applyForm.preview && (
                      <img src={applyForm.preview} alt="Logo Preview" className="cover-preview-img" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setApplyForm({
                            ...applyForm,
                            file,
                            preview: URL.createObjectURL(file)
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowApplyModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={applyLoading}>
                  {applyLoading ? <><i className="fa fa-spinner fa-spin"></i> Enviando...</> : 'Enviar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* MODAL LIGHTBOX: INSPECCIÓN ZOOM DE PÁGINA                  */}
      {/* ========================================================= */}
      {lightboxPageIndex !== null && chapterPages[lightboxPageIndex] && (
        <div className="page-lightbox-backdrop" onClick={() => setLightboxPageIndex(null)}>
          <div className="page-lightbox-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="page-lightbox-header">
              <div className="header-meta-group">
                <span className="lightbox-page-badge">
                  Página #{lightboxPageIndex + 1} de {chapterPages.length}
                  {lightboxPageIndex === 0 && ' (PORTADA)'}
                </span>
                <span className="lightbox-page-name">{chapterPages[lightboxPageIndex].name}</span>
                <span className="lightbox-page-size">({chapterPages[lightboxPageIndex].size})</span>
              </div>
              <div className="header-actions-group">
                {lightboxPageIndex !== 0 && (
                  <button
                    type="button"
                    className="btn-set-cover"
                    onClick={() => {
                      jumpToPosition(lightboxPageIndex, 1);
                      setLightboxPageIndex(0);
                    }}
                    title="Mover esta página al inicio (Portada)"
                  >
                    <i className="fa fa-bookmark"></i> Fijar como Portada (#1)
                  </button>
                )}
                <button
                  type="button"
                  className="btn-lightbox-close"
                  onClick={() => setLightboxPageIndex(null)}
                  title="Cerrar (Esc)"
                >
                  <i className="fa fa-times"></i>
                </button>
              </div>
            </div>

            <div className="page-lightbox-body">
              <button
                type="button"
                className="btn-lightbox-nav prev"
                disabled={lightboxPageIndex === 0}
                onClick={() => setLightboxPageIndex(prev => prev - 1)}
                title="Página anterior (←)"
              >
                <i className="fa fa-chevron-left"></i>
              </button>

              <div className="lightbox-image-viewport">
                <img
                  src={chapterPages[lightboxPageIndex].previewUrl}
                  alt={chapterPages[lightboxPageIndex].name}
                />
              </div>

              <button
                type="button"
                className="btn-lightbox-nav next"
                disabled={lightboxPageIndex === chapterPages.length - 1}
                onClick={() => setLightboxPageIndex(prev => prev + 1)}
                title="Página siguiente (→)"
              >
                <i className="fa fa-chevron-right"></i>
              </button>
            </div>

            <div className="page-lightbox-footer">
              <span>Usa las flechas <strong>←</strong> y <strong>→</strong> del teclado para navegar entre páginas, o <strong>Esc</strong> para cerrar</span>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        variant={confirmState.variant}
        loading={confirmState.loading}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default ScanDashboard;
