import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import mangasData, { canonicalMangas } from './mangasData';
import { mangasApi, chaptersApi, userListApi } from '../services/api';
import { useAuth } from '../Context/AuthContext';
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
  const [listLoading, setListLoading] = useState(false);
  const { isAuthenticated } = useAuth();

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
            if (isMounted && apiChapters && apiChapters.length > 0) {
              setChapters(apiChapters.map(c => ({
                number: c.chapterNumber,
                title: c.chapterTitle || `Capítulo ${c.chapterNumber}`,
                releaseDate: c.uploadedAt ? c.uploadedAt.substring(0, 10) : '2026-11'
              })));
            } else if (found.chapters) {
              setChapters(found.chapters);
            } else {
              setChapters([
                { number: 1, title: 'Capítulo 1: Inicio', releaseDate: '2026-10-11' },
                { number: 2, title: 'Capítulo 2: El Despertar', releaseDate: '2026-10-18' }
              ]);
            }
          } catch {
            if (found.chapters) setChapters(found.chapters);
          }

          // Verificar si está en la lista del usuario
          if (isAuthenticated && found.mangaId) {
            try {
              const inList = await userListApi.check(found.mangaId);
              if (isMounted) setIsInList(Boolean(inList));
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
      alert('Debes iniciar sesión para guardar mangas en tu lista.');
      return;
    }
    if (!manga?.mangaId) return;

    setListLoading(true);
    try {
      if (isInList) {
        await userListApi.remove(manga.mangaId);
        setIsInList(false);
        alert(`¡${manga.mangaName || manga.mangaTittle} ha sido removido de tu lista!`);
      } else {
        await userListApi.addOrUpdate({ mangaId: manga.mangaId, readingStatus: 'Reading' });
        setIsInList(true);
        alert(`¡${manga.mangaName || manga.mangaTittle} añadido a tu lista con éxito!`);
      }
    } catch (err) {
      alert(`Error al actualizar la lista: ${err.message}`);
    } finally {
      setListLoading(false);
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
                onClick={() => {
                  const first = chapters[0];
                  if (first) {
                    navigate(`/manga/${manga?.mangaId || id}/chapter/${first.chapterId || first.number}`);
                  }
                }}
              >
                <i className="fa fa-book" aria-hidden="true"></i> Leer primer capítulo
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
                {listLoading ? 'Actualizando...' : isInList ? 'En tu lista' : 'Añadir a mi lista'}
              </button>
            </div>
          </div>
        </section>

        <section className="chapters-section">
          <h2>Capítulos ({chapters.length})</h2>
          <div className="chapters-list">
            {chapters.map(chapter => (
              <div 
                key={chapter.chapterId || chapter.number} 
                className="chapter-item" 
                onClick={() => navigate(`/manga/${manga?.mangaId || id}/chapter/${chapter.chapterId || chapter.number}`)}
                role="button"
                tabIndex={0}
                title={`Leer ${chapter.title}`}
              >
                <span className="chapter-number">#{chapter.number}</span>
                <span className="chapter-title">{chapter.title}</span>
                <span className="chapter-date">{chapter.releaseDate}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MangaDetail;
