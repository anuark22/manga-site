import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
            alert('Las contraseñas no coinciden.');
            return;
        }
        alert(`¡Registro completado para ${formData.username || 'nuevo usuario'}!`);
    };

    return (  
        <div className="register-section">
            <form onSubmit={handleSubmit}>
                <div className="register-container">
                    <h2 className="auth-title">Crear Cuenta</h2>
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
                    <button type="submit" className="btn-register">Register</button>
                    <p className="auth-switch">
                        ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
                    </p>
                </div>
            </form>
        </div>
    );
}
 
export default Register;
