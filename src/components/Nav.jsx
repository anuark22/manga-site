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
                    {isScanOrAdmin && (
                        <Link to="/scan-dashboard" className="scan-panel-link" title="Panel de Scanlation y Gestión">
                            <i className="fa fa-cloud-upload" style={{ marginRight: '6px' }}></i><b>PANEL SCAN</b>
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
                        {isScanOrAdmin && (
                            <li>
                                <Link to="/scan-dashboard" onClick={handleLinkClick} style={{ color: 'var(--main-color-light, #f4a261)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <i className="fa fa-cloud-upload"></i> <b>PANEL SCAN</b>
                                </Link>
                            </li>
                        )}

                        {isAuthenticated ? (
                            <>
                                <li className="mobile-user-info">
                                    <Link 
                                        to="/profile" 
                                        onClick={handleLinkClick}
                                        style={{ color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <i className="fa fa-user-circle"></i> {user?.username} <b>(Mi Perfil)</b>
                                    </Link>
                                </li>
                                <li>
                                    <button 
                                        type="button" 
                                        onClick={handleLogout}
                                        style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', padding: 0 }}
                                    >
                                        <b>LOGOUT</b>
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li><Link to="/login" onClick={handleLinkClick}>LOGIN</Link></li>
                                <li><Link to="/register" onClick={handleLinkClick}>REGISTER</Link></li>
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
