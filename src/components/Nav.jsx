import React, { useState } from 'react';
import '../styles/Nav.scss';
import { Link, useNavigate } from 'react-router-dom';
import { useSearchTerm } from '../Context/SearchBarContext';
import { useTheme } from '../Context/ThemeContext';
import { useAuth } from '../Context/AuthContext';
import { useLanguage } from '../Context/LanguageContext';
import { useClickOutside } from '../hooks/useClickOutside';
import { normalizePageUrl } from '../services/api';
import SearchBox from './SearchBox';

const FlagES = () => (
    <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true" style={{ borderRadius: '2px', flexShrink: 0, boxShadow: '0 0 1px rgba(0,0,0,0.4)' }}>
        <rect width="18" height="12" fill="#AA151B" />
        <rect y="3" width="18" height="6" fill="#F1BF00" />
    </svg>
);

const FlagUS = () => (
    <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true" style={{ borderRadius: '2px', flexShrink: 0, boxShadow: '0 0 1px rgba(0,0,0,0.4)' }}>
        <rect width="18" height="12" fill="#B22234" />
        <rect y="1.8" width="18" height="1" fill="#FFFFFF" />
        <rect y="3.8" width="18" height="1" fill="#FFFFFF" />
        <rect y="5.8" width="18" height="1" fill="#FFFFFF" />
        <rect y="7.8" width="18" height="1" fill="#FFFFFF" />
        <rect y="9.8" width="18" height="1" fill="#FFFFFF" />
        <rect width="8" height="6.5" fill="#3C3B6E" />
        <circle cx="2" cy="1.8" r="0.5" fill="#FFFFFF" />
        <circle cx="4" cy="1.8" r="0.5" fill="#FFFFFF" />
        <circle cx="6" cy="1.8" r="0.5" fill="#FFFFFF" />
        <circle cx="3" cy="3.3" r="0.5" fill="#FFFFFF" />
        <circle cx="5" cy="3.3" r="0.5" fill="#FFFFFF" />
        <circle cx="2" cy="4.8" r="0.5" fill="#FFFFFF" />
        <circle cx="4" cy="4.8" r="0.5" fill="#FFFFFF" />
        <circle cx="6" cy="4.8" r="0.5" fill="#FFFFFF" />
    </svg>
);

