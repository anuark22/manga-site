import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import mangasData, { canonicalMangas } from './mangasData';
import '../styles/MangaDetail.scss';

const MangaDetail = () => {
  const { id } = useParams();

  const manga = useMemo(() => {
    if (!id) return null;
    return (
      mangasData.find(m => m.id === id) ||
      canonicalMangas.find(m => id.startsWith(m.id)) ||
      canonicalMangas.find(m => m.mangaName.toLowerCase().replace(/\s+/g, '-') === id.toLowerCase()) ||
      null
    );
  }, [id]);

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

  const {
    mangaName,
    mangaImage,
    mangaType,
    mangaDemography,
    synopsis,
    author = 'Desconocido',
    rating = '4.8',
    status = 'Publicándose',
    chapters = [
      { number: 1, title: 'Capítulo 1: Inicio', releaseDate: '2024-01-10' },
      { number: 2, title: 'Capítulo 2: El Despertar', releaseDate: '2024-01-17' },
      { number: 3, title: 'Capítulo 3: La Batalla', releaseDate: '2024-01-24' }
    ]
  } = manga;

  return (
    <div className="manga-detail-wrapper">
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
                onClick={() => alert(`Iniciando lectura de ${mangaName} - Capítulo 1`)}
              >
                <i className="fa fa-book" aria-hidden="true"></i> Leer primer capítulo
              </button>
              <button 
                type="button" 
                className="btn-list"
                onClick={() => alert(`¡${mangaName} añadido a tu lista!`)}
              >
                <i className="fa fa-bookmark" aria-hidden="true"></i> Añadir a mi lista
              </button>
            </div>
          </div>
        </section>

        <section className="chapters-section">
          <div className="chapters-header">
            <h2>
              <i className="fa fa-list-ul" aria-hidden="true"></i> Lista de Capítulos
            </h2>
            <span className="chapter-count">{chapters.length} capítulos</span>
          </div>

          <div className="chapters-list">
            {chapters.map(chap => (
              <div 
                key={chap.number} 
                className="chapter-item"
                style={{ cursor: 'pointer' }}
                onClick={() => alert(`Abriendo Capítulo ${chap.number}: ${chap.title}`)}
              >
                <div className="chapter-left">
                  <span className="chap-number">Cap. {chap.number}</span>
                  <span className="chap-title">{chap.title}</span>
                </div>
                <div className="chapter-right">
                  <span>{chap.releaseDate}</span>
                  <i className="fa fa-chevron-right" aria-hidden="true"></i>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MangaDetail;
