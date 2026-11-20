import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Lastest from './Lastest';
import RecentChapters from './RecentChapters';
import '../styles/Main.scss';
import NoticeCard from './NoticeCard';
import { noticesApi } from '../services/api';
import { useLanguage } from '../Context/LanguageContext';
import SEO from './SEO';
import LiveChatWidget from './LiveChatWidget';

const Main = () => {
    const { t } = useLanguage();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'OurMangaSite',
        url: origin,
        description: 'Lee tus mangas, manhwas y manhuas favoritos en línea en español.',
        potentialAction: {
            '@type': 'SearchAction',
            target: `${origin}/manga-section?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
        }
    };

    useEffect(() => {
        let isMounted = true;
        const fetchNotices = async () => {
            try {
                const data = await noticesApi.getNotices();
                if (isMounted && data && data.length > 0) {
                    setNotices(data);
                }
            } catch (err) {
                console.warn('Usando notices fallback:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchNotices();
        return () => { isMounted = false; };
    }, []);

    return (
        <div className="main-container">
            <SEO
                title="OurMangaSite - Lee Manga, Manhwa y Manhua Online"
                description="Explora nuestro catálogo de mangas, manhwas y manhuas en español, lee los últimos capítulos subidos y entérate de las últimas noticias."
                canonicalPath="/"
                schema={websiteSchema}
            />
            <div className="main-content">
                <Lastest />
                <RecentChapters />
            </div>
            <aside className="main-right-column">
                <div className="main-sidebar">
                    <Link to="/news" className="notices-bar" title={t('home.viewAllNews')}>
                        <span>{t('home.noticesTitle')}</span>
                        <i className="fa fa-arrow-right" style={{ fontSize: '13px', marginLeft: 'auto' }}></i>
                    </Link>
                    {loading && notices.length === 0 ? (
                        <div style={{ padding: '16px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                            Cargando noticias...
                        </div>
                    ) : notices.length > 0 ? (
                        notices.map((notice, index) => (
                            <NoticeCard key={notice.noticeId || notice.id || index} notice={notice} />
                        ))
                    ) : (
                        // Fallback inicial por si no hay noticias en base de datos
                        <>
                            <NoticeCard />
                            <NoticeCard />
                        </>
                    )}
                </div>

                {/* Chat en vivo siempre visible debajo de las noticias con las mismas dimensiones */}
                <LiveChatWidget embedded={true} />
            </aside>
        </div>
    );
};

export default Main;
