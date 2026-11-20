import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../Context/LanguageContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const GoogleSignInButton = ({ onCredential, disabled = false }) => {
  const buttonContainerRef = useRef(null);
  const { language } = useLanguage();
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;
    const initGoogle = () => {
      if (cancelled || !window.google?.accounts?.id || !buttonContainerRef.current) return false;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response?.credential) {
              onCredential?.(response.credential);
            }
          }
        });
        buttonContainerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonContainerRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: 300,
          locale: language === 'en' ? 'en' : 'es'
        });
        setSdkReady(true);
        return true;
      } catch {
        return false;
      }
    };

    if (!initGoogle()) {
      const interval = setInterval(() => {
        if (initGoogle()) clearInterval(interval);
      }, 300);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [language, onCredential]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: '10px',
          border: '1px dashed rgba(148, 163, 184, 0.35)',
          background: 'rgba(15, 23, 42, 0.55)',
          color: '#cbd5e1',
          fontSize: '12.5px',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxSizing: 'border-box'
        }}
        title="Configura VITE_GOOGLE_CLIENT_ID en el archivo .env"
      >
        <i className="fa fa-google" aria-hidden="true" style={{ color: '#ea4335' }}></i>
        <span>
          {language === 'en'
            ? 'Google Sign-In ready (add VITE_GOOGLE_CLIENT_ID in .env)'
            : 'Acceso con Gmail listo (agrega VITE_GOOGLE_CLIENT_ID en .env)'}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        minHeight: '44px'
      }}
    >
      <div ref={buttonContainerRef} />
      {!sdkReady && (
        <span style={{ fontSize: '12.5px', color: '#94a3b8', alignSelf: 'center' }}>
          {language === 'en' ? 'Loading Google Sign-In...' : 'Cargando Google Sign-In...'}
        </span>
      )}
    </div>
  );
};

export default GoogleSignInButton;
