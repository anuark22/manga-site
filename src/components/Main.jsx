import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Lastest from './Lastest';
import RecentChapters from './RecentChapters';
import '../styles/Main.scss';
import NoticeCard from './NoticeCard';
import { noticesApi } from '../services/api';

const Main = () => {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);

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
            <div className="main-content">
                <Lastest />
                <RecentChapters />
            </div>
            <div className="main-sidebar">
                <Link to="/news" className="notices-bar" title="Ver portal de noticias">
                    <span>Notices / Noticias</span>
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
        </div>
    );
};

export default Main;
