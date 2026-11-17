import React, { useState } from 'react';
import '../styles/Nav.scss';
import { Link, useNavigate } from 'react-router-dom';
import { useSearchTerm } from '../Context/SearchBarContext';
import { useTheme } from '../Context/ThemeContext';
import { useAuth } from '../Context/AuthContext';
import { useClickOutside } from '../hooks/useClickOutside';
import SearchBox from './SearchBox';

const Nav = () => {
    const { setSearchTerm } = useSearchTerm();       
    const { theme, toggleTheme } = useTheme();
    const { user, isAuthenticated, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const isAdmin = user && (
        user.roleId === 2 || 
        user.roleName?.toUpperCase() === 'ADMIN'
    );

    const isScanOrAdmin = user && (
        user.roleId === 2 || 
        user.roleId === 3 || 
        user.roleName?.toUpperCase() === 'ADMIN' || 
        user.roleName?.toUpperCase() === 'SCAN'
    );

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

    const handleLogout = () => {
        logout();
        setIsOpen(false);
        navigate('/');
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
                    <Link to="/my-list"><b>YOUR LIST</b></Link>
                    <Link to="/forum"><b>FORUM</b></Link>
                    <Link to="/news"><b>NEWS</b></Link>
                    {isScanOrAdmin && (
                        <Link to="/scan-dashboard" className="scan-panel-link" title="Panel de Scanlation y Gestión">
                            <i className="fa fa-cloud-upload" style={{ marginRight: '6px' }}></i><b>PANEL SCAN</b>
                        </Link>
                    )}
                    {isAdmin && (
                        <Link to="/admin-dashboard" className="admin-panel-link" title="Panel de Administración Global">
                            <i className="fa fa-shield" style={{ marginRight: '6px' }}></i><b>PANEL ADMIN</b>
                        </Link>
                    )}
                </div>
                <SearchBox />
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

                    {isAuthenticated ? (
                        <div className="nav-user-profile">
                            <Link to="/profile" className="user-badge" title="Ver y editar mi perfil">
                                <i className="fa fa-user-circle" aria-hidden="true"></i>
                                <b>{user?.username || 'Usuario'}</b>
                            </Link>
                            <button 
                                type="button" 
                                className="logout-btn" 
                                onClick={handleLogout}
                                title="Cerrar sesión"
                            >
                                <i className="fa fa-sign-out" aria-hidden="true"></i>
                                <span>LOGOUT</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link to="/login">LOGIN</Link>
                            <Link to="/register">REGISTER</Link>
                        </>
                    )}
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
                        <li><Link to="/my-list" onClick={handleLinkClick}><b>YOUR LIST</b></Link></li>
                        <li><Link to="/forum" onClick={handleLinkClick}><b>FORUM</b></Link></li>
                        <li><Link to="/news" onClick={handleLinkClick}><b>NEWS</b></Link></li>
                        {isScanOrAdmin && (
                            <li className="mobile-action-item">
                                <Link to="/scan-dashboard" onClick={handleLinkClick} className="mobile-nav-btn scan-btn">
                                    <span className="mobile-btn-icon"><i className="fa fa-cloud-upload"></i></span>
                                    <span className="mobile-btn-text">PANEL SCAN</span>
                                </Link>
                            </li>
                        )}
                        {isAdmin && (
                            <li className="mobile-action-item">
                                <Link to="/admin-dashboard" onClick={handleLinkClick} className="mobile-nav-btn admin-btn">
                                    <span className="mobile-btn-icon"><i className="fa fa-shield"></i></span>
                                    <span className="mobile-btn-text">PANEL ADMIN</span>
                                </Link>
                            </li>
                        )}

                        {isAuthenticated ? (
                            <>
                                <li className="mobile-action-item mobile-user-info">
                                    <Link 
                                        to="/profile" 
                                        onClick={handleLinkClick}
                                        className="mobile-nav-btn user-btn"
                                    >
                                        <span className="mobile-btn-icon"><i className="fa fa-user-circle"></i></span>
                                        <span className="mobile-btn-text">
                                            {user?.username} <small>(Mi Perfil)</small>
                                        </span>
                                    </Link>
                                </li>
                                <li className="mobile-action-item mobile-logout-item">
                                    <button 
                                        type="button" 
                                        onClick={handleLogout}
                                        className="mobile-nav-btn logout-btn"
                                    >
                                        <span className="mobile-btn-icon"><i className="fa fa-sign-out"></i></span>
                                        <span className="mobile-btn-text">LOGOUT</span>
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="mobile-action-item">
                                    <Link to="/login" onClick={handleLinkClick} className="mobile-nav-btn auth-btn">
                                        <span className="mobile-btn-icon"><i className="fa fa-sign-in"></i></span>
                                        <span className="mobile-btn-text">LOGIN</span>
                                    </Link>
                                </li>
                                <li className="mobile-action-item">
                                    <Link to="/register" onClick={handleLinkClick} className="mobile-nav-btn auth-btn">
                                        <span className="mobile-btn-icon"><i className="fa fa-user-plus"></i></span>
                                        <span className="mobile-btn-text">REGISTER</span>
                                    </Link>
                                </li>
                            </>
                        )}

                        <SearchBox isMobile={true} onAfterNavigate={handleLinkClick} />
                    </ul>
                </div>
            </nav> 
        </div>
    );
};

export default Nav;
