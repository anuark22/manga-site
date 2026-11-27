import React, { useState } from 'react';
import '../styles/SideBar.scss';
import { forumApi } from '../services/api';
import { useAuth } from '../Context/AuthContext';
import { useLanguage } from '../Context/LanguageContext';
import ConfirmModal from './ConfirmModal';

const SideBar = ({ onSelectTopic, onPostCreated }) => {
    const { isAuthenticated } = useAuth();
    const { t } = useLanguage();
    // Control individual e independiente para cada sección
    const [openSections, setOpenSections] = useState({
        community: true,
        library: false,
        video: false,
        groups: false
    });

    const [activeTopic, setActiveTopic] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newCategory, setNewCategory] = useState('OMS Community');
    const [newContent, setNewContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [honeypot, setHoneypot] = useState('');
    const [popup, setPopup] = useState(null);

    const toggleSection = (key) => {
        setOpenSections(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleTopicClick = (sectionTitle, topic) => {
        setActiveTopic(topic);
        if (onSelectTopic) {
            onSelectTopic({ topic: sectionTitle, subTopic: topic === 'Todos' || topic === 'All' ? null : topic });
        }
    };

    const handleCreateDiscussion = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            setPopup({
                variant: 'warning',
                title: 'Sesión requerida',
                message: 'Debes iniciar sesión para crear una discusión en el foro.',
                confirmText: 'Entendido'
            });
            return;
        }

        if (!newTitle.trim()) {
            setPopup({
                variant: 'warning',
                title: 'Título requerido',
                message: 'Por favor ingresa un título para la discusión.',
                confirmText: 'Entendido'
            });
            return;
        }

        setSubmitting(true);
        try {
            await forumApi.createPost({
                title: newTitle.trim(),
                content: newContent.trim() || 'Discusión de la comunidad',
                topic: newCategory,
                subTopic: activeTopic !== 'All' ? activeTopic : 'General',
                honeypot
            });

            setIsModalOpen(false);
            setNewTitle('');
            setNewContent('');
            setHoneypot('');
            setPopup({
                variant: 'success',
                title: '¡Discusión publicada!',
                message: `Se creó tu discusión en "${newCategory}": "${newTitle}"`,
                confirmText: 'Aceptar'
            });

            if (onPostCreated) {
                onPostCreated();
            }
        } catch (err) {
            setPopup({
                variant: 'danger',
                icon: 'fa-exclamation-circle',
                title: 'Error al publicar',
                message: err.message || 'Error del servidor al publicar la discusión.',
                confirmText: 'Cerrar'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const sections = [
        {
            key: 'community',
            title: 'OMS Community',
            iconClass: 'fa fa-square oms-color',
            topics: ['All', 'General', 'Release', 'Announcements', 'Suggestions', 'Help']
        },
        {
            key: 'library',
            title: 'Library & Mangas',
            iconClass: 'fa fa-square library-color',
            topics: ['All', 'Shounen & Action', 'Seinen & Mystery', 'Romance & Shoujo', 'Recommendations', 'Reviews']
        },
        {
            key: 'video',
            title: 'Video & Anime',
            iconClass: 'fa fa-square video-library-color',
            topics: ['All', 'Episodes & Stream', 'Movie Adaptations', 'Trailers & Teasers', 'Soundtracks & OST']
        },
        {
            key: 'groups',
            title: 'Scanlation Groups',
            iconClass: 'fa fa-square groups-color',
            topics: ['All', 'Recruitment', 'Releases Showcase', 'Translators & Editors', 'Partnerships']
        }
    ];

    return ( 
        <div className="forum-sidebar">
            <button type="button" onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}>
                {t('forum.createDiscussion')} <i className="fa fa-plus" aria-hidden="true"></i>
            </button>

            <div className="ul-container">
                {sections.map(({ key, title, iconClass, topics }) => {
                    const isOpen = openSections[key];
                    return (
                        <div className="sidebar-main-group" key={key}>
                            <div 
                                className="topic-head" 
                                onClick={() => toggleSection(key)} 
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="topic-head-left">
                                    <i className={iconClass} aria-hidden="true"></i>
                                    <p>{t(`forum.categories.${title}`, title)}</p>
                                </div>
                                <i 
                                    className={`fa ${isOpen ? 'fa-angle-up' : 'fa-angle-down'} chevron-icon`}
                                    aria-hidden="true"
                                ></i>
                            </div>

                            <div 
                                className="option-group" 
                                style={{ display: isOpen ? 'flex' : 'none' }}
                            >
                                <ul>
                                    {topics.map(topic => (
                                        <li 
                                            key={topic}
                                            className={activeTopic === topic ? 'active-topic' : ''}
                                            onClick={() => handleTopicClick(title, topic)}
                                        >
                                            {t(`forum.subTopics.${topic}`, topic)}
                                        </li>
                                    ))}
                                </ul>
                            </div>  
                        </div>
                    );
                })}
            </div>

            {/* Modal para Crear Discusión */}
            {isModalOpen && (
                <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{t('forum.newDiscussionTitle')}</h3>
                            <button 
                                type="button" 
                                className="modal-close-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                &times;
                            </button>
                        </div>

                        {!isAuthenticated && (
                            <div style={{
                                padding: '10px 14px',
                                background: 'rgba(234, 179, 8, 0.15)',
                                border: '1px solid #eab308',
                                borderRadius: '8px',
                                marginBottom: '14px',
                                fontSize: '13px',
                                color: 'var(--text-primary)'
                            }}>
                                <i className="fa fa-info-circle"></i> {t('forum.loginRequiredPost')}
                            </div>
                        )}

                        <form onSubmit={handleCreateDiscussion}>
                            {/* Campo trampa Honeypot anti-spam */}
                            <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0, pointerEvents: 'none', zIndex: -1 }} aria-hidden="true">
                                <input
                                    type="text"
                                    name="topic_verification_hp"
                                    tabIndex="-1"
                                    autoComplete="off"
                                    value={honeypot}
                                    onChange={(e) => setHoneypot(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('forum.categoryLabel')}</label>
                                <select 
                                    value={newCategory} 
                                    onChange={(e) => setNewCategory(e.target.value)}
                                >
                                    <option value="OMS Community">{t('forum.categories.OMS Community', 'OMS Community')}</option>
                                    <option value="Library & Mangas">{t('forum.categories.Library & Mangas', 'Library & Mangas')}</option>
                                    <option value="Video & Anime">{t('forum.categories.Video & Anime', 'Video & Anime')}</option>
                                    <option value="Scanlation Groups">{t('forum.categories.Scanlation Groups', 'Scanlation Groups')}</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>{t('forum.topicTitleLabel')}</label>
                                <input 
                                    type="text" 
                                    placeholder={t('forum.topicTitlePlaceholder')}
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>{t('forum.messageLabel')}</label>
                                <textarea 
                                    rows="4" 
                                    placeholder={t('forum.messagePlaceholder')}
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                />
                            </div>

                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="btn-cancel"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    {t('forum.cancel')}
                                </button>
                                <button type="submit" className="btn-submit" disabled={submitting}>
                                    {submitting ? t('forum.publishing') : t('forum.publishDiscussion')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={Boolean(popup)}
                hideCancel={true}
                variant={popup?.variant || 'primary'}
                icon={popup?.icon}
                title={popup?.title}
                message={popup?.message}
                confirmText={popup?.confirmText || 'Aceptar'}
                onConfirm={() => setPopup(null)}
                onCancel={() => setPopup(null)}
            />
        </div>
    );
};
 
export default SideBar;
