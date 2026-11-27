import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { chaptersApi, mangasApi, scansApi } from '../services/api';
import { getMangaImage } from '../utils/imageHelper';
import { canonicalMangas } from './mangasData';
import { useLanguage } from '../Context/LanguageContext';
import '../styles/RecentChapters.scss';

// Función auxiliar para formatear tiempo transcurrido
function formatTimeAgo(dateString) {
  if (!dateString) return 'Reciente';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Reciente';

  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 5) return 'Hace momentos';
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem`;
  return date.toLocaleDateString();
}

// Fallback de capítulos recientes por si el backend está vacío o no responde
const fallbackRecentChapters = [
  {
    chapterId: 3,
    chapterNumber: 1,
    chapterTitle: 'The Death and the Strawberry',
    mangaId: 1,
    mangaName: 'BLEACH',
    mangaType: 'Manga',
    scanName: 'Shinigami Scan',
    uploadedAt: '2026-10-24T00:30:08.703',
    timeAgo: 'Reciente'
  },
  {
    chapterId: 13,
    chapterNumber: 5,
    chapterTitle: 'Nivel 1 al infinito',
    mangaId: 4,
    mangaName: 'SOLO LEVELING',
    mangaType: 'Manhwa',
    scanName: 'Solo Scanlation',
    uploadedAt: '2026-11-08T23:22:36.22',
    timeAgo: 'Reciente'
  },
  {
    chapterId: 12,
    chapterNumber: 4,
    chapterTitle: 'Misión diaria: Despertar',
    mangaId: 4,
    mangaName: 'SOLO LEVELING',
    mangaType: 'Manhwa',
    scanName: 'Solo Scanlation',
    uploadedAt: '2026-11-01T23:22:36.22',
    timeAgo: 'Reciente'
  },
  {
    chapterId: 8,
    chapterNumber: 5,
    chapterTitle: '¡Furia, idiota!',
    mangaId: 2,
    mangaName: 'BOKU NO HERO',
    mangaType: 'Manga',
    scanName: 'Plus Ultra Scans',
    uploadedAt: '2026-11-13T23:22:36.22',
    timeAgo: 'Reciente'
  },
  {
    chapterId: 7,
    chapterNumber: 4,
    chapterTitle: 'Entrenamiento de combate',
    mangaId: 2,
    mangaName: 'BOKU NO HERO',
    mangaType: 'Manga',
    scanName: 'Plus Ultra Scans',
    uploadedAt: '2026-11-06T23:22:36.22',
    timeAgo: 'Reciente'
  },
  {
    chapterId: 11,
    chapterNumber: 3,
    chapterTitle: 'Los mandamientos del templo',
    mangaId: 4,
    mangaName: 'SOLO LEVELING',
    mangaType: 'Manhwa',
    scanName: 'Solo Scanlation',
    uploadedAt: '2026-10-25T23:22:36.22',
    timeAgo: 'Reciente'
  },
  {
    chapterId: 6,
    chapterNumber: 3,
    chapterTitle: 'Línea de salida',
    mangaId: 2,
    mangaName: 'BOKU NO HERO',
    mangaType: 'Manga',
    scanName: 'Plus Ultra Scans',
    uploadedAt: '2026-10-30T23:22:36.22',
    timeAgo: 'Reciente'
  },
  {
    chapterId: 5,
    chapterNumber: 2,
    chapterTitle: 'Rugido en el examen',
    mangaId: 2,
    mangaName: 'BOKU NO HERO',
    mangaType: 'Manga',
    scanName: 'Plus Ultra Scans',
    uploadedAt: '2026-10-23T23:22:36.22',
    timeAgo: 'Reciente'
  }
];

const RecentChapters = () => {
  const { t } = useLanguage();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchRecent = async () => {
      try {
        const [chData, mData, sData] = await Promise.all([
          chaptersApi.getAll().catch(() => []),
          mangasApi.getMangas().catch(() => []),
          scansApi.getScans().catch(() => [])
        ]);

        if (!isMounted) return;

        const mangasMap = {};
        (mData || []).forEach(m => {
          mangasMap[m.mangaId] = m;
        });

        const scansMap = {};
        (sData || []).forEach(s => {
          scansMap[s.scanId] = s.scanName;
        });

        if (chData && chData.length > 0) {
          // Filtrar capítulos activos
          const activeChapters = chData.filter(c => c.chapterStatus !== false);

          // Ordenar por fecha de subida descendente (más nuevos primero)
          activeChapters.sort((a, b) => {
            const dateA = new Date(a.uploadedAt || 0).getTime();
            const dateB = new Date(b.uploadedAt || 0).getTime();
            return dateB - dateA || (b.chapterId - a.chapterId);
          });

          // Combinar con información del manga
          const combined = activeChapters.map(ch => {
            const parentManga = mangasMap[ch.mangaId] || canonicalMangas.find(cm => cm.mangaId === ch.mangaId || cm.id === ch.mangaId) || {};
            const mangaName = parentManga.mangaName || parentManga.mangaTittle || 'Manga';
            const mangaImage = getMangaImage(parentManga);
            const mangaType = parentManga.mangaType || parentManga.mangaTypeName || 'Manga';
            const scanName = scansMap[ch.scanId] || (ch.scanId ? `Scan #${ch.scanId}` : 'Scan Oficial');

            return {
              ...ch,
              mangaName,
              mangaImage,
              mangaType,
              scanName,
              timeAgo: formatTimeAgo(ch.uploadedAt)
            };
          });

          setChapters(combined);
        } else {
          // Fallback desactivado para mostrar solo datos reales de BD
          // setChapters(
          //   fallbackRecentChapters.map(fb => {
          //     const parent = canonicalMangas.find(cm => cm.mangaId === fb.mangaId) || {};
          //     return {
          //       ...fb,
          //       mangaImage: getMangaImage(parent)
          //     };
          //   })
          // );
          setChapters([]);
        }
      } catch (err) {
        console.warn('Error al cargar últimos capítulos:', err);
        if (isMounted) {
          // setChapters(
          //   fallbackRecentChapters.map(fb => {
          //     const parent = canonicalMangas.find(cm => cm.mangaId === fb.mangaId) || {};
          //     return {
          //       ...fb,
          //       mangaImage: getMangaImage(parent)
          //     };
          //   })
          // );
          setChapters([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRecent();
    return () => { isMounted = false; };
  }, []);

  return (
    <section className="recent-chapters-section">
      <div className="recent-section-header">
        <div className="title-row">
          <span className="section-pill">
            <i className="fa fa-bolt"></i> {t('home.readNow')}
          </span>
          <h2 className="section-title">{t('home.recentChaptersTitle')}</h2>
        </div>
        <p className="section-subtitle">
          {t('home.recentChaptersSub')}
        </p>
      </div>

      {loading && chapters.length === 0 ? (
        <div className="recent-loading-box">
          <i className="fa fa-spinner fa-spin"></i>
          <span>Cargando últimos lanzamientos...</span>
        </div>
      ) : chapters.length === 0 ? (
        <div className="recent-empty-box">
          <i className="fa fa-book-open"></i>
          <p>No hay capítulos recientes publicados por el momento.</p>
        </div>
      ) : (
        <div className="recent-chapters-grid">
          {chapters.map((item) => (
            <Link
              to={`/manga/${item.mangaId}/chapter/${item.chapterId}`}
              key={item.chapterId}
              className="recent-chapter-card"
              title={`Leer Capítulo ${item.chapterNumber} de ${item.mangaName}`}
            >
              <div className="card-thumb-wrap">
                <img src={item.mangaImage} alt={item.mangaName} loading="lazy" />
                <div className="thumb-overlay" />

                {/* Badge de Capítulo grande y destacado */}
                <div className="chapter-badge">
                  <i className="fa fa-book"></i> Cap. {item.chapterNumber}
                </div>

                {/* Badge de tiempo relativo */}
                {item.timeAgo && (
                  <div className="time-badge">
                    <i className="fa fa-clock-o"></i> {item.timeAgo}
                  </div>
                )}

                {/* Overlay hover con icono play */}
                <div className="play-overlay">
                  <span className="play-icon-circle">
                    <i className="fa fa-play"></i>
                  </span>
                </div>
              </div>

              <div className="card-details">
                <div className="manga-type-tag">
                  {item.mangaType}
                </div>

                <h3 className="manga-name" title={item.mangaName}>
                  {item.mangaName}
                </h3>

                <p className="chapter-title" title={item.chapterTitle}>
                  {item.chapterTitle || `Capítulo ${item.chapterNumber}`}
                </p>

                {item.scanName && (
                  <div className="scan-tag" title={`Subido por ${item.scanName}`}>
                    <i className="fa fa-users"></i>
                    <span>{item.scanName}</span>
                  </div>
                )}

                <div className="card-footer-cta">
                  <span className="cta-button">
                    <i className="fa fa-book-open"></i> Leer Cap. {item.chapterNumber}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecentChapters;
