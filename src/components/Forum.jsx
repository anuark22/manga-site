import React, { useState, useEffect, useCallback } from 'react';
import Post from './Post';
import SideBar from './SideBar';
import '../styles/Forum.scss';
import { useClickOutside } from '../hooks/useClickOutside';
import { forumApi } from '../services/api';
import postData from './postData';
import SEO from './SEO';

const Forum = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedSort, setSelectedSort] = useState('Latest');
    const [filterCategory, setFilterCategory] = useState(null);
    const [filterSubTopic, setFilterSubTopic] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                sortBy: selectedSort,
                ...(filterCategory ? { topic: filterCategory } : {}),
                ...(filterSubTopic ? { subTopic: filterSubTopic } : {})
            };
            const data = await forumApi.getPosts(params);
            if (data && data.length > 0) {
                setPosts(data);
            } else if (!filterCategory && !filterSubTopic) {
                // Fallback a postData local si la API está vacía
                setPosts(postData);
            } else {
                setPosts([]);
            }
        } catch (err) {
            console.warn('Error al obtener posts del foro, usando fallback:', err);
            setPosts(postData);
        } finally {
            setLoading(false);
        }
    }, [selectedSort, filterCategory, filterSubTopic]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    // Cierra el menú desplegable al hacer clic fuera
    const dropdownRef = useClickOutside(() => {
        if (isOpen) setIsOpen(false);
    });

    const toggleDropdown = () => {
        setIsOpen(prev => !prev);
    };

    const handleSelectSort = (option) => {
        setSelectedSort(option);
        setIsOpen(false);
    };

    const handleSelectTopic = ({ topic, subTopic }) => {
        setFilterCategory(topic);
        setFilterSubTopic(subTopic);
    };

    const handleResetFilters = () => {
        setFilterCategory(null);
        setFilterSubTopic(null);
    };

    const sortOptions = ['Latest', 'Newer', 'Older', 'Popular', 'Trending', 'Discussions'];

    return ( 
        <div className="forum-section">
            <SEO
                title={filterCategory ? `Foro: ${filterCategory}` : 'Foro de la Comunidad Manga'}
                description="Participa en discusiones sobre tus mangas favoritos, recomienda series, comparte reseñas y conversa con la comunidad de OurMangaSite."
                canonicalPath="/forum"
            />
            <div className="forum-content">
                <SideBar 
                    className="sidebar-comp" 
                    onSelectTopic={handleSelectTopic}
                    onPostCreated={fetchPosts}
                />
                <div className="forum-post">
                    <div className="post-card">
                        <div className="post-btns">
                            <div className="discussion-btn">
                                <div className="forum-post-select" ref={dropdownRef}>
                                    <button type="button" onClick={toggleDropdown} id="postHam"> 
                                        <i className="fa fa-filter" aria-hidden="true"></i>
                                        <p>{selectedSort}</p>
                                        <i className={`fa ${isOpen ? 'fa-angle-up' : 'fa-angle-down'}`} aria-hidden="true"></i>
                                    </button>
                                    <ul className="forum-post-ul" style={{ display: isOpen ? 'flex' : 'none' }}>
                                        {sortOptions.map(option => (
                                            <li 
                                                key={option}
                                                className={selectedSort === option ? 'active-sort' : ''}
                                                onClick={() => handleSelectSort(option)}
                                            >
                                                <span>{option}</span>
                                                {selectedSort === option && (
                                                    <i className="fa fa-check" aria-hidden="true"></i>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {(filterCategory || filterSubTopic) && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        <span>Filtro activo: <b>{filterCategory}</b> {filterSubTopic && `> ${filterSubTopic}`}</span>
                                        <button 
                                            type="button" 
                                            onClick={handleResetFilters}
                                            style={{
                                                background: 'none',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                color: 'var(--text-primary)',
                                                cursor: 'pointer',
                                                padding: '2px 8px',
                                                fontSize: '11px'
                                            }}
                                        >
                                            Limpiar filtro
                                        </button>
                                    </div>
                                )}

                                <button 
                                    type="button" 
                                    className="refresh-btn" 
                                    title="Actualizar discusiones"
                                    onClick={fetchPosts}
                                > 
                                    <i className="fa fa-refresh" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                        <div className="all-post-container">
                            <Post posts={posts} loading={loading} />                  
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
 
export default Forum;
