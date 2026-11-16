import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { mangasApi, chaptersApi, normalizePageUrl } from '../services/api';
import mangasData, { canonicalMangas } from './mangasData';
import { useTheme } from '../Context/ThemeContext';
import '../styles/MangaReader.scss';

const MangaReader = () => {
  const { id, chapterId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

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
    if (e.target.closest('button, select, input, a, .control-btn, .nav-btn')) return;

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
                />
              </div>
            )}

            {/* Zonas de clic transparentes a izquierda y derecha */}
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
    </div>
  );
};

/**
 * Componente de Imagen con Skeleton loader y reintento en caso de fallo
 */
const ReaderImage = ({ src, alt, pageNumber, totalPages }) => {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = (e) => {
    e.stopPropagation();
    setHasError(false);
    setLoaded(false);
    setRetryKey(prev => prev + 1);
  };

  return (
    <div className={`manga-page-frame ${loaded ? 'is-loaded' : 'is-loading'}`}>
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
          key={retryKey}
          src={src}
          alt={alt}
          loading="lazy"
          className={`page-img ${loaded ? 'visible' : 'hidden'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
};

export default MangaReader;
