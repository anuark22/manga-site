import React, { useState } from 'react';
import '../styles/SideBar.scss';
import { useClickOutside } from '../hooks/useClickOutside';

const SideBar = () => {
    // Control individual e independiente para cada sección
    const [openSections, setOpenSections] = useState({
        community: true,
        library: false,
        video: false,
        groups: false
    });

    const [activeTopic, setActiveTopic] = useState('General');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newCategory, setNewCategory] = useState('OMS Community');
    const [newContent, setNewContent] = useState('');

    const modalRef = useClickOutside(() => {
        if (isModalOpen) setIsModalOpen(false);
    });

    const toggleSection = (key) => {
        setOpenSections(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleCreateDiscussion = (e) => {
        e.preventDefault();
        if (!newTitle.trim()) {
            alert('Por favor ingresa un título para la discusión');
            return;
        }
        alert(`¡Discusión creada con éxito en "${newCategory}":\n"${newTitle}"!`);
        setIsModalOpen(false);
        setNewTitle('');
        setNewContent('');
    };

    const sections = [
        {
            key: 'community',
            title: 'OMS Community',
            iconClass: 'fa fa-square oms-color',
            topics: ['General', 'Release', 'Announcements', 'Suggestions', 'Help']
        },
        {
            key: 'library',
            title: 'Library & Mangas',
            iconClass: 'fa fa-square library-color',
            topics: ['Shounen & Action', 'Seinen & Mystery', 'Romance & Shoujo', 'Recommendations', 'Reviews']
        },
        {
            key: 'video',
            title: 'Video & Anime',
            iconClass: 'fa fa-square video-library-color',
            topics: ['Episodes & Stream', 'Movie Adaptations', 'Trailers & Teasers', 'Soundtracks & OST']
        },
        {
            key: 'groups',
            title: 'Scanlation Groups',
            iconClass: 'fa fa-square groups-color',
            topics: ['Recruitment', 'Releases Showcase', 'Translators & Editors', 'Partnerships']
        }
    ];

    return ( 
        <div className="forum-sidebar">
            <button type="button" onClick={() => setIsModalOpen(true)}>
                Create discussion <i className="fa fa-plus" aria-hidden="true"></i>
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
                                    <p>{title}</p>
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
                                            onClick={() => setActiveTopic(topic)}
                                        >
                                            {topic}
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
                <div className="modal-backdrop">
                    <div className="modal-card" ref={modalRef}>
                        <div className="modal-header">
                            <h3>Nueva Discusión en el Foro</h3>
                            <button 
                                type="button" 
                                className="modal-close-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleCreateDiscussion}>
                            <div className="form-group">
                                <label>Categoría</label>
                                <select 
                                    value={newCategory} 
                                    onChange={(e) => setNewCategory(e.target.value)}
                                >
                                    <option value="OMS Community">OMS Community</option>
                                    <option value="Library & Mangas">Library & Mangas</option>
                                    <option value="Video & Anime">Video & Anime</option>
                                    <option value="Scanlation Groups">Scanlation Groups</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Título del Tema</label>
                                <input 
                                    type="text" 
                                    placeholder="¿De qué quieres hablar?"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Mensaje</label>
                                <textarea 
                                    rows="4" 
                                    placeholder="Escribe los detalles de tu discusión aquí..."
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
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-submit">
                                    Publicar Discusión
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
 
export default SideBar;
