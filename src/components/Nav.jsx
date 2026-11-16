import React, { useState } from 'react';
import '../styles/Nav.scss';
import { Link } from 'react-router-dom';
import { useSearchTerm } from '../Context/SearchBarContext';
import { useTheme } from '../Context/ThemeContext';
import { useClickOutside } from '../hooks/useClickOutside';

const Nav = () => {
    const { setSearchTerm } = useSearchTerm();       
    const { theme, toggleTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    // Cierra el menú móvil al hacer clic fuera
    const mobileMenuRef = useClickOutside(() => {
        if (isOpen) setIsOpen(false);
    });

    const toggleMenu = () => {
        setIsOpen(prev => !prev);
    };

    const handleLinkClick = () => {
        setIsOpen(false);
    };

    return ( 
        <div>
            <nav className="main-navbar">
                <div className="page-tittle">
                    <Link to="/" >
                        <p>Our<b>Manga</b>Site</p>
                    </Link>
                </div>
                <div className="nav-buttons">
                    <Link to="/manga-section"><b>LIBRARY</b></Link>
                    <Link to="/"><b>YOUR LIST</b></Link>
                    <Link to="/forum"><b>FORUM</b></Link>
                </div>
                <div className="search">
                    <input type="text" name="search" placeholder="Search ..." onChange={e => {setSearchTerm(e.target.value)}}/>
                    <Link to="/manga-section" >
                        <i className="fa fa-search" aria-hidden="true"></i>
                    </Link>
                </div>
                <div className="nav-log-section">
                    <button 
                        type="button" 
                        className="theme-toggle-btn"
                        onClick={toggleTheme}
                        title={theme === 'dark' ? 'Activar tema Pastel cálido' : 'Activar tema Oscuro azul'}
                    >
                        <i className={`fa ${theme === 'dark' ? 'fa-sun-o' : 'fa-moon-o'}`} aria-hidden="true"></i>
                        <span>{theme === 'dark' ? 'Pastel' : 'Oscuro'}</span>
                    </button>
                    <Link to="/login" >LOGIN</Link>
                    <Link to="/register" >REGISTER</Link>
                </div>
            </nav>
            <nav className="toggle-navbar" ref={mobileMenuRef}> 
                <div className="page-tittle">
                    <Link to="/" onClick={handleLinkClick}>
                        <p>Our<b>Manga</b>Site</p>
                    </Link>
                    <div className="toggle-actions">
                        <button 
                            type="button" 
                            className="theme-toggle-btn-mobile"
                            onClick={toggleTheme}
                            title={theme === 'dark' ? 'Tema Pastel' : 'Tema Oscuro'}
                        >
                            <i className={`fa ${theme === 'dark' ? 'fa-sun-o' : 'fa-moon-o'}`} aria-hidden="true"></i>
                        </button>
                        <i className="fa fa-bars" aria-hidden="true" onClick={toggleMenu} id="ham"></i>                   
                    </div>
                    <ul style={{ display: isOpen ? 'flex' : 'none' }}>
                        <li><Link to="/manga-section" onClick={handleLinkClick}><b>LIBRARY</b></Link></li>
                        <li><Link to="/" onClick={handleLinkClick}><b>YOUR LIST</b></Link></li>
                        <li><Link to="/forum" onClick={handleLinkClick}><b>FORUM</b></Link></li>
                        <li><Link to="/login" onClick={handleLinkClick}>LOGIN</Link></li>
                        <li><Link to="/register" onClick={handleLinkClick}>REGISTER</Link></li>
                        <div className="search">
                            <input 
                                type="text" 
                                name="search" 
                                placeholder="Search ..."  
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <Link to="/manga-section" onClick={handleLinkClick}>
                                <i className="fa fa-search" aria-hidden="true"></i>
                            </Link>
                        </div>
                    </ul>
                </div>
            </nav> 
        </div>
    );
};

export default Nav;
