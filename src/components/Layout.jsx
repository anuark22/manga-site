import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Nav from './Nav.jsx';
import LiveChatWidget from './LiveChatWidget.jsx';
import PwaInstallBanner from './PwaInstallBanner.jsx';

const Layout = ({ children }) => {
  const location = useLocation();
  const isReader = location.pathname.includes('/chapter/') || location.pathname.startsWith('/reader/');
  const isHome = location.pathname === '/';
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 960px)').matches : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 960px)');
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <>
      {!isReader && <Nav />}
      {children}
      {(!isHome || isMobile) && <LiveChatWidget />}
      <PwaInstallBanner />
    </>
  );
};

export default Layout;
