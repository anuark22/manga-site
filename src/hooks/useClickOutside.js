import { useEffect, useRef } from 'react';

/**
 * Hook para detectar clics fuera de un elemento y ejecutar una acción (ej. cerrar menú).
 * @param {Function} handler Función a ejecutar al hacer clic fuera
 * @returns {React.RefObject} Ref que debe asignarse al contenedor del menú
 */
export function useClickOutside(handler) {
  const domNodeRef = useRef(null);

  useEffect(() => {
    const maybeHandler = (event) => {
      if (domNodeRef.current && !domNodeRef.current.contains(event.target)) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', maybeHandler);
    document.addEventListener('touchstart', maybeHandler);

    return () => {
      document.removeEventListener('mousedown', maybeHandler);
      document.removeEventListener('touchstart', maybeHandler);
    };
  }, [handler]);

  return domNodeRef;
}

export default useClickOutside;
