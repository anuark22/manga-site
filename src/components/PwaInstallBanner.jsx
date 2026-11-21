import React, { useState, useEffect } from 'react';
import { useLanguage } from '../Context/LanguageContext';

const PwaInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('oms_pwa_dismissed') === '1');
  const { language } = useLanguage();

  useEffect(() => {
    // Si ya se ejecuta como app instalada (standalone), no mostrar
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      return;
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstallClick = async () => {
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } catch {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('oms_pwa_dismissed', '1');
    setDismissed(true);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '18px',
        left: '18px',
        zIndex: 9990,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        borderRadius: '14px',
        background: 'rgba(14, 21, 40, 0.96)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(8px)',
        color: '#f1f5f9',
        maxWidth: 'calc(100vw - 36px)'
      }}
    >
      <img
        src="/android-chrome-192x192.png"
        alt="OurMangaSite"
        style={{ width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0 }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12.5px' }}>
        <strong style={{ color: '#ffffff' }}>
          {language === 'en' ? 'Install OurMangaSite App' : 'Instalar App de OurMangaSite'}
        </strong>
        <span style={{ color: '#94a3b8', fontSize: '11.5px' }}>
          {language === 'en' ? 'Quick access without browser bars' : 'Acceso rápido en ventana propia'}
        </span>
      </div>
      <button
        type="button"
        onClick={handleInstallClick}
        style={{
          padding: '7px 13px',
          borderRadius: '8px',
          border: 'none',
          background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}
      >
        <i className="fa fa-download" aria-hidden="true" style={{ marginRight: '5px' }}></i>
        {language === 'en' ? 'Install' : 'Instalar'}
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Cerrar"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#94a3b8',
          fontSize: '16px',
          cursor: 'pointer',
          padding: '2px 4px',
          lineHeight: 1
        }}
      >
        &times;
      </button>
    </div>
  );
};

export default PwaInstallBanner;
