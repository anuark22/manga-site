import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Login.scss';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        alert(`Iniciando sesión con usuario: ${formData.username || 'invitado'}`);
    };

    return ( 
        <div className="log-section">
            <form onSubmit={handleSubmit}>
                <div className="log-container">
                    <h2 className="auth-title">Iniciar Sesión</h2>
                    <div className="log-inputs">
                        <input 
                            type="text" 
                            placeholder="Username" 
                            className="username-input"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
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
                    <button type="submit" className="btn-login">Login</button>
                    <p className="auth-switch">
                        ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
                    </p>
                </div>
            </form>
        </div>
     );
}
 
export default Login;
