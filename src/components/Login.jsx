import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import '../styles/Login.scss';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login({ email: formData.email.trim(), password: formData.password });
            navigate('/');
        } catch (err) {
            setError(err.message || 'Error al iniciar sesión. Verifica tu email y contraseña.');
        } finally {
            setLoading(false);
        }
    };

    return ( 
        <div className="log-section">
            <form onSubmit={handleSubmit}>
                <div className="log-container">
                    <h2 className="auth-title">Iniciar Sesión</h2>
                    
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

                    <div className="log-inputs">
                        <input 
                            type="text" 
                            placeholder="Email (ej. testuser@mangasite.com)" 
                            className="username-input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    </div>
                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? 'Iniciando...' : 'Login'}
                    </button>
                    <p className="auth-switch">
                        ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
                    </p>
                </div>
            </form>
        </div>
     );
}
 
export default Login;
