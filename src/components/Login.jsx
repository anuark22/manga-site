import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { useLanguage } from '../Context/LanguageContext';
import { authApi } from '../services/api';
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
    const [successBanner, setSuccessBanner] = useState(
        location.state?.registeredSuccess
            ? '¡Cuenta creada con éxito! Inicia sesión para continuar.'
            : location.state?.passwordResetSuccess
            ? '¡Contraseña restablecida con éxito! Ya puedes iniciar sesión.'
            : ''
    );
    const [loading, setLoading] = useState(false);
    const [lockoutSeconds, setLockoutSeconds] = useState(0);
    const { login, googleLogin } = useAuth();
    const { language } = useLanguage();
    const navigate = useNavigate();

    // Estado del modal de recuperación de contraseña (3 pasos)
    const [showRecoveryModal, setShowRecoveryModal] = useState(false);
    const [recoveryStep, setRecoveryStep] = useState(1); // 1: Email | 2: Token | 3: New Password
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [recoveryToken, setRecoveryToken] = useState('');
    const [recoveryPass, setRecoveryPass] = useState('');
    const [recoveryConfirmPass, setRecoveryConfirmPass] = useState('');
    const [recoveryLoading, setRecoveryLoading] = useState(false);
    const [recoveryError, setRecoveryError] = useState('');
    const [recoveryInfo, setRecoveryInfo] = useState('');

    const openRecoveryModal = () => {
        setRecoveryEmail(formData.email.trim() || '');
        setRecoveryToken('');
        setRecoveryPass('');
        setRecoveryConfirmPass('');
        setRecoveryError('');
        setRecoveryInfo('');
        setRecoveryStep(1);
        setShowRecoveryModal(true);
    };

    const handleSendRecoveryEmail = async (e) => {
        e.preventDefault();
        setRecoveryError('');
        setRecoveryInfo('');
        setRecoveryLoading(true);
        try {
            const recaptchaToken = await executeRecaptcha('forgot_password');
            const res = await authApi.forgotPassword({
                email: recoveryEmail.trim(),
                honeypot,
                recaptchaToken
            });
            setRecoveryInfo(
                res?.errorDescription ||
                    (language === 'en'
                        ? 'If the email is registered, you will receive a recovery code shortly.'
                        : 'Si el correo está registrado, recibirás un código de recuperación en breve.')
            );
            setRecoveryStep(2);
        } catch (err) {
            setRecoveryError(err.message || 'No se pudo enviar el correo de recuperación.');
        } finally {
            setRecoveryLoading(false);
        }
    };

    const handleVerifyRecoveryToken = async (e) => {
        e.preventDefault();
        setRecoveryError('');
        setRecoveryLoading(true);
        try {
            await authApi.validateRecoveryToken({
                email: recoveryEmail.trim(),
                token: recoveryToken.trim()
            });
            setRecoveryInfo('');
            setRecoveryStep(3);
        } catch (err) {
            setRecoveryError(err.message || 'El código de recuperación es inválido o ha expirado.');
        } finally {
            setRecoveryLoading(false);
        }
    };

    const handleCompletePasswordReset = async (e) => {
        e.preventDefault();
        setRecoveryError('');
        if (recoveryPass.length < 6) {
            setRecoveryError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (recoveryPass !== recoveryConfirmPass) {
            setRecoveryError('Las contraseñas no coinciden.');
            return;
        }
        setRecoveryLoading(true);
        try {
            await authApi.resetPassword({
                email: recoveryEmail.trim(),
                token: recoveryToken.trim(),
                newPassword: recoveryPass,
                confirmPassword: recoveryConfirmPass
            });
            setShowRecoveryModal(false);
            setFormData((prev) => ({ ...prev, email: recoveryEmail.trim(), password: '' }));
            setSuccessBanner(
                language === 'en'
                    ? 'Password reset successfully! Log in with your new password.'
                    : '¡Contraseña actualizada con éxito! Inicia sesión con tu nueva contraseña.'
            );
        } catch (err) {
            setRecoveryError(err.message || 'No se pudo actualizar la contraseña.');
        } finally {
            setRecoveryLoading(false);
        }
    };

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
                            <span>{successBanner}</span>
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
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
                        <button
                            type="button"
                            onClick={openRecoveryModal}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#60a5fa',
                                fontSize: '12.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: '2px 0'
                            }}
                        >
                            {language === 'en' ? 'Forgot your password?' : '¿Olvidaste tu contraseña?'}
                        </button>
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

            {showRecoveryModal && (
                <div
                    onClick={() => !recoveryLoading && setShowRecoveryModal(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        background: 'rgba(5, 8, 18, 0.78)',
                        backdropFilter: 'blur(6px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: '420px',
                            background: '#0e1528',
                            border: '1px solid rgba(148, 163, 184, 0.22)',
                            borderRadius: '16px',
                            padding: '24px',
                            boxShadow: '0 22px 55px rgba(0, 0, 0, 0.65)',
                            color: '#f1f5f9'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa fa-key" style={{ color: '#60a5fa' }}></i>
                                {language === 'en' ? 'Recover Password' : 'Recuperar Contraseña'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowRecoveryModal(false)}
                                disabled={recoveryLoading}
                                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
                            >
                                &times;
                            </button>
                        </div>

                        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.45 }}>
                            {recoveryStep === 1 && (language === 'en'
                                ? 'Enter your account email and we will send you a security code and reset link.'
                                : 'Ingresa el correo de tu cuenta y te enviaremos un código de seguridad y un enlace para restablecerla.')}
                            {recoveryStep === 2 && (language === 'en'
                                ? 'Enter the recovery code we sent to your email.'
                                : 'Ingresa el código de recuperación que enviamos a tu correo electrónico.')}
                            {recoveryStep === 3 && (language === 'en'
                                ? 'Create your new password (minimum 6 characters).'
                                : 'Crea tu nueva contraseña (mínimo 6 caracteres).')}
                        </p>

                        {recoveryError && (
                            <div style={{ padding: '9px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fff', fontSize: '12.5px', marginBottom: '12px' }}>
                                <i className="fa fa-exclamation-triangle" style={{ marginRight: '6px' }}></i>
                                {recoveryError}
                            </div>
                        )}

                        {recoveryInfo && (
                            <div style={{ padding: '9px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.16)', border: '1px solid rgba(16, 185, 129, 0.5)', color: '#d1fae5', fontSize: '12.5px', marginBottom: '12px' }}>
                                <i className="fa fa-check-circle" style={{ marginRight: '6px', color: '#34d399' }}></i>
                                {recoveryInfo}
                            </div>
                        )}

                        {recoveryStep === 1 && (
                            <form onSubmit={handleSendRecoveryEmail} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <input
                                    type="email"
                                    placeholder="tu@correo.com"
                                    value={recoveryEmail}
                                    onChange={(e) => setRecoveryEmail(e.target.value)}
                                    required
                                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.25)', background: '#090e1c', color: '#fff', fontSize: '14px' }}
                                />
                                <button
                                    type="submit"
                                    disabled={recoveryLoading}
                                    style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    {recoveryLoading ? 'Enviando...' : (language === 'en' ? 'Send Recovery Code' : 'Enviar Código')}
                                </button>
                            </form>
                        )}

                        {recoveryStep === 2 && (
                            <form onSubmit={handleVerifyRecoveryToken} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <input
                                    type="text"
                                    placeholder={language === 'en' ? 'Recovery code (e.g. A1B2C3...)' : 'Código de recuperación'}
                                    value={recoveryToken}
                                    onChange={(e) => setRecoveryToken(e.target.value)}
                                    required
                                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.25)', background: '#090e1c', color: '#fff', fontSize: '14px', letterSpacing: '1px' }}
                                />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setRecoveryStep(1)}
                                        disabled={recoveryLoading}
                                        style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.25)', background: 'transparent', color: '#cbd5e1', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        {language === 'en' ? 'Back' : 'Atrás'}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={recoveryLoading}
                                        style={{ flex: 2, padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        {recoveryLoading ? 'Verificando...' : (language === 'en' ? 'Verify Code' : 'Verificar Código')}
                                    </button>
                                </div>
                            </form>
                        )}

                        {recoveryStep === 3 && (
                            <form onSubmit={handleCompletePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <input
                                    type="password"
                                    placeholder={language === 'en' ? 'New password (min 6 chars)' : 'Nueva contraseña (mín. 6 caracteres)'}
                                    value={recoveryPass}
                                    onChange={(e) => setRecoveryPass(e.target.value)}
                                    required
                                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.25)', background: '#090e1c', color: '#fff', fontSize: '14px' }}
                                />
                                <input
                                    type="password"
                                    placeholder={language === 'en' ? 'Confirm new password' : 'Confirmar nueva contraseña'}
                                    value={recoveryConfirmPass}
                                    onChange={(e) => setRecoveryConfirmPass(e.target.value)}
                                    required
                                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.25)', background: '#090e1c', color: '#fff', fontSize: '14px' }}
                                />
                                <button
                                    type="submit"
                                    disabled={recoveryLoading}
                                    style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    {recoveryLoading ? 'Guardando...' : (language === 'en' ? 'Save Password' : 'Guardar Contraseña')}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
     );
}
 
export default Login;
