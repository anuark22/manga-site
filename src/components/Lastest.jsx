import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import mangasTopTier from './mangasTopTier';
import { mangasApi } from '../services/api';
import { getMangaImage } from '../utils/imageHelper';
import { useLanguage } from '../Context/LanguageContext';
import '../styles/Lastest.scss';

const Lastest = () => {
    const { t } = useLanguage();
    const [mangas, setMangas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchPopular = async () => {
            try {
                const data = await mangasApi.getPopular(10);
                if (isMounted && data && data.length > 0) {
                    const list = [...data];
                    // /* Fallback desactivado para mostrar solo datos reales de BD
                    // if (list.length < 6) {
                    //     const fallbackMangas = mangasTopTier.filter(
                    //         fb => !list.some(m => (m.mangaName || m.mangaTittle || '').toLowerCase() === (fb.mangaName || fb.mangaTittle || '').toLowerCase())
                    //     );
                    //     list = [...list, ...fallbackMangas];
                    // }
                    // */
                    setMangas(list.slice(0, 6));
                } else if (isMounted) {
                    // setMangas(mangasTopTier.slice(0, 6));
                    setMangas([]);
                }
            } catch (err) {
                console.warn('Error al obtener mangas populares:', err);
                // if (isMounted) setMangas(mangasTopTier.slice(0, 6));
                if (isMounted) setMangas([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchPopular();
        return () => { isMounted = false; };
    }, []);

    // Se muestran exactamente 4 tarjetas simultáneas en la ventana visible
    const visibleCount = 4;
    // Si hay 6 mangas y se ven 4, los índices de desplazamiento son 0, 1, 2 (maxIndex = 2)
    const maxIndex = Math.max(0, mangas.length - visibleCount);

    // Rotación automática dinámica
    useEffect(() => {
        if (isPaused || mangas.length <= visibleCount) return;
        const timer = setInterval(() => {
            setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
        }, 3800);
        return () => clearInterval(timer);
    }, [isPaused, mangas.length, maxIndex]);

    const handlePrev = () => {
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : maxIndex));
    };

    const handleNext = () => {
        setCurrentIndex(prev => (prev < maxIndex ? prev + 1 : 0));
    };

    return (
        <div
            className="main-header popular-slider-container"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="slider-header-row">
                <div className="popular-badge">
                    <i className="fa fa-fire"></i> {t('home.popularTitle')}
                </div>
                <div className="slider-controls">
                    <button
                        type="button"
                        className="slider-nav-btn prev"
                        onClick={handlePrev}
                        title="Manga anterior"
                        aria-label="Anterior"
                    >
                        <i className="fa fa-chevron-left"></i>
                    </button>
                    <div className="slider-dots">
                        {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                            <button
                                key={idx}
                                type="button"
                                className={`slider-dot ${currentIndex === idx ? 'active' : ''}`}
                                onClick={() => setCurrentIndex(idx)}
                                aria-label={`Slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                    <button
                        type="button"
                        className="slider-nav-btn next"
                        onClick={handleNext}
                        title="Manga siguiente"
                        aria-label="Siguiente"
                    >
                        <i className="fa fa-chevron-right"></i>
                    </button>
                </div>
            </div>

            <div className="slider-viewport">
                {loading && mangas.length === 0 ? (
                    <div className="slider-loading">
                        <i className="fa fa-spinner fa-spin"></i> Cargando mangas populares...
                    </div>
                ) : mangas.length > 0 ? (
                    <div
                        className="slider-track"
                        style={{
                            // Desplaza suavemente según el currentIndex calculando ancho y gap (14px)
                            transform: `translateX(calc(-${currentIndex} * ((100% - (3 * 14px)) / 4 + 14px)))`
                        }}
                    >
                        {mangas.map((manga, idx) => {
                            const id = manga.mangaId || manga.id || (idx + 1);
                            const mangaName = manga.mangaName || manga.mangaTittle;
                            const synopsis = manga.synopsis || manga.mangaDescription || 'Sin sinopsis disponible.';
                            const mangaType = manga.mangaType || manga.mangaTypeName || 'Manga';
                            const mangaDemography = manga.mangaDemography || manga.demographyName || 'Shounen';
                            const mangaImage = getMangaImage(manga);

                            return (
                                <Link
                                    to={`/manga/${id}`}
                                    key={`${id}-${idx}`}
                                    className="popular-card"
                                    title={mangaName}
                                >
                                    <div className="card-thumb">
                                        <img src={mangaImage} alt={mangaName} />
                                        <div className="card-gradient-top" />
                                        <div className="card-gradient-bottom" />
                                        
                                        <span className={`type-badge ${mangaType.toUpperCase()}`}>
                                            {mangaType}
                                        </span>

                                        <div className="card-title-bar">
                                            <h4>{mangaName}</h4>
                                        </div>

                                        <div className="card-footer-meta">
                                            <span className="demography-badge">{mangaDemography}</span>
                                            {manga.rating && (
                                                <span className="rating-badge">
                                                    <i className="fa fa-star"></i> {manga.rating}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="card-synopsis-hover">
                                        <b>{mangaName}</b>
                                        <p>{synopsis}</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="no-mangas">
                        <p>No hay mangas populares disponibles.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Lastest;
