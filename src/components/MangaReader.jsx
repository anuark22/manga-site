import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { mangasApi, chaptersApi, chapterReportsApi, normalizePageUrl } from '../services/api';
import mangasData, { canonicalMangas } from './mangasData';
import { useTheme } from '../Context/ThemeContext';
import { useAuth } from '../Context/AuthContext';
import '../styles/MangaReader.scss';

const REPORT_REASONS = [
  { value: 'WRONG_CHAPTER', label: 'Capítulo incorrecto o páginas desordenadas' },
  { value: 'BROKEN_IMAGES', label: 'Imágenes rotas, faltantes o que no cargan' },
  { value: 'WRONG_MANGA', label: 'El capítulo pertenece a otro manga' },
  { value: 'BAD_QUALITY', label: 'Mala calidad / traducción ilegible' },
  { value: 'INAPPROPRIATE', label: 'Contenido inapropiado o spam' },
  { value: 'OTHER', label: 'Otro motivo' }
];

const MangaReader = () => {
  const { id, chapterId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();

  // Estados de datos
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modos de lectura
  // 'cascade': cascada continua vertical (estilo MangaPlus / Webtoon)
  // 'paginated': página por página horizontal
  const [readingMode, setReadingMode] = useState(() => {
    return localStorage.getItem('mangasite_reader_mode') || 'cascade';
  });

  // Ancho de lectura: 'normal' (800px), 'wide' (1000px), 'full' (100%)
  const [widthMode, setWidthMode] = useState(() => {
    return localStorage.getItem('mangasite_reader_width') || 'normal';
  });

  // Página activa
  const [currentPage, setCurrentPage] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Lupa de lectura (Solo PC)
  const [zoomLensActive, setZoomLensActive] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const toggleZoomLens = useCallback(() => {
    setZoomLensActive(prev => {
      const next = !prev;
      setToastMessage(next ? 'Lupa activada (2.4x) — Mueve el ratón sobre la imagen' : 'Lupa desactivada');
      return next;
    });
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(''), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Sistema de Reporte de Capítulo (1 reporte por usuario por capítulo)
  const [showReportModal, setShowReportModal] = useState(false);
  const [existingReport, setExistingReport] = useState(null);
  const [reportReason, setReportReason] = useState('WRONG_CHAPTER');
  const [reportDescription, setReportDescription] = useState('');
  const [reportHoneypot, setReportHoneypot] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !currentChapter?.chapterId) {
      setExistingReport(null);
      return;
    }
    let isMounted = true;
    chapterReportsApi.getMyReportForChapter(currentChapter.chapterId)
      .then((rep) => {
        if (isMounted) setExistingReport(rep);
      })
      .catch(() => {
        if (isMounted) setExistingReport(null);
      });
    return () => { isMounted = false; };
  }, [isAuthenticated, currentChapter?.chapterId]);

  const handleOpenReportModal = () => {
    if (!isAuthenticated) {
      setToastMessage('Debes iniciar sesión para poder reportar un capítulo.');
      setTimeout(() => navigate('/login'), 1200);
      return;
    }
    setReportError('');
    setShowReportModal(true);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (existingReport || !currentChapter?.chapterId) return;

    setReportSubmitting(true);
    setReportError('');
    try {
      await chapterReportsApi.createReport({
        chapterId: currentChapter.chapterId,
        reason: reportReason,
        description: reportDescription.trim(),
        honeypot: reportHoneypot
      });
      setExistingReport({
        reason: reportReason,
        description: reportDescription.trim(),
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });
      setShowReportModal(false);
      setReportDescription('');
      setReportHoneypot('');
      setToastMessage('¡Reporte enviado! El equipo de administración lo auditará.');
    } catch (err) {
      if (err.status === 409) {
        const rep = await chapterReportsApi.getMyReportForChapter(currentChapter.chapterId).catch(() => null);
        if (rep) setExistingReport(rep);
      }
      setReportError(err.message || 'No se pudo enviar el reporte. Inténtalo de nuevo.');
    } finally {
      setReportSubmitting(false);
    }
  };

  // Referencias para auto-scroll y observación
  const pageRefs = useRef({});
  const controlsTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  // Guardar preferencias en localStorage
  useEffect(() => {
    localStorage.setItem('mangasite_reader_mode', readingMode);
  }, [readingMode]);

  useEffect(() => {
    localStorage.setItem('mangasite_reader_width', widthMode);
  }, [widthMode]);

  // 1. Cargar datos del manga y lista de capítulos
  useEffect(() => {
    let isMounted = true;

    const loadMangaAndChapters = async () => {
      setLoading(true);
      setError(null);
      try {
        const allMangas = await mangasApi.getMangas();
        let found = null;
        if (!isNaN(Number(id))) {
          found = allMangas.find(m => m.mangaId === Number(id));
        }
        if (!found) {
          found = allMangas.find(m =>
            (m.mangaTittle || m.mangaName || '').toLowerCase().replace(/\s+/g, '-') === id.toLowerCase() ||
            (m.alternativeNames || '').toLowerCase().includes(id.toLowerCase())
          );
        }
        if (!found) {
          found = mangasData.find(m => String(m.id) === String(id) || String(m.mangaId) === String(id)) || canonicalMangas[0];
        }

        if (!isMounted) return;
        setManga(found);

        // Cargar lista de capítulos del manga desde la API
        let chList = [];
        if (found.mangaId) {
          try {
            const apiCh = await chaptersApi.getByManga(found.mangaId);
            if (apiCh && apiCh.length > 0) {
              chList = apiCh.map(c => ({
                chapterId: c.chapterId,
                chapterNumber: c.chapterNumber,
                chapterTitle: c.chapterTitle || `Capítulo ${c.chapterNumber}`,
                uploadedAt: c.uploadedAt
              }));
            }
          } catch (e) {
            console.warn('Error cargando capítulos desde API:', e);
          }
        }

        if (chList.length === 0 && found.chapters) {
          chList = found.chapters.map((c, idx) => ({
            chapterId: c.chapterId || (idx + 1),
            chapterNumber: c.number || (idx + 1),
            chapterTitle: c.title || `Capítulo ${c.number || (idx + 1)}`,
            uploadedAt: c.releaseDate
          }));
        }

        // Ordenar capítulos por número ascendente
        chList.sort((a, b) => a.chapterNumber - b.chapterNumber);

        if (!isMounted) return;
        setChapters(chList);

        // Identificar el capítulo actual
        const cur = chList.find(c =>
          String(c.chapterId) === String(chapterId) ||
          String(c.chapterNumber) === String(chapterId)
        ) || chList[0];

        setCurrentChapter(cur || null);
      } catch (err) {
        console.error('Error al inicializar el lector:', err);
        if (isMounted) setError('No se pudo cargar la información del manga.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMangaAndChapters();
    return () => { isMounted = false; };
  }, [id, chapterId]);

  // 2. Cargar páginas del capítulo actual
  useEffect(() => {
    let isMounted = true;
    if (!currentChapter) return;

    const loadPages = async () => {
      setPagesLoading(true);
      setError(null);
      setCurrentPage(1);

      try {
        // Intentar obtener páginas desde el endpoint de la API
        const targetChapterId = currentChapter.chapterId;
        const apiPages = await chaptersApi.getPages(targetChapterId);

        if (isMounted) {
          if (apiPages && apiPages.length > 0) {
            // Ordenar por número de página
            const sorted = [...apiPages].sort((a, b) => a.pageNumber - b.pageNumber);
            setPages(sorted);
          } else {
            // Si el capítulo aún no tiene páginas subidas
            setPages([]);
          }
        }
      } catch (err) {
        console.warn('Error al cargar páginas:', err);
        if (isMounted) {
          setPages([]);
        }
      } finally {
        if (isMounted) setPagesLoading(false);
      }
    };

    loadPages();
    return () => { isMounted = false; };
  }, [currentChapter]);

  // 3. Scroll to top cuando cambia el capítulo
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentChapter, readingMode]);

  // 4. Observar página visible en modo cascada para actualizar el contador
  useEffect(() => {
    if (readingMode !== 'cascade' || pages.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const pageNum = Number(entry.target.getAttribute('data-page-number'));
            if (pageNum) {
              setCurrentPage(pageNum);
            }
          }
        });
      },
      {
        rootMargin: '-20% 0px -50% 0px',
        threshold: 0.1
      }
    );

    Object.values(pageRefs.current).forEach(el => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [readingMode, pages]);

  // 5. Botón de volver arriba en cascada
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 6. Atajos de teclado para lectura
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorar si el usuario está escribiendo en un input o select
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (readingMode === 'paginated') {
          handleNextPage();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (readingMode === 'paginated') {
          handlePrevPage();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        setReadingMode(prev => (prev === 'cascade' ? 'paginated' : 'cascade'));
      } else if (e.key === 'z' || e.key === 'Z') {
        toggleZoomLens();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readingMode, currentPage, pages.length]);

  // Navegación entre capítulos
  const currentChapterIndex = chapters.findIndex(c => c.chapterId === currentChapter?.chapterId);
  const prevChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null;

  const goToChapter = (targetChapter) => {
    if (!targetChapter) return;
    navigate(`/manga/${manga?.mangaId || id}/chapter/${targetChapter.chapterId || targetChapter.chapterNumber}`);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (prevChapter) {
      if (window.confirm('¿Deseas ir al capítulo anterior?')) {
        goToChapter(prevChapter);
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < pages.length) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (nextChapter) {
      if (window.confirm('¡Has llegado al final del capítulo! ¿Deseas leer el siguiente?')) {
        goToChapter(nextChapter);
      }
    }
  };

  const jumpToPage = (pageNum) => {
    const num = Math.max(1, Math.min(pageNum, pages.length));
    setCurrentPage(num);
    if (readingMode === 'cascade') {
      const el = pageRefs.current[num];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Toggle pantalla completa
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Toggle barra de controles al hacer clic
  const handleReaderClick = (e) => {
    // Si hizo clic en un botón, control o link, no alternar
    if (e.target.closest('button, select, input, a, .control-btn, .nav-btn, .manga-zoom-lens')) return;

    // Si la lupa está activa, no interferir con la navegación ni controles
    if (zoomLensActive) return;

    if (readingMode === 'paginated') {
      // En modo paginado: clic en tercio izquierdo = retroceder, tercio derecho = avanzar, centro = toggle controls
      const { clientX } = e;
      const width = window.innerWidth;
      if (clientX < width * 0.3) {
        handlePrevPage();
        return;
      } else if (clientX > width * 0.7) {
        handleNextPage();
        return;
      }
    }

    setShowControls(prev => !prev);
  };

  if (loading) {
    return (
      <div className="manga-reader-loading">
        <div className="loader-spinner">
          <i className="fa fa-spinner fa-spin"></i>
        </div>
        <p>Cargando lector y datos del manga...</p>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="manga-reader-error">
        <div className="error-card">
          <i className="fa fa-exclamation-triangle"></i>
          <h2>Error al cargar el capítulo</h2>
          <p>{error || 'No se encontró el manga especificado.'}</p>
          <div className="error-actions">
            <Link to={`/manga/${id}`} className="btn-back">
              <i className="fa fa-arrow-left"></i> Volver al Manga
            </Link>
            <Link to="/manga-section" className="btn-library">
              <i className="fa fa-th-large"></i> Biblioteca
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const mangaName = manga.mangaName || manga.mangaTittle || 'Manga';

  return (
    <div
      ref={containerRef}
      className={`manga-reader-page theme-${theme} width-${widthMode} mode-${readingMode} ${showControls ? 'controls-visible' : 'controls-hidden'}`}
      onClick={handleReaderClick}
    >
      {/* ========================================================= */}
      {/* BARRA SUPERIOR DE CONTROL (Estilo MangaPlus / MangaDex) */}
      {/* ========================================================= */}
      <header className={`reader-topbar ${showControls ? 'visible' : 'hidden'}`}>
        <div className="topbar-left">
          <Link
            to={`/manga/${manga.mangaId || id}`}
            className="btn-exit"
            title="Volver a los detalles del manga"
          >
            <i className="fa fa-chevron-left" aria-hidden="true"></i>
            <span className="btn-exit-text">Detalles</span>
          </Link>

          <div className="manga-meta">
            <h1 className="manga-title" title={mangaName}>
              {mangaName}
            </h1>
            <span className="chapter-subtitle">
              {currentChapter ? `Cap. ${currentChapter.chapterNumber}: ${currentChapter.chapterTitle}` : 'Leyendo capítulo'}
            </span>
          </div>
        </div>

        <div className="topbar-center">
          {/* Selector rápido de capítulos */}
          {chapters.length > 0 && (
            <div className="chapter-selector-wrapper">
              <i className="fa fa-bookmark-o select-icon"></i>
              <select
                className="chapter-select"
                value={currentChapter?.chapterId || ''}
                onChange={(e) => {
                  const target = chapters.find(c => String(c.chapterId) === e.target.value);
                  if (target) goToChapter(target);
                }}
                title="Seleccionar capítulo"
              >
                {chapters.map(c => (
                  <option key={c.chapterId} value={c.chapterId}>
                    Cap. {c.chapterNumber} - {c.chapterTitle}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="topbar-right">
          {/* Selector de modo de lectura */}
          <div className="mode-toggle-group">
            <button
              type="button"
              className={`control-btn ${readingMode === 'cascade' ? 'active' : ''}`}
              onClick={() => setReadingMode('cascade')}
              title="Modo Cascada / Vertical (Webtoon)"
            >
              <i className="fa fa-bars" aria-hidden="true"></i>
              <span className="btn-label">Cascada</span>
            </button>
            <button
              type="button"
              className={`control-btn ${readingMode === 'paginated' ? 'active' : ''}`}
              onClick={() => setReadingMode('paginated')}
              title="Modo Paginado (Una a una)"
            >
              <i className="fa fa-clone" aria-hidden="true"></i>
              <span className="btn-label">Paginado</span>
            </button>
          </div>

          {/* Selector de ancho */}
          <div className="width-toggle-group">
            <button
              type="button"
              className={`control-btn ${widthMode === 'normal' ? 'active' : ''}`}
              onClick={() => setWidthMode('normal')}
              title="Ancho normal (850px)"
            >
              <i className="fa fa-columns"></i>
            </button>
            <button
              type="button"
              className={`control-btn ${widthMode === 'wide' ? 'active' : ''}`}
              onClick={() => setWidthMode('wide')}
              title="Ancho amplio (1050px)"
            >
              <i className="fa fa-arrows-h"></i>
            </button>
            <button
              type="button"
              className={`control-btn ${widthMode === 'full' ? 'active' : ''}`}
              onClick={() => setWidthMode('full')}
              title="100% de pantalla"
            >
              <i className="fa fa-expand"></i>
            </button>
          </div>

          {/* Lupa de aumento (Solo PC) */}
          <button
            type="button"
            className={`control-btn zoom-lens-btn pc-only ${zoomLensActive ? 'active' : ''}`}
            onClick={toggleZoomLens}
            title={zoomLensActive ? 'Desactivar Lupa de aumento (Z)' : 'Activar Lupa de aumento (Z) [Solo PC]'}
          >
            <i className="fa fa-search-plus" aria-hidden="true"></i>
            <span className="btn-label">Lupa</span>
          </button>

          {/* Reportar capítulo */}
          <button
            type="button"
            className={`control-btn report-chapter-btn ${existingReport ? 'reported' : ''}`}
            onClick={handleOpenReportModal}
            title={existingReport ? 'Ya reportaste este capítulo (clic para ver estado)' : 'Reportar capítulo incorrecto o con fallos'}
          >
            <i className={`fa ${existingReport ? 'fa-check-circle' : 'fa-flag'}`} aria-hidden="true"></i>
            <span className="btn-label">{existingReport ? 'Reportado' : 'Reportar'}</span>
          </button>

          {/* Pantalla completa */}
          <button
            type="button"
            className="control-btn fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'}
          >
            <i className={`fa ${isFullscreen ? 'fa-compress' : 'fa-arrows-alt'}`}></i>
          </button>
        </div>
      </header>

      {/* Toast informativo al activar/desactivar Lupa */}
      {toastMessage && (
        <div className="reader-toast">
          <i className="fa fa-search-plus"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* CUERPO DEL LECTOR (CANVAS DE PÁGINAS) */}
      {/* ========================================================= */}
      <main className="reader-canvas">
        {pagesLoading ? (
          <div className="pages-loading-state">
            <i className="fa fa-spinner fa-spin"></i>
            <p>Descargando páginas del capítulo...</p>
          </div>
        ) : pages.length === 0 ? (
          <div className="no-pages-state">
            <div className="no-pages-card">
              <i className="fa fa-picture-o"></i>
              <h3>Capítulo sin páginas disponibles</h3>
              <p>
                Este capítulo se encuentra registrado pero aún no tiene páginas cargadas en el servidor.
              </p>
              <div className="hint-box">
                <i className="fa fa-info-circle"></i>
                <span>Actualmente el manga con páginas reales subidas es <strong>Bleach (Capítulo 1)</strong>.</span>
              </div>
              <div className="card-buttons">
                <Link to="/manga/1/chapter/3" className="btn-try-bleach">
                  <i className="fa fa-book"></i> Leer Bleach Capítulo 1
                </Link>
                <Link to={`/manga/${manga.mangaId || id}`} className="btn-back-detail">
                  <i className="fa fa-arrow-left"></i> Volver a {mangaName}
                </Link>
              </div>
            </div>
          </div>
        ) : readingMode === 'cascade' ? (
          /* ========================================== */
          /* MODO CASCADA VERTICAL (MANGA PLUS STYLE)   */
          /* ========================================== */
          <div className="cascade-container">
            {pages.map((page, index) => {
              const srcUrl = normalizePageUrl(page.pageImgUrl);
              return (
                <div
                  key={page.pageId || index}
                  ref={el => (pageRefs.current[page.pageNumber] = el)}
                  data-page-number={page.pageNumber}
                  className="cascade-page-item"
                >
                  <ReaderImage
                    src={srcUrl}
                    alt={`Página ${page.pageNumber} - ${mangaName}`}
                    pageNumber={page.pageNumber}
                    totalPages={pages.length}
                    zoomLensActive={zoomLensActive}
                  />
                  <div className="page-footer-pill">
                    {page.pageNumber} / {pages.length}
                  </div>
                </div>
              );
            })}

            {/* Fin del capítulo en cascada */}
            <div className="chapter-end-banner">
              <div className="end-content">
                <i className="fa fa-check-circle"></i>
                <h3>Fin del {currentChapter?.chapterTitle || `Capítulo ${currentChapter?.chapterNumber}`}</h3>
                <p>¡Has terminado de leer este capítulo!</p>

                <div className="end-actions">
                  {prevChapter && (
                    <button
                      type="button"
                      className="btn-end-nav"
                      onClick={() => goToChapter(prevChapter)}
                    >
                      <i className="fa fa-chevron-left"></i> Cap. Anterior ({prevChapter.chapterNumber})
                    </button>
                  )}
                  <Link to={`/manga/${manga.mangaId || id}`} className="btn-end-detail">
                    <i className="fa fa-list"></i> Lista de Capítulos
                  </Link>
                  {nextChapter && (
                    <button
                      type="button"
                      className="btn-end-nav primary"
                      onClick={() => goToChapter(nextChapter)}
                    >
                      Siguiente Cap. ({nextChapter.chapterNumber}) <i className="fa fa-chevron-right"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================== */
          /* MODO PAGINADO HORIZONTAL (UNA A UNA)       */
          /* ========================================== */
          <div className="paginated-container">
            {pages[currentPage - 1] && (
              <div className="paginated-page-wrapper">
                <ReaderImage
                  src={normalizePageUrl(pages[currentPage - 1].pageImgUrl)}
                  alt={`Página ${currentPage} de ${pages.length}`}
                  pageNumber={currentPage}
                  totalPages={pages.length}
                  zoomLensActive={zoomLensActive}
                />
              </div>
            )}

            {/* Zonas de clic transparentes a izquierda y derecha (ocultas si la lupa está activa para facilitar inspección) */}
            {!zoomLensActive && (
              <>
                <div
                  className="tap-zone tap-left"
                  onClick={handlePrevPage}
                  title="Página anterior (←)"
                >
                  <div className="tap-indicator">
                    <i className="fa fa-chevron-left"></i>
                  </div>
                </div>
                <div
                  className="tap-zone tap-right"
                  onClick={handleNextPage}
                  title="Página siguiente (→)"
                >
                  <div className="tap-indicator">
                    <i className="fa fa-chevron-right"></i>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* BARRA INFERIOR FLOTANTE DE NAVEGACIÓN                     */}
      {/* ========================================================= */}
      {pages.length > 0 && (
        <footer className={`reader-bottombar ${showControls ? 'visible' : 'hidden'}`}>
          <div className="bottombar-left">
            <button
              type="button"
              className="nav-btn"
              onClick={readingMode === 'paginated' ? handlePrevPage : () => prevChapter && goToChapter(prevChapter)}
              disabled={readingMode === 'paginated' ? currentPage === 1 && !prevChapter : !prevChapter}
              title={readingMode === 'paginated' ? 'Página anterior' : 'Capítulo anterior'}
            >
              <i className="fa fa-chevron-left"></i>
              <span className="nav-label">
                {readingMode === 'paginated' ? 'Pág. Anterior' : 'Cap. Anterior'}
              </span>
            </button>
          </div>

          <div className="bottombar-center">
            {/* Indicador de página y barra deslizadora */}
            <div className="progress-group">
              <span className="page-counter">
                Página <strong>{currentPage}</strong> de {pages.length}
              </span>
              <input
                type="range"
                className="page-slider"
                min="1"
                max={pages.length}
                value={currentPage}
                onChange={(e) => jumpToPage(Number(e.target.value))}
                title="Deslizar para saltar a una página"
              />
            </div>
          </div>

          <div className="bottombar-right">
            <button
              type="button"
              className="nav-btn"
              onClick={readingMode === 'paginated' ? handleNextPage : () => nextChapter && goToChapter(nextChapter)}
              disabled={readingMode === 'paginated' ? currentPage === pages.length && !nextChapter : !nextChapter}
              title={readingMode === 'paginated' ? 'Página siguiente' : 'Capítulo siguiente'}
            >
              <span className="nav-label">
                {readingMode === 'paginated' ? 'Pág. Siguiente' : 'Cap. Siguiente'}
              </span>
              <i className="fa fa-chevron-right"></i>
            </button>
          </div>
        </footer>
      )}

      {/* Botón flotante para volver arriba (en modo cascada) */}
      {readingMode === 'cascade' && showScrollTop && (
        <button
          type="button"
          className="btn-scroll-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Volver arriba"
        >
          <i className="fa fa-arrow-up"></i>
        </button>
      )}

      {/* Botón flotante para alternar controles cuando están ocultos */}
      {!showControls && (
        <button
          type="button"
          className="btn-toggle-hud"
          onClick={() => setShowControls(true)}
          title="Mostrar controles de lectura"
        >
          <i className="fa fa-cog"></i>
        </button>
      )}

      {/* Modal de Reporte de Capítulo */}
      {showReportModal && (
        <div className="reader-report-overlay" onClick={() => setShowReportModal(false)}>
          <div className="reader-report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-header">
              <div className="report-title-group">
                <i className={`fa ${existingReport ? 'fa-check-circle' : 'fa-flag'}`}></i>
                <h3>{existingReport ? 'Estado de tu Reporte' : 'Reportar Capítulo'}</h3>
              </div>
              <button
                type="button"
                className="btn-close-report"
                onClick={() => setShowReportModal(false)}
                aria-label="Cerrar"
              >
                <i className="fa fa-times"></i>
              </button>
            </div>

            <div className="report-chapter-context">
              <span><strong>{mangaTitle}</strong> &mdash; Capítulo {currentChapter?.chapterNumber}</span>
              {currentChapter?.chapterTitle && <small>{currentChapter.chapterTitle}</small>}
            </div>

            {existingReport ? (
              <div className="report-already-exists">
                <div className="info-banner warning">
                  <i className="fa fa-info-circle"></i>
                  <div>
                    <strong>Ya has reportado este capítulo</strong>
                    <p>Para prevenir el spam, solo se permite enviar 1 reporte por capítulo por persona. Nuestro equipo ya tiene tu aviso registrado.</p>
                  </div>
                </div>

                <div className="existing-report-summary">
                  <div className="summary-row">
                    <span>Estado:</span>
                    <span className={`status-pill status-${(existingReport.status || 'PENDING').toLowerCase()}`}>
                      {existingReport.status === 'RESOLVED' ? 'Resuelto' : existingReport.status === 'DISMISSED' ? 'Descartado' : 'Pendiente de auditoría'}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Motivo:</span>
                    <strong>{REPORT_REASONS.find(r => r.value === existingReport.reason)?.label || existingReport.reason}</strong>
                  </div>
                  {existingReport.description && (
                    <div className="summary-desc">
                      <span>Detalle enviado:</span>
                      <p>{existingReport.description}</p>
                    </div>
                  )}
                  {existingReport.adminNotes && (
                    <div className="summary-desc admin-note">
                      <span>Respuesta de Administración:</span>
                      <p>{existingReport.adminNotes}</p>
                    </div>
                  )}
                </div>

                <div className="report-modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowReportModal(false)}>
                    Entendido
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="report-modal-form">
                {/* Honeypot invisible anti-spam */}
                <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} aria-hidden="true">
                  <input
                    type="text"
                    name="report_hp_field"
                    tabIndex="-1"
                    autoComplete="off"
                    value={reportHoneypot}
                    onChange={(e) => setReportHoneypot(e.target.value)}
                  />
                </div>

                <div className="info-banner">
                  <i className="fa fa-shield"></i>
                  <span>
                    <strong>Aviso anti-spam:</strong> Solo puedes enviar <strong>1 reporte por capítulo</strong>. Úsalo si el capítulo está mal subido, incompleto o pertenece a otro manga para que administración audite al Scan Group.
                  </span>
                </div>

                {reportError && (
                  <div className="report-error-alert">
                    <i className="fa fa-exclamation-triangle"></i>
                    <span>{reportError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="report-reason">Motivo del reporte *</label>
                  <select
                    id="report-reason"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    required
                  >
                    {REPORT_REASONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="report-description">Detalles adicionales (opcional)</label>
                  <textarea
                    id="report-description"
                    rows={3}
                    maxLength={1000}
                    placeholder="Ej. Las páginas 4 a 8 están repetidas o corresponden al capítulo anterior..."
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                  />
                  <small className="char-count">{reportDescription.length}/1000</small>
                </div>

                <div className="report-modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowReportModal(false)}
                    disabled={reportSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-submit-report"
                    disabled={reportSubmitting}
                  >
                    {reportSubmitting ? (
                      <>
                        <i className="fa fa-spinner fa-spin"></i> Enviando...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-paper-plane"></i> Enviar Reporte
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Componente de Imagen con Skeleton loader, Lupa de inspección y reintento en caso de fallo
 */
const ReaderImage = ({ src, alt, pageNumber, totalPages, zoomLensActive }) => {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // Estados de la Lupa de inspección
  const [isHovering, setIsHovering] = useState(false);
  const [lensState, setLensState] = useState({
    x: 0,
    y: 0,
    bgX: 0,
    bgY: 0,
    bgWidth: 0,
    bgHeight: 0
  });

  const frameRef = useRef(null);
  const imgRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!zoomLensActive || !loaded || !imgRef.current || !frameRef.current) return;

    const img = imgRef.current;
    const rect = img.getBoundingClientRect();
    const frameRect = frameRef.current.getBoundingClientRect();

    const clientX = e.clientX;
    const clientY = e.clientY;

    // Verificar si el cursor está sobre la imagen
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      if (isHovering) setIsHovering(false);
      return;
    }

    const mouseXOnImg = clientX - rect.left;
    const mouseYOnImg = clientY - rect.top;

    const zoomFactor = 2.4;
    const lensSize = 340; // Área cuadrada amplia (340x340px) para máxima legibilidad

    const bgWidth = rect.width * zoomFactor;
    const bgHeight = rect.height * zoomFactor;
    const bgX = -(mouseXOnImg * zoomFactor - lensSize / 2);
    const bgY = -(mouseYOnImg * zoomFactor - lensSize / 2);

    // Posición del lente en coordenadas relativas a frameRef
    const lensX = (clientX - frameRect.left) - lensSize / 2;
    const lensY = (clientY - frameRect.top) - lensSize / 2;

    setLensState({
      x: lensX,
      y: lensY,
      bgX,
      bgY,
      bgWidth,
      bgHeight
    });
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const handleRetry = (e) => {
    e.stopPropagation();
    setHasError(false);
    setLoaded(false);
    setRetryKey(prev => prev + 1);
  };

  return (
    <div
      ref={frameRef}
      className={`manga-page-frame ${loaded ? 'is-loaded' : 'is-loading'} ${zoomLensActive ? 'lens-active' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {!loaded && !hasError && (
        <div className="image-skeleton">
          <i className="fa fa-spinner fa-spin skeleton-spinner"></i>
          <span>Cargando página {pageNumber}...</span>
        </div>
      )}

      {hasError ? (
        <div className="image-error-fallback">
          <i className="fa fa-chain-broken"></i>
          <p>No se pudo cargar la página {pageNumber}</p>
          <button type="button" className="btn-retry" onClick={handleRetry}>
            <i className="fa fa-refresh"></i> Reintentar
          </button>
        </div>
      ) : (
        <img
          ref={imgRef}
          key={retryKey}
          src={src}
          alt={alt}
          loading="lazy"
          className={`page-img ${loaded ? 'visible' : 'hidden'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}

      {/* Lupa de Aumento con área cuadrada amplia (340x340px) */}
      {loaded && zoomLensActive && isHovering && (
        <div
          className="manga-zoom-lens square"
          style={{
            width: '340px',
            height: '340px',
            left: `${lensState.x}px`,
            top: `${lensState.y}px`,
            backgroundImage: `url(${src})`,
            backgroundSize: `${lensState.bgWidth}px ${lensState.bgHeight}px`,
            backgroundPosition: `${lensState.bgX}px ${lensState.bgY}px`,
            backgroundRepeat: 'no-repeat'
          }}
        >
          <span className="lens-center-crosshair"></span>
          <span className="lens-zoom-badge">2.4x</span>
        </div>
      )}
    </div>
  );
};

export default MangaReader;
