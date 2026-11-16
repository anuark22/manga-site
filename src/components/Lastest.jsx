import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import mangasTopTier from './mangasTopTier';
import { mangasApi } from '../services/api';
import { getMangaImage } from '../utils/imageHelper';
import '../styles/Lastest.scss';

const Lastest = () => {
    const [mangas, setMangas] = useState(mangasTopTier);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchPopular = async () => {
            try {
                const data = await mangasApi.getPopular(10);
                if (isMounted && data && data.length > 0) {
                    setMangas(data);
                }
            } catch (err) {
                console.warn('Usando mangasTopTier fallback:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchPopular();
        return () => { isMounted = false; };
    }, []);

    return (  
        <div className="main-header">
           <div className="main-header-bar">Popular Manga Tier</div> 
           <div className="top-tier-mangas">
            {
                    loading && mangas.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Cargando mangas populares...
                        </div>
                    ) :
                    mangas.length > 0 ?
                    mangas.map((manga, idx) => {
                        const id = manga.mangaId || manga.id || (idx + 1);
                        const mangaName = manga.mangaName || manga.mangaTittle;
                        const synopsis = manga.synopsis || manga.mangaDescription;
                        const mangaType = manga.mangaType || manga.mangaTypeName || 'Manga';
                        const mangaDemography = manga.mangaDemography || manga.demographyName || 'Shounen';
                        const mangaImage = getMangaImage(manga);
                        const cardClass = manga.card || `card card-${(idx % 5) + 1}`;

                        return (
                            <Link to={`/manga/${id}`} key={id} className={cardClass}>
                                <div className="synopsis">
                                    <p><b>Synopsis: </b>{synopsis}</p>
                                </div>
                                <div className="card-content">
                                    <img src={mangaImage} alt={mangaName}/>
                                    <div className="manga-tittle">
                                        <b>{mangaName}</b>
                                    </div>
                                    <div className={mangaType}>
                                        {mangaType}
                                    </div>
                                    <div className={mangaDemography}>
                                        <b>{mangaDemography}</b>
                                    </div>
                                </div>
                            </Link>
                        );
                    }) : (
                    <div className="no-mangas">
                        <p>No Ranking yet</p>
                    </div>
                    )
            }
           </div>
        </div>
    );
};

export default Lastest;
