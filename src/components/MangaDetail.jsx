import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import mangasData, { canonicalMangas } from './mangasData';
import { mangasApi, chaptersApi, userListApi } from '../services/api';
import { useAuth } from '../Context/AuthContext';
import { useLanguage } from '../Context/LanguageContext';
import { getMangaImage } from '../utils/imageHelper';
import SEO from './SEO';
import '../styles/MangaDetail.scss';

const MangaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInList, setIsInList] = useState(false);
  const [readingStatus, setReadingStatus] = useState('Reading');
  const [readChapterIds, setReadChapterIds] = useState(new Set());
  const [expandedChapters, setExpandedChapters] = useState({});
  const [listLoading, setListLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();

  useEffect(() => {
    let isMounted = true;

    const loadMangaData = async () => {
      setLoading(true);
      try {
        // Primero intentamos buscar en la API
        const allMangas = await mangasApi.getMangas();
        let found = null;

        // Búsqueda por ID numérico o por título/slug
        if (!isNaN(Number(id))) {
          found = allMangas.find(m => m.mangaId === Number(id));
        }
        if (!found) {
          found = allMangas.find(m => 
            (m.mangaTittle || m.mangaName || '').toLowerCase().replace(/\s+/g, '-') === id.toLowerCase() ||
            (m.alternativeNames || '').toLowerCase().includes(id.toLowerCase())
          );
        }

        // Si no se encuentra en API, recurrimos al dataset local
        if (!found) {
          found = (
            mangasData.find(m => m.id === id) ||
            canonicalMangas.find(m => id.startsWith(m.id)) ||
            canonicalMangas.find(m => m.mangaName.toLowerCase().replace(/\s+/g, '-') === id.toLowerCase()) ||
            null
          );
        }

        if (isMounted && found) {
          setManga(found);
          const mangaId = found.mangaId || found.id;

          // Cargar capítulos reales de la API
          try {
            const apiChapters = await chaptersApi.getByManga(mangaId);
            if (isMounted) {
              if (apiChapters && apiChapters.length > 0) {
                setChapters(apiChapters.map(c => ({
                  chapterId: c.chapterId,
                  number: c.chapterNumber,
                  title: c.chapterTitle || `Capítulo ${c.chapterNumber}`,
                  scanId: c.scanId,
                  scanName: c.scanName || 'Scan Group',
                  releaseDate: c.uploadedAt ? c.uploadedAt.substring(0, 10) : '2026-11'
                })));
              } else if (found.mangaId) {
                // Manga real de la BD con 0 capítulos aún: no mostrar capítulos ficticios
                setChapters([]);
              } else if (found.chapters) {
                setChapters(found.chapters);
              } else {
                setChapters([]);
              }
            }
          } catch {
            if (isMounted) {
              if (found.chapters) setChapters(found.chapters);
              else setChapters([]);
            }
          }

          // Verificar si está en la lista del usuario y cargar capítulos leídos
          if (isAuthenticated && found.mangaId) {
            try {
              const inList = await userListApi.check(found.mangaId);
              if (isMounted) {
                setIsInList(Boolean(inList));
                if (inList?.readingStatus) setReadingStatus(inList.readingStatus);
              }
              if (inList) {
                const readList = await userListApi.getReadChapters(found.mangaId);
                if (isMounted) {
                  setReadChapterIds(new Set(readList.map(r => r.chapterId)));
                }
              } else if (isMounted) {
                setReadChapterIds(new Set());
              }
            } catch {
              // Silencioso
            }
          }
        }
      } catch (err) {
        console.warn('Error cargando detalle desde API:', err);
        const fallback = mangasData.find(m => m.id === id) || canonicalMangas[0];
        if (isMounted) {
          setManga(fallback);
          if (fallback?.chapters) setChapters(fallback.chapters);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMangaData();
    return () => { isMounted = false; };
  }, [id, isAuthenticated]);

  const handleToggleList = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!manga?.mangaId) return;

    setListLoading(true);
    try {
      if (isInList) {
        await userListApi.remove(manga.mangaId);
        setIsInList(false);
        setReadChapterIds(new Set());
      } else {
        await userListApi.addOrUpdate({ mangaId: manga.mangaId, readingStatus: 'Reading' });
        setIsInList(true);
        setReadingStatus('Reading');
        const readList = await userListApi.getReadChapters(manga.mangaId).catch(() => []);
        setReadChapterIds(new Set(readList.map(r => r.chapterId)));
      }
    } catch (err) {
      console.error('Error al actualizar la lista:', err);
    } finally {
      setListLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!isAuthenticated || !manga?.mangaId) return;
    setReadingStatus(newStatus);
    try {
      await userListApi.addOrUpdate({ mangaId: manga.mangaId, readingStatus: newStatus });
    } catch (err) {
      console.error('Error actualizando estado:', err);
    }
  };

  const handleToggleChapterRead = async (e, chapter) => {
    e.stopPropagation();
    if (!isAuthenticated || !isInList || !manga?.mangaId || !chapter.chapterId) return;

    const alreadyRead = readChapterIds.has(chapter.chapterId);
    try {
      if (alreadyRead) {
        await userListApi.unmarkChapterRead(chapter.chapterId);
        setReadChapterIds(prev => {
          const next = new Set(prev);
          next.delete(chapter.chapterId);
          return next;
        });
      } else {
        await userListApi.markChapterRead(manga.mangaId, chapter.chapterId);
        setReadChapterIds(prev => new Set(prev).add(chapter.chapterId));
      }
    } catch (err) {
      console.error('Error actualizando progreso:', err);
    }
  };

  if (loading) {
    return (
      <div className="manga-detail-wrapper">
        <div className="manga-detail-container" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <i className="fa fa-spinner fa-spin" style={{ fontSize: '36px', marginBottom: '16px', color: 'var(--main-color)' }}></i>
          <h3>Cargando información del manga...</h3>
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="manga-detail-wrapper">
        <div className="manga-detail-container not-found">
          <h2>Manga no encontrado</h2>
          <p>El manga que estás buscando no existe o fue movido.</p>
          <Link to="/manga-section" className="back-btn">
            <i className="fa fa-arrow-left" aria-hidden="true"></i> Ir a la Biblioteca
          </Link>
        </div>
      </div>
    );
  }

  const mangaName = manga.mangaName || manga.mangaTittle;
  const synopsis = manga.synopsis || manga.mangaDescription;
  const author = manga.author || manga.mangaka || 'Desconocido';
  const rating = manga.rating || '4.8';
  const status = manga.status || 'Publicándose';
  const mangaType = manga.mangaType || manga.mangaTypeName || 'Manga';
  const mangaDemography = manga.mangaDemography || manga.demographyName || 'Shounen';
  const mangaImage = getMangaImage(manga);
  const mangaSchema = {
    '@context': 'https://schema.org',
    '@type': 'ComicSeries',
    name: mangaName,
    description: synopsis,
    image: mangaImage,
    author: {
      '@type': 'Person',
      name: author
    },
    genre: [mangaType, mangaDemography].filter(Boolean),
    aggregateRating: rating ? {
      '@type': 'AggregateRating',
      ratingValue: Number(rating) || 4.8,
      bestRating: 5,
      worstRating: 1,
      ratingCount: 100
    } : undefined
  };

  return (
    <div className="manga-detail-wrapper">
      <SEO
        title={`Leer ${mangaName} (${mangaType}) Online`}
        description={synopsis || `Lee todos los capítulos de ${mangaName} gratis y en español en OurMangaSite.`}
        image={mangaImage}
        type="book"
        canonicalPath={`/manga/${manga.mangaId || id}`}
        schema={mangaSchema}
      />
      <div className="manga-detail-container">
        <Link to="/manga-section" className="back-btn">
          <i className="fa fa-arrow-left" aria-hidden="true"></i> Volver a la Biblioteca
        </Link>

        <section className="detail-hero">
          <div className="detail-cover">
            <img src={mangaImage} alt={mangaName} />
          </div>

          <div className="detail-info">
            <h1 className="title">{mangaName}</h1>
            <p className="author">Autor: <span>{author}</span></p>

            <div className="badge-group">
              <span className={`badge ${mangaType}`}>{mangaType}</span>
              <span className={`badge ${mangaDemography}`}>{mangaDemography}</span>
              <span className="badge status">{status}</span>
              <span className="badge rating">
                <i className="fa fa-star" aria-hidden="true"></i> {rating}
              </span>
            </div>

            <div className="synopsis-box">
              <h3>Sinopsis</h3>
              <p>{synopsis}</p>
            </div>

            <div className="action-buttons">
              <button 
                type="button" 
                className="btn-read"
                disabled={chapters.length === 0}
                style={chapters.length === 0 ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
                onClick={() => {
                  const first = chapters[0];
                  if (first) {
                    navigate(`/manga/${manga?.mangaId || id}/chapter/${first.chapterId || first.number}`);
                  }
                }}
              >
                <i className="fa fa-book" aria-hidden="true"></i>{' '}
                {chapters.length === 0
                  ? (language === 'en' ? 'No chapters yet' : 'Sin capítulos aún')
                  : (language === 'en' ? 'Read first chapter' : 'Leer primer capítulo')}
              </button>
              <button 
                type="button" 
                className="btn-list"
                onClick={handleToggleList}
                disabled={listLoading}
                style={{
                  background: isInList ? '#10b981' : undefined,
                  color: isInList ? '#ffffff' : undefined
                }}
              >
                <i className={`fa ${isInList ? 'fa-check' : 'fa-bookmark'}`} aria-hidden="true"></i>{' '}
                {listLoading
                  ? (language === 'en' ? 'Updating...' : 'Actualizando...')
                  : isInList
                  ? (language === 'en' ? 'Following' : 'Siguiendo')
                  : (language === 'en' ? 'Follow Manga' : 'Seguir Manga')}
              </button>

              {isInList && (
                <select
                  value={readingStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title={language === 'en' ? 'Reading status' : 'Estado de lectura'}
                >
                  <option value="Reading">{language === 'en' ? 'Reading' : 'Leyendo'}</option>
                  <option value="Completed">{language === 'en' ? 'Completed' : 'Completado'}</option>
                  <option value="PlanToRead">{language === 'en' ? 'Plan to Read' : 'Por Leer'}</option>
                  <option value="OnHold">{language === 'en' ? 'On Hold' : 'En Pausa'}</option>
                  <option value="Dropped">{language === 'en' ? 'Dropped' : 'Abandonado'}</option>
                </select>
              )}
            </div>
          </div>
        </section>

        <section className="chapters-section">
          {(() => {
            const groupedChapters = [];
            const groupMap = new Map();
            chapters.forEach((ch) => {
              const key = String(ch.number);
              if (!groupMap.has(key)) {
                const grp = { number: ch.number, items: [] };
                groupMap.set(key, grp);
                groupedChapters.push(grp);
              }
              groupMap.get(key).items.push(ch);
            });

            const toggleChapterGroup = (num) => {
              const key = String(num);
              setExpandedChapters((prev) => ({ ...prev, [key]: !prev[key] }));
            };

            const renderReadButton = (chapter, isRead) => {
              if (!isInList || !chapter.chapterId) return null;
              return (
                <button
                  type="button"
                  onClick={(e) => handleToggleChapterRead(e, chapter)}
                  title={isRead
                    ? (language === 'en' ? 'Marked as read (click to unmark)' : 'Marcado como visto (clic para desmarcar)')
                    : (language === 'en' ? 'Mark as read' : 'Marcar como visto')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    border: `1px solid ${isRead ? 'rgba(16, 185, 129, 0.5)' : 'rgba(148, 163, 184, 0.3)'}`,
                    background: isRead ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
                    color: isRead ? '#10b981' : 'inherit',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <i className={`fa ${isRead ? 'fa-check-circle' : 'fa-eye'}`} aria-hidden="true"></i>
                  <span>{isRead ? (language === 'en' ? 'Read' : 'Visto') : (language === 'en' ? 'Unread' : 'No visto')}</span>
                </button>
              );
            };

            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <h2 style={{ margin: 0 }}>{language === 'en' ? 'Chapters' : 'Capítulos'} ({groupedChapters.length})</h2>
                  {isInList && chapters.length > 0 && (() => {
                    const uniqueChapterNums = new Set(chapters.map(c => c.number));
                    const readUniqueNums = new Set(chapters.filter(c => readChapterIds.has(c.chapterId)).map(c => c.number));
                    const total = uniqueChapterNums.size || 1;
                    const done = readUniqueNums.size;
                    const pct = Math.min(100, Math.round((done / total) * 100));
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px', flex: '0 1 320px' }}>
                        <div style={{ flex: 1, height: '8px', borderRadius: '999px', background: 'rgba(148, 163, 184, 0.2)', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #38bdf8)', transition: 'width 0.3s ease' }}></div>
                        </div>
                        <span style={{ fontSize: '12.5px', fontWeight: 700, whiteSpace: 'nowrap', color: '#10b981' }}>
                          {done}/{total} {language === 'en' ? 'read' : 'vistos'} ({pct}%)
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div className="chapters-list">
                  {groupedChapters.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '32px 16px',
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.35)',
                        border: '1px dashed rgba(148, 163, 184, 0.25)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <i className="fa fa-book" aria-hidden="true" style={{ fontSize: '26px', marginBottom: '10px', opacity: 0.6 }}></i>
                      <p style={{ margin: 0 }}>
                        {language === 'en'
                          ? 'No chapters have been published for this manga yet.'
                          : 'Aún no hay capítulos publicados para este manga.'}
                      </p>
                    </div>
                  ) : groupedChapters.map((group) => {
                    if (group.items.length === 1) {
                      const chapter = group.items[0];
                      const isRead = chapter.chapterId && readChapterIds.has(chapter.chapterId);
                      return (
                        <div
                          key={chapter.chapterId || `${chapter.number}-${chapter.scanId}`}
                          className="chapter-item"
                          onClick={() => navigate(`/manga/${manga?.mangaId || id}/chapter/${chapter.chapterId || chapter.number}`)}
                          role="button"
                          tabIndex={0}
                          title={`Leer ${chapter.title}`}
                          style={isRead ? { opacity: 0.78, borderLeft: '3px solid #10b981' } : undefined}
                        >
                          <span className="chapter-number">#{chapter.number}</span>
                          <span className="chapter-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span>{chapter.title}</span>
                            {chapter.scanName && (
                              <span className="scan-pill-badge">
                                <i className="fa fa-users" aria-hidden="true"></i>
                                {chapter.scanName}
                              </span>
                            )}
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
                            {renderReadButton(chapter, isRead)}
                            <span className="chapter-date">{chapter.releaseDate}</span>
                          </div>
                        </div>
                      );
                    }

                    const isExpanded = !!expandedChapters[String(group.number)];
                    const anyRead = group.items.some(ch => ch.chapterId && readChapterIds.has(ch.chapterId));
                    const defaultTitle = group.items[0]?.title || `${language === 'en' ? 'Chapter' : 'Capítulo'} ${group.number}`;

                    return (
                      <div key={`group-${group.number}`} className="chapter-group-wrapper">
                        <div
                          className={`chapter-item chapter-group-header ${isExpanded ? 'expanded' : ''}`}
                          onClick={() => toggleChapterGroup(group.number)}
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                          style={anyRead ? { borderLeft: '3px solid #10b981' } : undefined}
                        >
                          <span className="chapter-number">#{group.number}</span>
                          <span className="chapter-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span>{defaultTitle}</span>
                            <span className="versions-count-badge">
                              <i className="fa fa-clone" aria-hidden="true"></i>
                              {group.items.length} {language === 'en' ? 'versions' : 'versiones'}
                            </span>
                            {isInList && anyRead && (
                              <span className="group-read-badge">
                                <i className="fa fa-check-circle" aria-hidden="true"></i>
                                {language === 'en' ? 'Read' : 'Visto'}
                              </span>
                            )}
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
                            <span className="chapter-expand-hint">
                              {isExpanded
                                ? (language === 'en' ? 'Hide scans' : 'Ocultar opciones')
                                : (language === 'en' ? 'Choose scan' : 'Elegir scan')}
                            </span>
                            <i className={`fa ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true"></i>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="chapter-versions-sublist">
                            {group.items.map((chapter) => {
                              const isRead = chapter.chapterId && readChapterIds.has(chapter.chapterId);
                              return (
                                <div
                                  key={chapter.chapterId || `${chapter.number}-${chapter.scanId}`}
                                  className="chapter-version-item"
                                  onClick={() => navigate(`/manga/${manga?.mangaId || id}/chapter/${chapter.chapterId || chapter.number}`)}
                                  role="button"
                                  tabIndex={0}
                                  title={`${chapter.scanName || 'Scan'} - ${chapter.title}`}
                                  style={isRead ? { opacity: 0.8, borderLeft: '3px solid #10b981' } : undefined}
                                >
                                  <div className="version-left">
                                    <span className="scan-pill-badge">
                                      <i className="fa fa-users" aria-hidden="true"></i>
                                      {chapter.scanName || 'Scan Group'}
                                    </span>
                                    <span className="version-title">{chapter.title}</span>
                                  </div>
                                  <div className="version-right">
                                    {renderReadButton(chapter, isRead)}
                                    <span className="chapter-date">{chapter.releaseDate}</span>
                                    <i className="fa fa-play-circle version-play-icon" aria-hidden="true"></i>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </section>
      </div>
    </div>
  );
};

export default MangaDetail;
