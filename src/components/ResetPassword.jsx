import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api';
import { useLanguage } from '../Context/LanguageContext';
import SEO from './SEO';
import '../styles/Login.scss';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const initialEmail = searchParams.get('email') || '';
  const initialToken = searchParams.get('token') || '';

  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [validating, setValidating] = useState(Boolean(initialEmail && initialToken));
  const [tokenValid, setTokenValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!initialEmail || !initialToken) {
      setValidating(false);
      return;
    }

    let cancelled = false;
    authApi
      .validateRecoveryToken({ email: initialEmail, token: initialToken })
      .then(() => {
        if (!cancelled) {
          setTokenValid(true);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setTokenValid(false);
          setError(
            err.message ||
              (language === 'en'
                ? 'The recovery link is invalid or has expired.'
                : 'El enlace de recuperación es inválido o ha expirado.')
          );
        }
      })
      .finally(() => {
        if (!cancelled) setValidating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialEmail, initialToken, language]);

  const handleValidateManual = async (e) => {
    e.preventDefault();
    setError('');
    setValidating(true);
    try {
      await authApi.validateRecoveryToken({ email: email.trim(), token: token.trim() });
      setTokenValid(true);
    } catch (err) {
      setError(
        err.message ||
          (language === 'en' ? 'Invalid or expired recovery code.' : 'Código de recuperación inválido o expirado.')
      );
    } finally {
      setValidating(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError(
        language === 'en'
          ? 'Password must be at least 6 characters.'
          : 'La contraseña debe tener al menos 6 caracteres.'
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(language === 'en' ? 'Passwords do not match.' : 'Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.resetPassword({
        email: email.trim(),
        token: token.trim(),
        newPassword,
        confirmPassword
      });
      setSuccess(
        language === 'en'
          ? 'Password updated successfully! Redirecting to login...'
          : '¡Contraseña restablecida con éxito! Redirigiendo al login...'
      );
      setTimeout(() => {
        navigate('/login', { state: { email: email.trim(), passwordResetSuccess: true } });
      }, 1500);
    } catch (err) {
      setError(
        err.message ||
          (language === 'en' ? 'Could not reset password.' : 'No se pudo restablecer la contraseña.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="log-section">
      <SEO title={language === 'en' ? 'Reset Password' : 'Restablecer Contraseña'} noindex={true} canonicalPath="/reset-password" />
      <form onSubmit={tokenValid ? handleResetSubmit : handleValidateManual}>
        <div className="log-container">
          <h2 className="auth-title">
            {language === 'en' ? 'Reset Password' : 'Restablecer Contraseña'}
          </h2>

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

          {success && (
            <div style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid #10b981',
              color: '#fff',
              fontSize: '13px',
              boxSizing: 'border-box'
            }}>
              <i className="fa fa-check-circle" style={{ marginRight: '6px', color: '#34d399' }}></i>
              {success}
            </div>
          )}

          {validating ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#cbd5e1' }}>
              <i className="fa fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
              <p style={{ margin: 0 }}>{language === 'en' ? 'Verifying recovery link...' : 'Verificando enlace de recuperación...'}</p>
            </div>
          ) : !tokenValid ? (
            <>
              <div className="log-inputs">
                <input
                  type="email"
                  placeholder="Email"
                  className="email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Recovery code' : 'Código de recuperación'}
                  className="email-input"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-login" disabled={validating}>
                {language === 'en' ? 'Verify Code' : 'Verificar Código'}
              </button>
            </>
          ) : (
            <>
              <div className="log-inputs">
                <div className="password-wrapper">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder={language === 'en' ? 'New password (min 6 chars)' : 'Nueva contraseña (mín. 6 caracteres)'}
                    className="password-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPass((p) => !p)}
                  >
                    <i className={`fa ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
                  </button>
                </div>
                <div className="password-wrapper">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder={language === 'en' ? 'Confirm new password' : 'Confirmar nueva contraseña'}
                    className="password-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn-login" disabled={submitting}>
                {submitting
                  ? (language === 'en' ? 'Updating...' : 'Actualizando...')
                  : (language === 'en' ? 'Save New Password' : 'Guardar Contraseña')}
              </button>
            </>
          )}

          <p className="auth-switch">
            <Link to="/login">{language === 'en' ? 'Back to Login' : 'Volver al Login'}</Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
