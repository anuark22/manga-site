import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import { getToken } from '../services/api';
import { useAuth } from '../Context/AuthContext';
import { useLanguage } from '../Context/LanguageContext';
import { useTheme } from '../Context/ThemeContext';
import Gravatar from './Gravatar';
import '../styles/LiveChatWidget.scss';

const LiveChatWidget = ({ embedded = false }) => {
  const { isAuthenticated, token, user } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(embedded);
  const [messages, setMessages] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const connectionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  }, [isOpen]);

  // Ocultar en el lector de capítulos para no interferir con la lectura ni controles
  const isReaderRoute =
    location.pathname.includes('/chapter/') || location.pathname.startsWith('/reader/');

  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/chat', {
        accessTokenFactory: () => getToken() || ''
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    conn.on('ReceiveHistory', (history) => {
      if (Array.isArray(history)) {
        setMessages(history);
      }
    });

    conn.on('ReceiveMessage', (msg) => {
      setMessages((prev) => [...prev.slice(-79), msg]);
      if (!embedded && !isOpenRef.current) {
        setUnreadCount((c) => Math.min(99, c + 1));
      } else {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
      }
    });

    conn.on('OnlineCountUpdated', (count) => {
      setOnlineCount(Number(count) || 0);
    });

    conn.onreconnecting(() => setConnected(false));
    conn.onreconnected(() => setConnected(true));
    conn.onclose(() => setConnected(false));

    conn.start()
      .then(() => {
        setConnected(true);
      })
      .catch((err) => {
        console.warn('[LiveChat] SignalR connection warning:', err);
        setConnected(false);
      });

    connectionRef.current = conn;

    return () => {
      conn.stop().catch(() => {});
    };
  }, [token]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !connectionRef.current || !connected) return;
    if (!text.trim() && !mediaUrl.trim()) return;

    setSending(true);
    setErrorMsg('');
    try {
      await connectionRef.current.invoke('SendMessage', text.trim(), mediaUrl.trim() || null);
      setText('');
      setMediaUrl('');
      setShowMediaInput(false);
    } catch (err) {
      const clean = (err?.message || 'Error al enviar mensaje').replace(/^.*HubException:\s*/i, '');
      setErrorMsg(clean);
      setTimeout(() => setErrorMsg(''), 3500);
    } finally {
      setSending(false);
    }
  };

  if (!embedded && isReaderRoute) return null;

  return (
    <div className={`${embedded ? 'live-chat-embedded' : 'live-chat-widget'} theme-${theme}`}>
      {!embedded && !isOpen ? (
        <button
          type="button"
          className="live-chat-fab"
          onClick={() => setIsOpen(true)}
          title={t('chat.title')}
        >
          <span className={`live-dot ${connected ? 'online' : 'offline'}`}></span>
          <i className="fa fa-comments" aria-hidden="true"></i>
          <span className="fab-label">{t('chat.title')}</span>
          {onlineCount > 0 && <span className="online-pill">{onlineCount}</span>}
          {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
        </button>
      ) : (
        <div className="live-chat-drawer">
          <div className="chat-header">
            <div className="chat-header-left">
              <span className={`live-dot ${connected ? 'online' : 'offline'}`}></span>
              <div>
                <h4>{t('chat.title')}</h4>
                <small>
                  {connected ? `${onlineCount} ${t('chat.online')}` : t('chat.connecting')}
                </small>
              </div>
            </div>
            {!embedded && (
              <button
                type="button"
                className="chat-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar chat"
              >
                <i className="fa fa-times"></i>
              </button>
            )}
          </div>

          <div className="chat-messages-area">
            {messages.length === 0 ? (
              <div className="chat-empty-state">
                <i className="fa fa-comments-o"></i>
                <p>{t('chat.empty')}</p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="chat-msg-item">
                  <div className="chat-msg-avatar">
                    <Gravatar
                      email={m.email || `${m.username}@mangasite.com`}
                      avatarUrl={m.userId && user?.userId && m.userId === user.userId && user?.avatarUrl ? user.avatarUrl : m.avatarUrl}
                    />
                  </div>
                  <div className="chat-msg-body">
                    <div className="chat-msg-meta">
                      <span className="chat-username">{m.username}</span>
                      {m.roleId === 2 && <span className="chat-role-badge admin">Admin</span>}
                      {m.roleId === 3 && <span className="chat-role-badge scan">Scan</span>}
                      <span className="chat-time">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {m.text && <p className="chat-msg-text">{m.text}</p>}
                    {m.mediaUrl && (
                      <div className="chat-media-wrapper">
                        <img
                          src={m.mediaUrl}
                          alt="GIF / Imagen"
                          loading="lazy"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {errorMsg && (
            <div className="chat-error-toast">
              <i className="fa fa-exclamation-circle"></i> {errorMsg}
            </div>
          )}

          {isAuthenticated ? (
            <form onSubmit={handleSend} className="chat-input-form">
              {showMediaInput && (
                <div className="chat-media-url-row">
                  <input
                    type="url"
                    placeholder={t('chat.mediaUrlPlaceholder')}
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                  />
                </div>
              )}
              <div className="chat-input-row">
                <button
                  type="button"
                  className={`btn-chat-media ${showMediaInput ? 'active' : ''}`}
                  onClick={() => setShowMediaInput((v) => !v)}
                  title={t('chat.addMediaTitle')}
                >
                  <i className="fa fa-picture-o"></i>
                </button>
                <input
                  type="text"
                  maxLength={500}
                  placeholder={t('chat.placeholder')}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={!connected || sending}
                />
                <button
                  type="submit"
                  className="btn-chat-send"
                  disabled={!connected || sending || (!text.trim() && !mediaUrl.trim())}
                  title={t('chat.send')}
                >
                  <i className={`fa ${sending ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
                </button>
              </div>
            </form>
          ) : (
            <div className="chat-guest-bar">
              <span>{t('chat.loginPrompt')}</span>
              <Link to="/login" onClick={() => setIsOpen(false)} className="btn-chat-login">
                {t('chat.loginBtn')}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveChatWidget;
