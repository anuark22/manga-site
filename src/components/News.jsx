import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { noticesApi } from '../services/api';
import { useAuth } from '../Context/AuthContext';
import { getNoticeImage, getNoticeCompanionImages } from '../utils/imageHelper';
import '../styles/News.scss';

// Contenido extendido y citas para las noticias de muestra/canónicas
const sampleNoticesDetails = {
  1: {
    category: 'Manga',
    readTime: '3 min',
    extendedParagraphs: [
      'Eiichiro Oda, creador de One Piece, anunció oficialmente a través del departamento editorial de la Weekly Shonen Jump que el manga entrará en una breve pausa programada con el objetivo de planificar los acontecimientos culminantes de la Saga Final.',
      'En su comunicado dirigido a la comunidad internacional de lectores, Oda aseguró que se encuentra en excelente estado de salud y que este receso le permitirá investigar a fondo los cabos sueltos del lore y coordinar los próximos capítulos decisivos en la travesía de los Sombreros de Paja.',
      'La serialización regular regresará en la edición estelar del próximo mes, momento en el cual comenzará uno de los enfrentamientos más esperados por todos los seguidores de la franquicia.'
    ],
    quote: '«Por favor, tengan un poco de paciencia mientras trazo con precisión las líneas del destino en el Grand Line. ¡Lo que viene superará todas las expectativas!» — Eiichiro Oda'
  },
  2: {
    category: 'Anime',
    readTime: '2 min',
    extendedParagraphs: [
      'El prestigioso estudio de animación MAPPA ha revelado un nuevo teaser oficial de la esperada película de Chainsaw Man, la cual adaptará de forma íntegra el aclamado «Arco de Reze» (Bomb Girl Arc).',
      'El adelanto audiovisual muestra secuencias de acción cinematográficas con una calidad visual impresionante, destacando la interacción entre Denji y la misteriosa chica de cabello morado que cambiará su perspectiva.',
      'El estreno en salas japonesas está programado para los próximos meses, con una distribución internacional en cines confirmada para finales del año.'
    ],
    quote: '«El Arco de Reze es uno de los pasajes más intensos y emotivos de toda la obra de Tatsuki Fujimoto. Nuestro objetivo es llevar esa fuerza emocional a la gran pantalla.» — Equipo de Producción de MAPPA'
  },
  3: {
    category: 'Manga',
    readTime: '2 min',
    extendedParagraphs: [
      'La editorial Shueisha ha confirmado oficialmente que el manga Jujutsu Kaisen ha alcanzado un récord histórico de más de 90 millones de copias en circulación a nivel mundial, sumando tanto sus ediciones físicas como las digitales.',
      'Este hito sitúa a la creación de Gege Akutami en el selecto grupo de las obras más influyentes de la historia moderna de la revista Weekly Shonen Jump, coincidiendo con el clímax de la batalla de Shinjuku.',
      'Para conmemorar la ocasión, la editorial ha anunciado portadas conmemorativas, ilustraciones inéditas y mercancía exclusiva para los seguidores.'
    ],
    quote: '«Agradezco profundamente a cada lector que ha seguido la historia semana a semana hasta sus momentos más decisivos.» — Gege Akutami'
  },
  4: {
    category: 'Manga',
    readTime: '3 min',
    extendedParagraphs: [
      'Luego de 10 años ininterrumpidos de heroísmo, My Hero Academia (Boku no Hero Academia) celebra la publicación del volumen 42 de su manga, marcando el cierre definitivo del viaje de Izuku Midoriya y la Clase 1-A.',
      'Para agradecer el respaldo de los fans a lo largo de esta década, el autor Kohei Horikoshi compartió una ilustración especial conmemorativa a todo color, en la que se refleja la madurez de los personajes tras la gran guerra contra el Frente de Liberación Paranormal.',
      'Las librerías de las principales ciudades de Japón registraron filas masivas de aficionados que acudieron a adquirir las ediciones especiales de despedida.'
    ],
    quote: '«Haber dibujado esta historia junto a todos ustedes ha sido el mayor honor de mi vida como mangaka. ¡Sigan mirando hacia adelante y Plus Ultra siempre!» — Kohei Horikoshi'
  }
};

