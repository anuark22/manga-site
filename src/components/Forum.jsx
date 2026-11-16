import React, { useState } from 'react';
import Post from './Post';
import SideBar from './SideBar';
import '../styles/Forum.scss';
import { useClickOutside } from '../hooks/useClickOutside';

const Forum = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedSort, setSelectedSort] = useState('Latest');

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

    const sortOptions = ['Latest', 'Newer', 'Older', 'Popular', 'Trending', 'Discussions'];

    return ( 
        <div className="forum-section">
            <div className="forum-content">
                <SideBar className="sidebar-comp" />
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
                                <button 
                                    type="button" 
                                    className="refresh-btn" 
                                    title="Actualizar discusiones"
                                    onClick={() => alert('Lista de temas actualizada')}
                                > 
                                    <i className="fa fa-refresh" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                        <div className="all-post-container">
                            <Post />                  
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
 
export default Forum;
