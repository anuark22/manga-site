import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { executeRecaptcha } from '../services/recaptcha';
import GoogleSignInButton from './GoogleSignInButton';
import SEO from './SEO';
import '../styles/Login.scss';

const Login = () => {
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: location.state?.email || '', password: '' });
    const [honeypot, setHoneypot] = useState('');
    const [error, setError] = useState('');
    const [successBanner] = useState(Boolean(location.state?.registeredSuccess));
    const [loading, setLoading] = useState(false);
    const [lockoutSeconds, setLockoutSeconds] = useState(0);
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleGoogleCredential = async (idToken) => {
        if (lockoutSeconds > 0) return;
        setError('');
        setLoading(true);
        try {
            await googleLogin({ idToken, honeypot });
            navigate('/');
        } catch (err) {
            setError(err.message || 'No se pudo iniciar sesión con Google.');
        } finally {
            setLoading(false);
        }
    };

    // Cuenta regresiva en vivo si se activa un bloqueo temporal
    useEffect(() => {
        if (lockoutSeconds <= 0) return;
        const interval = setInterval(() => {
            setLockoutSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setError('');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [lockoutSeconds]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (lockoutSeconds > 0) return;
        setError('');
        setLoading(true);

        try {
            const recaptchaToken = await executeRecaptcha('login');
            await login({ 
                email: formData.email.trim(), 
                password: formData.password,
                honeypot,
                recaptchaToken
            });
            navigate('/');
        } catch (err) {
            if (err.status === 429 || err.data?.status === 429) {
                const remaining = err.data?.secondsRemaining || 120;
                setLockoutSeconds(remaining);
                setError(err.message || `Demasiados intentos fallidos. Tu acceso está pausado temporalmente por ${remaining}s.`);
            } else {
                setError(err.message || 'Error al iniciar sesión. Verifica tu email y contraseña.');
            }
        } finally {
            setLoading(false);
        }
    };

    return ( 
        <div className="log-section">
            <SEO title="Iniciar Sesión" noindex={true} canonicalPath="/login" />
            <form onSubmit={handleSubmit}>
                <div className="log-container">
                    <h2 className="auth-title">Iniciar Sesión</h2>

                    {/* Campo trampa Honeypot (invisible para humanos, rellenado por bots de spam) */}
                    <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0, pointerEvents: 'none', zIndex: -1 }} aria-hidden="true">
                        <input 
                            type="text" 
                            name="system_verification_security_code" 
                            tabIndex="-1" 
                            autoComplete="off" 
                            value={honeypot} 
                            onChange={(e) => setHoneypot(e.target.value)} 
                        />
                    </div>
                    
                    {successBanner && !error && (
                        <div style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: 'rgba(16, 185, 129, 0.18)',
                            border: '1px solid #10b981',
                            color: '#fff',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <i className="fa fa-check-circle" style={{ color: '#34d399' }}></i>
                            <span>¡Cuenta creada con éxito! Inicia sesión para continuar.</span>
                        </div>
                    )}

                    {error && (
                        <div style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: lockoutSeconds > 0 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.2)',
                            border: `1px solid ${lockoutSeconds > 0 ? '#eab308' : '#ef4444'}`,
                            color: '#fff',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <i className={`fa ${lockoutSeconds > 0 ? 'fa-lock' : 'fa-exclamation-triangle'}`} style={{ color: lockoutSeconds > 0 ? '#facc15' : '#ef4444' }}></i>
                            <span>
                                {error}
                                {lockoutSeconds > 0 && (
                                    <strong style={{ display: 'block', marginTop: '4px', color: '#fde047' }}>
                                        Tiempo restante: {lockoutSeconds} segundo{lockoutSeconds !== 1 ? 's' : ''}
                                    </strong>
                                )}
                            </span>
                        </div>
                    )}

                    <div className="log-inputs">
                        <input 
                            type="text" 
                            placeholder="Email (ej. testuser@mangasite.com)" 
                            className="username-input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={lockoutSeconds > 0}
                            required
                        />
                    </div>
                    <div className="log-inputs">
                        <div className="password-wrapper">
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                placeholder="Password" 
                                className="password-input"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                disabled={lockoutSeconds > 0}
                                required
                            />
                            <button 
                                type="button" 
                                className="toggle-password-btn"
                                onClick={() => setShowPassword(prev => !prev)}
                                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                disabled={lockoutSeconds > 0}
                            >
                                <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn-login" disabled={loading || lockoutSeconds > 0}>
                        {loading ? 'Iniciando...' : lockoutSeconds > 0 ? `Bloqueado (${lockoutSeconds}s)` : 'Login'}
                    </button>

                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0 6px', opacity: 0.75 }}>
                        <span style={{ flex: 1, height: '1px', background: 'rgba(148, 163, 184, 0.35)' }}></span>
                        <span style={{ fontSize: '12px', color: '#cbd5e1' }}>o</span>
                        <span style={{ flex: 1, height: '1px', background: 'rgba(148, 163, 184, 0.35)' }}></span>
                    </div>

                    <GoogleSignInButton onCredential={handleGoogleCredential} disabled={loading || lockoutSeconds > 0} />

                    <p className="auth-switch">
                        ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
                    </p>
                </div>
            </form>
        </div>
     );
}
 
export default Login;