const News = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [lightboxImage, setLightboxImage] = useState(null);
  const [toast, setToast] = useState('');

  // Modal para que el Administrador publique una nueva noticia
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Manga');
  const [newFile, setNewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const isAdmin = user && (user.roleId === 2 || user.roleName?.toUpperCase() === 'ADMIN');

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // Cargar lista de noticias
  const fetchNotices = async () => {
    setLoading(true);
    try {
      const data = await noticesApi.getNotices();
      setNotices(data || []);
    } catch (err) {
      console.warn('Error al cargar noticias de la API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // Noticia seleccionada en modo detalle si `id` está presente en la URL
  const selectedNotice = id
    ? notices.find((n) => String(n.noticeId || n.id) === String(id)) || null
    : null;

  // Manejar cambio de archivo en modal de creación
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Enviar nueva noticia (Admin)
  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      showToastMsg('Por favor completa el título y el contenido.');
      return;
    }

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('Title', newTitle.trim());
      formData.append('Content', newContent.trim());
      formData.append('IsActive', 'true');
      if (newFile) {
        formData.append('File', newFile);
      }

      const res = await noticesApi.createNotice(formData);
      if (res && (res.status === 200 || !res.error)) {
        showToastMsg('¡Noticia publicada con éxito!');
        setShowCreateModal(false);
        setNewTitle('');
        setNewContent('');
        setNewFile(null);
        setPreviewUrl('');
        await fetchNotices();
      } else {
        showToastMsg(res?.errorDescription || 'No se pudo publicar la noticia.');
      }
    } catch (err) {
      console.error('Error al crear noticia:', err);
      showToastMsg('Ocurrió un error al publicar la noticia.');
    } finally {
      setCreating(false);
    }
  };

  // Eliminar noticia (Admin)
  const handleDeleteNotice = async (noticeId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('¿Seguro que deseas eliminar esta noticia?')) return;

    try {
      await noticesApi.deleteNotice(noticeId);
      showToastMsg('Noticia eliminada correctamente.');
      if (selectedNotice && (selectedNotice.noticeId === noticeId || selectedNotice.id === noticeId)) {
        navigate('/news');
      }
      setNotices((prev) => prev.filter((n) => (n.noticeId || n.id) !== noticeId));
    } catch (err) {
      console.error('Error al eliminar noticia:', err);
      showToastMsg('No se pudo eliminar la noticia.');
    }
  };

  // Formateador de fecha
  const formatNoticeDate = (dateStr) => {
    if (!dateStr) return 'Fecha reciente';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Reciente';
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Deducir categoría de la noticia
  const getCategoryOfNotice = (notice) => {
    const rawId = notice.noticeId || notice.id;
    if (sampleNoticesDetails[rawId]?.category) {
      return sampleNoticesDetails[rawId].category;
    }
    const txt = `${notice.title || ''} ${notice.content || ''}`.toLowerCase();
    if (txt.includes('anime') || txt.includes('película') || txt.includes('teaser')) return 'Anime';
    if (txt.includes('comunidad') || txt.includes('foro') || txt.includes('servidor')) return 'Comunidad';
    return 'Manga';
  };

  // Filtrado de noticias
  const filteredNotices = notices.filter((n) => {
    const title = (n.title || n.noticeTittle || '').toLowerCase();
    const content = (n.content || n.noticeContent || '').toLowerCase();
    const matchesSearch = title.includes(searchTerm.toLowerCase()) || content.includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (activeCategory === 'ALL') return true;
    const cat = getCategoryOfNotice(n).toUpperCase();
    return cat === activeCategory;
  });

  // Noticia destacada para la parte superior de la vista de listado
  const heroNotice = !id && filteredNotices.length > 0 ? filteredNotices[0] : null;
  const gridNotices = !id && filteredNotices.length > 0 ? filteredNotices.slice(1) : [];

  return (
    <div className="news-page-container">
      {/* Toast Feedback */}
      {toast && (
        <div className="news-toast-alert">
          <i className="fa fa-info-circle"></i>
          <span>{toast}</span>
        </div>
      )}

      {/* Lightbox Modal de Imagen */}
      {lightboxImage && (
        <div className="news-lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <div className="lightbox-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="btn-close-lightbox"
              onClick={() => setLightboxImage(null)}
              title="Cerrar vista ampliada"
            >
              <i className="fa fa-times"></i>
            </button>
            <img src={lightboxImage.url} alt={lightboxImage.caption || 'Vista ampliada'} />
            {lightboxImage.caption && (
              <p className="lightbox-caption">{lightboxImage.caption}</p>
            )}
          </div>
        </div>
      )}

      {/* Modal de Publicación de Noticia (Admin) */}
      {showCreateModal && (
        <div className="news-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="news-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3><i className="fa fa-newspaper-o"></i> Publicar Nueva Noticia</h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <i className="fa fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="modal-form-content">
              <div className="form-group">
                <label>Título de la Noticia *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej. Temporada 3 de Jujutsu Kaisen anunciada oficialmente"
                  required
                />
              </div>

              <div className="form-row-two">
                <div className="form-group">
                  <label>Categoría</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    <option value="Manga">Manga</option>
                    <option value="Anime">Anime</option>
                    <option value="Lanzamientos">Lanzamientos</option>
                    <option value="Comunidad">Comunidad</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Imagen de Portada (Opcional)</label>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              {previewUrl && (
                <div className="image-preview-box">
                  <img src={previewUrl} alt="Vista previa de imagen" />
                  <span>Vista previa de la imagen seleccionada</span>
                </div>
              )}

              <div className="form-group">
                <label>Cuerpo / Contenido de la Noticia *</label>
                <textarea
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Escribe la información detallada de la noticia..."
                  required
                />
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <i className="fa fa-spinner fa-spin"></i> Publicando...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-paper-plane"></i> Publicar Noticia
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* VISTA DETALLE DE NOTICIA                                          */}
      {/* ================================================================= */}
      {selectedNotice ? (
        <article className="news-detail-wrapper">
          <div className="detail-top-nav">
            <Link to="/news" className="btn-back-news">
              <i className="fa fa-arrow-left"></i>
              <span>Volver a todas las noticias</span>
            </Link>

            <div className="detail-meta-tags">
              <span className="badge-category">{getCategoryOfNotice(selectedNotice)}</span>
              <span className="badge-read-time">
                <i className="fa fa-clock-o"></i>{' '}
                {sampleNoticesDetails[selectedNotice.noticeId || selectedNotice.id]?.readTime || '2 min'}
              </span>
            </div>
          </div>

          <header className="article-header">
            <h1 className="article-title">{selectedNotice.title || selectedNotice.noticeTittle}</h1>
            <div className="article-author-row">
              <div className="author-info">
                <i className="fa fa-user-circle"></i>
                <span>Publicado por <strong>{selectedNotice.authorName || 'OurMangaSite'}</strong></span>
              </div>
              <span className="dot-sep">•</span>
              <div className="publish-date">
                <i className="fa fa-calendar"></i>
                <span>{formatNoticeDate(selectedNotice.createdAt)}</span>
              </div>
            </div>
          </header>

          {/* Imagen Principal en Alta Resolución */}
          <div className="featured-image-container">
            <img
              src={getNoticeImage(selectedNotice)}
              alt={selectedNotice.title}
              className="article-featured-img"
              onClick={() =>
                setLightboxImage({
                  url: getNoticeImage(selectedNotice),
                  caption: selectedNotice.title || selectedNotice.noticeTittle
                })
              }
            />
            <div className="image-overlay-hint">
              <i className="fa fa-search-plus"></i> Clic para ampliar imagen
            </div>
            <p className="image-caption">Imagen oficial del lanzamiento / anuncio</p>
          </div>

          {/* Cuerpo del Artículo */}
          <div className="article-body">
            {sampleNoticesDetails[selectedNotice.noticeId || selectedNotice.id]?.extendedParagraphs ? (
              sampleNoticesDetails[selectedNotice.noticeId || selectedNotice.id].extendedParagraphs.map(
                (p, idx) => <p key={idx} className="body-paragraph">{p}</p>
              )
            ) : (
              (selectedNotice.content || selectedNotice.noticeContent || '')
                .split('\n')
                .map((p, idx) => (p.trim() ? <p key={idx} className="body-paragraph">{p}</p> : <br key={idx} />))
            )}

            {/* Cita Destacada */}
            {sampleNoticesDetails[selectedNotice.noticeId || selectedNotice.id]?.quote && (
              <blockquote className="article-quote-box">
                <i className="fa fa-quote-left quote-icon"></i>
                <p>{sampleNoticesDetails[selectedNotice.noticeId || selectedNotice.id].quote}</p>
              </blockquote>
            )}

            {/* Imágenes Secundarias / Ilustraciones Complementarias ("con posibilidad de tener una que otra imagen") */}
            {getNoticeCompanionImages(selectedNotice).length > 0 && (
              <section className="companion-gallery-section">
                <h3 className="gallery-title">
                  <i className="fa fa-picture-o"></i> Ilustraciones y Capturas Relacionadas
                </h3>
                <div className="companion-images-grid">
                  {getNoticeCompanionImages(selectedNotice).map((imgObj, idx) => (
                    <div
                      key={idx}
                      className="companion-image-card"
                      onClick={() => setLightboxImage(imgObj)}
                    >
                      <div className="image-wrapper">
                        <img src={imgObj.url} alt={imgObj.caption} />
                        <span className="zoom-tag"><i className="fa fa-arrows-alt"></i> Ampliar</span>
                      </div>
                      <p className="companion-caption">{imgObj.caption}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Barra de Acciones del Artículo */}
          <footer className="article-footer-bar">
            <div className="left-actions">
              <button
                type="button"
                className="btn-action-share"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  showToastMsg('¡Enlace de la noticia copiado al portapapeles!');
                }}
              >
                <i className="fa fa-share-alt"></i> Compartir Noticia
              </button>

              {isAdmin && (
                <button
                  type="button"
                  className="btn-action-delete"
                  onClick={(e) => handleDeleteNotice(selectedNotice.noticeId || selectedNotice.id, e)}
                >
                  <i className="fa fa-trash"></i> Eliminar
                </button>
              )}
            </div>

            <Link to="/news" className="btn-primary">
              <i className="fa fa-th-large"></i> Ver todas las noticias
            </Link>
          </footer>

          {/* Sección de Otras Noticias Relacionadas */}
          <section className="related-news-section">
            <h3 className="section-title">
              <i className="fa fa-newspaper-o"></i> Otras Noticias que te Pueden Interesar
            </h3>
            <div className="related-cards-grid">
              {notices
                .filter((n) => (n.noticeId || n.id) !== (selectedNotice.noticeId || selectedNotice.id))
                .slice(0, 3)
                .map((item, idx) => (
                  <Link
                    key={item.noticeId || item.id || idx}
                    to={`/news/${item.noticeId || item.id}`}
                    className="related-item-card"
                  >
                    <img src={getNoticeImage(item)} alt={item.title} />
                    <div className="related-content">
                      <span className="related-cat">{getCategoryOfNotice(item)}</span>
                      <h4 className="related-title">{item.title || item.noticeTittle}</h4>
                      <span className="related-date">{formatNoticeDate(item.createdAt)}</span>
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        </article>
      ) : (
        /* ================================================================= */
        /* VISTA PRINCIPAL: LISTADO Y FEED DE NOTICIAS                       */
        /* ================================================================= */
        <div className="news-feed-wrapper">
          {/* Encabezado del Portal de Noticias */}
          <header className="news-portal-header">
            <div className="header-titles">
              <div className="portal-badge">
                <i className="fa fa-bolt"></i> Actualidad & Novedades
              </div>
              <h1 className="portal-main-title">Noticias del Mundo Manga & Anime</h1>
              <p className="portal-description">
                Descubre los lanzamientos más recientes, comunicados oficiales de autores, récords de ventas y adaptaciones animadas de la comunidad.
              </p>
            </div>

            {isAdmin && (
              <button
                type="button"
                className="btn-primary btn-publish-news"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="fa fa-plus-circle"></i> Publicar Noticia
              </button>
            )}
          </header>

          {/* Barra de Filtros y Búsqueda */}
          <div className="news-toolbar-bar">
            <div className="categories-filter-pills">
              {['ALL', 'MANGA', 'ANIME', 'COMUNIDAD'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === 'ALL' ? 'Todas' : cat.charAt(0) + cat.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="search-news-box">
              <i className="fa fa-search"></i>
              <input
                type="text"
                placeholder="Buscar noticias por título o contenido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                >
                  <i className="fa fa-times"></i>
                </button>
              )}
            </div>
          </div>

          {/* Contenido: Cargando o Vacío */}
          {loading ? (
            <div className="news-loading-card">
              <i className="fa fa-spinner fa-spin"></i>
              <span>Cargando noticias y actualizaciones...</span>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="news-empty-card">
              <i className="fa fa-newspaper-o"></i>
              <h3>No se encontraron noticias</h3>
              <p>Intenta con otros términos de búsqueda o cambia la categoría seleccionada.</p>
              {searchTerm && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSearchTerm('')}
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Noticia Hero Destacada */}
              {heroNotice && (
                <section className="hero-notice-card">
                  <div className="hero-image-wrap">
                    <img src={getNoticeImage(heroNotice)} alt={heroNotice.title} />
                    <span className="hero-featured-tag">
                      <i className="fa fa-star"></i> Destacada
                    </span>
                  </div>

                  <div className="hero-info-wrap">
                    <div className="hero-meta-row">
                      <span className="badge-category">{getCategoryOfNotice(heroNotice)}</span>
                      <span className="hero-date">
                        <i className="fa fa-calendar"></i> {formatNoticeDate(heroNotice.createdAt)}
                      </span>
                    </div>

                    <h2 className="hero-title">{heroNotice.title || heroNotice.noticeTittle}</h2>
                    <p className="hero-excerpt">
                      {heroNotice.content || heroNotice.noticeContent}
                    </p>

                    <div className="hero-actions-row">
                      <Link
                        to={`/news/${heroNotice.noticeId || heroNotice.id}`}
                        className="btn-primary"
                      >
                        <span>Leer Noticia Completa</span>
                        <i className="fa fa-arrow-right"></i>
                      </Link>

                      {isAdmin && (
                        <button
                          type="button"
                          className="btn-delete-quick"
                          onClick={(e) => handleDeleteNotice(heroNotice.noticeId || heroNotice.id, e)}
                          title="Eliminar noticia"
                        >
                          <i className="fa fa-trash"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Grilla de Noticias Restantes */}
              {gridNotices.length > 0 && (
                <section className="news-grid-section">
                  <h3 className="section-title">
                    <i className="fa fa-list"></i> Más Noticias Recientes
                  </h3>

                  <div className="news-cards-grid">
                    {gridNotices.map((notice, index) => {
                      const nId = notice.noticeId || notice.id || index;
                      const nTitle = notice.title || notice.noticeTittle || 'Noticia';
                      const nContent = notice.content || notice.noticeContent || '';
                      const nCategory = getCategoryOfNotice(notice);

                      return (
                        <article key={nId} className="news-card-item">
                          <div className="card-thumb-wrap">
                            <img src={getNoticeImage(notice)} alt={nTitle} />
                            <span className="card-category-tag">{nCategory}</span>
                          </div>

                          <div className="card-body-wrap">
                            <div className="card-date-row">
                              <i className="fa fa-calendar-o"></i>
                              <span>{formatNoticeDate(notice.createdAt)}</span>
                            </div>

                            <h4 className="card-title">{nTitle}</h4>
                            <p className="card-excerpt">{nContent}</p>

                            <div className="card-footer-row">
                              <Link to={`/news/${nId}`} className="card-read-link">
                                <span>Leer más</span>
                                <i className="fa fa-arrow-right"></i>
                              </Link>

                              {isAdmin && (
                                <button
                                  type="button"
                                  className="btn-delete-mini"
                                  onClick={(e) => handleDeleteNotice(nId, e)}
                                  title="Eliminar noticia"
                                >
                                  <i className="fa fa-trash"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default News;