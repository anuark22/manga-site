/**
 * Servicio de Google reCAPTCHA v3 Invisible
 * 
 * Permite ejecutar la verificación de comportamiento de usuario en segundo plano
 * sin interferir con la navegación ni obligar al usuario a resolver desafíos visuales.
 */

// Clave pública de reCAPTCHA v3 (se puede configurar en .env como VITE_RECAPTCHA_SITE_KEY)
const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

let scriptLoaded = false;
let loadPromise = null;

/**
 * Carga de forma asíncrona y segura el script de Google reCAPTCHA v3 en el documento
 */
export const loadRecaptchaScript = () => {
  if (!SITE_KEY) {
    return Promise.resolve(null);
  }

  if (scriptLoaded && window.grecaptcha) {
    return Promise.resolve(window.grecaptcha);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve) => {
    // Si el script ya existe en el DOM
    const existing = document.querySelector('script[src*="recaptcha/api.js"]');
    if (existing) {
      if (window.grecaptcha && window.grecaptcha.ready) {
        window.grecaptcha.ready(() => {
          scriptLoaded = true;
          resolve(window.grecaptcha);
        });
      } else {
        existing.addEventListener('load', () => {
          window.grecaptcha.ready(() => {
            scriptLoaded = true;
            resolve(window.grecaptcha);
          });
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.grecaptcha && window.grecaptcha.ready) {
        window.grecaptcha.ready(() => {
          scriptLoaded = true;
          resolve(window.grecaptcha);
        });
      } else {
        resolve(null);
      }
    };

    script.onerror = () => {
      console.warn('[reCAPTCHA v3] No se pudo cargar el script de Google.');
      resolve(null);
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};

/**
 * Ejecuta Google reCAPTCHA v3 de forma invisible y retorna el token para la acción indicada (ej: 'login', 'register').
 * Si no hay SITE_KEY configurada, retorna cadena vacía de forma segura sin romper la aplicación.
 */
export const executeRecaptcha = async (action = 'submit') => {
  if (!SITE_KEY) {
    return '';
  }

  try {
    const grecaptcha = await loadRecaptchaScript();
    if (!grecaptcha || typeof grecaptcha.execute !== 'function') {
      return '';
    }

    return await grecaptcha.execute(SITE_KEY, { action });
  } catch (err) {
    console.warn('[reCAPTCHA v3] Error al generar token:', err);
    return '';
  }
};
