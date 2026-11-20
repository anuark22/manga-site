import React from 'react';
import { useLocation } from 'react-router-dom';
import Nav from './Nav.jsx';
import LiveChatWidget from './LiveChatWidget.jsx';

const Layout = ({ children }) => {
  const location = useLocation();
  const isReader = location.pathname.includes('/chapter/') || location.pathname.startsWith('/reader/');

  return (
    <>
      {!isReader && <Nav />}
      {children}
      <LiveChatWidget />
    </>
  );
};

export default Layout;