const Nav = () => {
    const { setSearchTerm } = useSearchTerm();       
    const { theme, toggleTheme } = useTheme();
    const { user, isAuthenticated, logout } = useAuth();
    const { language, setLanguage, toggleLanguage, t } = useLanguage();
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
                    <Link to="/manga-section"><b>{t('nav.library')}</b></Link>
                    <Link to="/my-list"><b>{t('nav.yourList')}</b></Link>
                    <Link to="/forum"><b>{t('nav.forum')}</b></Link>
                    <Link to="/news"><b>{t('nav.news')}</b></Link>
                    {isScanOrAdmin && (
                        <Link to="/scan-dashboard" className="scan-panel-link" title="Panel de Scanlation y Gestión">
                            <i className="fa fa-cloud-upload" style={{ marginRight: '6px' }}></i><b>{t('nav.panelScan')}</b>
                        </Link>
                    )}
                    {isAdmin && (
                        <Link to="/admin-dashboard" className="admin-panel-link" title="Panel de Administración Global">
                            <i className="fa fa-shield" style={{ marginRight: '6px' }}></i><b>{t('nav.panelAdmin')}</b>
                        </Link>
                    )}
                </div>
                <SearchBox />
                <div className="nav-log-section">
                    <div className="lang-switcher-pill" role="group" aria-label="Language selector">
                        <button
                            type="button"
                            className={`lang-btn ${language === 'es' ? 'active' : ''}`}
                            onClick={() => setLanguage('es')}
                            title="Español (ES)"
                        >
                            <span>ES</span>
                            <FlagES />
                        </button>
                        <button
                            type="button"
                            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                            onClick={() => setLanguage('en')}
                            title="English (EN)"
                        >
                            <span>EN</span>
                            <FlagUS />
                        </button>
                    </div>

                    <button 
                        type="button" 
                        className="theme-toggle-btn"
                        onClick={toggleTheme}
                        title={theme === 'dark' ? 'Activar tema Pastel cálido' : 'Activar tema Oscuro azul'}
                    >
                        <i className={`fa ${theme === 'dark' ? 'fa-sun-o' : 'fa-moon-o'}`} aria-hidden="true"></i>
                        <span>{theme === 'dark' ? t('nav.themePastel') : t('nav.themeDark')}</span>
                    </button>

                    {isAuthenticated ? (
                        <div className="nav-user-profile">
                            <Link to="/profile" className="user-badge" title="Ver y editar mi perfil">
                                {user?.avatarUrl ? (
                                    <img
                                        src={normalizePageUrl(user.avatarUrl)}
                                        alt={user?.username || 'Avatar'}
                                        style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '1.5px solid rgba(96, 165, 250, 0.7)'
                                        }}
                                    />
                                ) : (
                                    <i className="fa fa-user-circle" aria-hidden="true"></i>
                                )}
                                <b>{user?.username || 'Usuario'}</b>
                            </Link>
                            <button 
                                type="button" 
                                className="logout-btn" 
                                onClick={handleLogout}
                                title={t('nav.logout')}
                            >
                                <i className="fa fa-sign-out" aria-hidden="true"></i>
                                <span>{t('nav.logout')}</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link to="/login">{t('nav.login')}</Link>
                            <Link to="/register">{t('nav.register')}</Link>
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
                            className="lang-toggle-btn-mobile"
                            onClick={toggleLanguage}
                            title={t('nav.langTooltip')}
                        >
                            <span>{language.toUpperCase()}</span>
                            {language === 'es' ? <FlagES /> : <FlagUS />}
                        </button>
                        <button 
                            type="button" 
                            className="theme-toggle-btn-mobile"
                            onClick={toggleTheme}
                            title={theme === 'dark' ? t('nav.themePastel') : t('nav.themeDark')}
                        >
                            <i className={`fa ${theme === 'dark' ? 'fa-sun-o' : 'fa-moon-o'}`} aria-hidden="true"></i>
                        </button>
                        <i className="fa fa-bars" aria-hidden="true" onClick={toggleMenu} id="ham"></i>                   
                    </div>
                    <ul style={{ display: isOpen ? 'flex' : 'none' }}>
                        <li><Link to="/manga-section" onClick={handleLinkClick}><b>{t('nav.library')}</b></Link></li>
                        <li><Link to="/my-list" onClick={handleLinkClick}><b>{t('nav.yourList')}</b></Link></li>
                        <li><Link to="/forum" onClick={handleLinkClick}><b>{t('nav.forum')}</b></Link></li>
                        <li><Link to="/news" onClick={handleLinkClick}><b>{t('nav.news')}</b></Link></li>
                        {isScanOrAdmin && (
                            <li className="mobile-action-item">
                                <Link to="/scan-dashboard" onClick={handleLinkClick} className="mobile-nav-btn scan-btn">
                                    <span className="mobile-btn-icon"><i className="fa fa-cloud-upload"></i></span>
                                    <span className="mobile-btn-text">{t('nav.panelScan')}</span>
                                </Link>
                            </li>
                        )}
                        {isAdmin && (
                            <li className="mobile-action-item">
                                <Link to="/admin-dashboard" onClick={handleLinkClick} className="mobile-nav-btn admin-btn">
                                    <span className="mobile-btn-icon"><i className="fa fa-shield"></i></span>
                                    <span className="mobile-btn-text">{t('nav.panelAdmin')}</span>
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
                                            {user?.username}
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
                                        <span className="mobile-btn-text">{t('nav.logout')}</span>
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="mobile-action-item">
                                    <Link to="/login" onClick={handleLinkClick} className="mobile-nav-btn auth-btn">
                                        <span className="mobile-btn-icon"><i className="fa fa-sign-in"></i></span>
                                        <span className="mobile-btn-text">{t('nav.login')}</span>
                                    </Link>
                                </li>
                                <li className="mobile-action-item">
                                    <Link to="/register" onClick={handleLinkClick} className="mobile-nav-btn auth-btn">
                                        <span className="mobile-btn-icon"><i className="fa fa-user-plus"></i></span>
                                        <span className="mobile-btn-text">{t('nav.register')}</span>
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
