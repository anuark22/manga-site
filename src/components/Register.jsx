import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import '../styles/Register.scss';

const Register = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [honeypot, setHoneypot] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);

        try {
            await register({
                username: formData.username.trim(),
                email: formData.email.trim(),
                password: formData.password,
                honeypot
            });
            alert('¡Cuenta creada exitosamente!');
            navigate('/');
        } catch (err) {
            setError(err.message || 'Error al crear la cuenta. Por favor intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (  
        <div className="register-section">
            <form onSubmit={handleSubmit}>
                <div className="register-container">
                    <h2 className="auth-title">Crear Cuenta</h2>

                    {/* Campo trampa Honeypot (invisible para humanos, rellenado por bots de spam) */}
                    <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0, pointerEvents: 'none', zIndex: -1 }} aria-hidden="true">
                        <input 
                            type="text" 
                            name="contact_verification_token" 
                            tabIndex="-1" 
                            autoComplete="off" 
                            value={honeypot} 
                            onChange={(e) => setHoneypot(e.target.value)} 
                        />
                    </div>

                    {error && (
                        <div style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid #ef4444',
                            color: '#fff',
                            fontSize: '13px',
                            boxSizing: 'border-box'
                        }}>
                            <i className="fa fa-exclamation-triangle" style={{ marginRight: '6px' }}></i>
                            {error}
                        </div>
                    )}

                    <div className="reg-inputs">
                        <input 
                            type="text" 
                            placeholder="Username" 
                            className="username-input"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                        <input 
                            type="email" 
                            placeholder="Email" 
                            className="username-input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="reg-inputs">
                        <div className="password-wrapper">
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                placeholder="Password" 
                                className="password-input"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                            <button 
                                type="button" 
                                className="toggle-password-btn"
                                onClick={() => setShowPassword(prev => !prev)}
                                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
                            </button>
                        </div>
                        <div className="password-wrapper">
                            <input 
                                type={showConfirmPassword ? 'text' : 'password'} 
                                placeholder="Confirm Password" 
                                className="password-input"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                            />
                            <button 
                                type="button" 
                                className="toggle-password-btn"
                                onClick={() => setShowConfirmPassword(prev => !prev)}
                                title={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                <i className={`fa ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn-register" disabled={loading}>
                        {loading ? 'Creando cuenta...' : 'Register'}
                    </button>
                    <p className="auth-switch">
                        ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
                    </p>
                </div>
            </form>
        </div>
    );
}
 
export default Register;
