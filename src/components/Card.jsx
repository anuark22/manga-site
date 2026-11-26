import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Card.scss';
import { useSearchTerm } from '../Context/SearchBarContext';
import { useLanguage } from '../Context/LanguageContext';
import { getMangaImage } from '../utils/imageHelper';

const Card = ({ mangas, progressMap = null }) => {
  const { searchTerm } = useSearchTerm();
  const { language } = useLanguage();
  const safeMangas = Array.isArray(mangas) ? mangas : [];

  const filtered = safeMangas.filter((e) => {
    const title = (e.mangaName || e.mangaTittle || '').toLowerCase();
    const alt = (e.alternativeNames || '').toLowerCase();
    const term = (searchTerm || '').trim().toLowerCase();
    if (!term) return true;
    return title.includes(term) || alt.includes(term);
  });

  return (
    <Fragment>
      {filtered.length > 0 ? (
        filtered.map((manga, idx) => {
          const id = manga.mangaId || manga.id || (idx + 1);
          const name = manga.mangaName || manga.mangaTittle;
          const synopsis = manga.synopsis || manga.mangaDescription || 'Sinopsis no disponible.';
          const type = manga.mangaType || manga.mangaTypeName || 'Manga';
          const demography = manga.mangaDemography || manga.demographyName || 'Shounen';
          const image = getMangaImage(manga);
          const cardClass = manga.card || `card card-${(idx % 5) + 1}`;
          const prog = progressMap ? progressMap[id] : null;
          const totalCh = prog?.totalChapters || 0;
          const readCh = prog?.readChaptersCount || 0;
          const unreadCh = Math.max(0, totalCh - readCh);
          const hasNew = unreadCh > 0;
          const pct = totalCh > 0 ? Math.min(100, Math.round((readCh / totalCh) * 100)) : 0;

          return (
            <Link to={`/manga/${id}`} key={id} className={cardClass}>
              <div className="synopsis">
                <p><b>Synopsis: </b>{synopsis}</p>
              </div>
              <div className="card-content">
                <img src={image} alt={name}/>
                <div className="manga-tittle">
                  <b>{name}</b>
                </div>
                <div className={type}>
                  {type}
                </div>
                {prog && (
                  <div
                    className={`card-progress-badge ${hasNew ? 'has-new' : totalCh > 0 ? 'up-to-date' : ''}`}
                    title={
                      hasNew
                        ? `${readCh}/${totalCh} — ${unreadCh} ${language === 'en' ? 'unread chapters' : 'capítulos nuevos por ver'}`
                        : `${readCh}/${totalCh} ${language === 'en' ? 'chapters read' : 'capítulos vistos'}`
                    }
                  >
                    <div className="card-progress-row">
                      <span className="progress-count">
                        <i className="fa fa-eye" aria-hidden="true"></i> {readCh}/{totalCh}
                      </span>
                      {hasNew ? (
                        <span className="progress-status-pill new">
                          +{unreadCh} {language === 'en' ? 'new' : (unreadCh === 1 ? 'nuevo' : 'nuevos')}
                        </span>
                      ) : totalCh > 0 ? (
                        <span className="progress-status-pill done">
                          <i className="fa fa-check" aria-hidden="true"></i> {language === 'en' ? 'Up to date' : 'Al día'}
                        </span>
                      ) : null}
                    </div>
                    <div className="card-progress-track">
                      <div className="card-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}
                <div className={demography}>
                  <b>{demography}</b>
                </div>
              </div>
            </Link>
          );
        })
      ) : (
        <div className="no-mangas">
          <p>No Mangas Found</p>
        </div>
      )}
    </Fragment>
  );
};

export default Card;
