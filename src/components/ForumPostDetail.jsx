import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { forumApi, normalizePageUrl } from '../services/api';
import { useAuth } from '../Context/AuthContext';
import { useLanguage } from '../Context/LanguageContext';
import SEO from './SEO';
import Gravatar from './Gravatar';
import postData from './postData';
import '../styles/ForumPostDetail.scss';

const COMMENTS_PAGE_SIZE = 10;

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '🔥', '😢', '🎉', '💯', '🫡', '💀', '🙏', '✨', '👀', '🤯', '👏', '🥳'];

const FORUM_STICKERS = [
  { key: 'sticker:hype', icon: '🐸', label: 'HYPE', color: '#22c55e' },
  { key: 'sticker:chad', icon: '🗿', label: 'CHAD', color: '#94a3b8' },
  { key: 'sticker:fine', icon: '🔥', label: 'THIS IS FINE', color: '#f97316' },
  { key: 'sticker:bonk', icon: '🔨', label: 'BONK', color: '#ef4444' },
  { key: 'sticker:uwu', icon: '✨', label: 'UWU', color: '#ec4899' },
  { key: 'sticker:stonks', icon: '📈', label: 'STONKS', color: '#38bdf8' },
  { key: 'sticker:sus', icon: '🧐', label: 'SUS', color: '#eab308' },
  { key: 'sticker:rip', icon: '⚰️', label: 'RIP', color: '#a855f7' }
];

const STICKER_MAP = Object.fromEntries(FORUM_STICKERS.map(s => [s.key, s]));

function formatTimeAgo(dateString) {
  if (!dateString) return 'Reciente';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Reciente';

  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Hace un momento';
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem`;
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

const SpoilerSpan = ({ text }) => {
  const [revealed, setRevealed] = useState(false);
  return (
    <span
      className={`forum-spoiler ${revealed ? 'revealed' : ''}`}
      onClick={() => setRevealed(r => !r)}
      title={revealed ? 'Ocultar spoiler' : 'Clic para revelar spoiler'}
    >
      {text}
    </span>
  );
};

function renderInlineMarkdown(line) {
  const tokens = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|\|\|[^|]+\|\|)/g);
  return tokens.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
      return <del key={idx}>{part.slice(2, -2)}</del>;
    }
    if (part.startsWith('||') && part.endsWith('||') && part.length > 4) {
      return <SpoilerSpan key={idx} text={part.slice(2, -2)} />;
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

const FormattedForumText = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="forum-formatted-text">
      {lines.map((line, i) => {
        if (line.trim().startsWith('>')) {
          return (
            <blockquote key={i} className="inline-quote-line">
              {renderInlineMarkdown(line.replace(/^\s*>\s?/, ''))}
            </blockquote>
          );
        }
        return line.trim() ? <p key={i}>{renderInlineMarkdown(line)}</p> : <br key={i} />;
      })}
    </div>
  );
};

const ForumPostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { t, language } = useLanguage();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [reactions, setReactions] = useState([]);
  const [openReactionPickerId, setOpenReactionPickerId] = useState(null); // 'post' | commentId | null

  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [showMediaUrlInput, setShowMediaUrlInput] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [showEmojiToolbar, setShowEmojiToolbar] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [honeypot, setHoneypot] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState(null);

  const commentInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadCommentsPage = async (targetPage) => {
    setCommentsLoading(true);
    try {
      const { items, totalCount } = await forumApi.getCommentsPaged(id, {
        page: targetPage,
        pageSize: COMMENTS_PAGE_SIZE
      });
      setComments(items || []);
      setTotalComments(totalCount || 0);
    } catch {
      // ignore
    } finally {
      setCommentsLoading(false);
    }
  };

  const refreshReactions = async () => {
    const rx = await forumApi.getReactions(id);
    setReactions(rx || []);
  };

  useEffect(() => {
    let isMounted = true;

    const loadPostAndComments = async () => {
      setLoading(true);
      setError(null);
      try {
        forumApi.incrementViews(id).catch(() => {});

        const [postsList, pagedComments, rxList] = await Promise.all([
          forumApi.getPosts({ postId: id }).catch(() => []),
          forumApi.getCommentsPaged(id, { page: 1, pageSize: COMMENTS_PAGE_SIZE }).catch(() => ({ items: [], totalCount: 0 })),
          forumApi.getReactions(id).catch(() => [])
        ]);

        if (!isMounted) return;

        let foundPost = postsList && postsList.length > 0 ? postsList[0] : null;
        if (!foundPost) {
          foundPost = postData.find(p => String(p.id) === String(id)) || null;
        }

        if (foundPost) {
          setPost(foundPost);
          setComments(pagedComments.items || []);
          setTotalComments(pagedComments.totalCount || (pagedComments.items || []).length);
          setCommentPage(1);
          setReactions(rxList || []);
        } else {
          setError('La discusión solicitada no existe o fue eliminada.');
        }
      } catch (err) {
        console.error('Error cargando discusión del foro:', err);
        if (isMounted) {
          const fallback = postData.find(p => String(p.id) === String(id));
          if (fallback) {
            setPost(fallback);
            setComments([]);
            setTotalComments(0);
          } else {
            setError('Error al conectar con el servidor del foro.');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPostAndComments();
    return () => { isMounted = false; };
  }, [id]);

  const handlePageChange = (newPage) => {
    const totalPages = Math.max(1, Math.ceil(totalComments / COMMENTS_PAGE_SIZE));
    if (newPage < 1 || newPage > totalPages || newPage === commentPage) return;
    setCommentPage(newPage);
    loadCommentsPage(newPage);
    document.querySelector('.comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const applyWrapFormat = (prefix, suffix = prefix, placeholder = 'texto') => {
    const el = commentInputRef.current;
    if (!el) {
      setCommentText(prev => `${prev}${prefix}${placeholder}${suffix}`);
      return;
    }
    const start = el.selectionStart ?? commentText.length;
    const end = el.selectionEnd ?? commentText.length;
    const selected = commentText.slice(start, end) || placeholder;
    const next = commentText.slice(0, start) + prefix + selected + suffix + commentText.slice(end);
    setCommentText(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  const handleInsertEmoji = (emoji) => {
    setCommentText(prev => `${prev}${emoji}`);
    setShowEmojiToolbar(false);
    commentInputRef.current?.focus();
  };

  const handleSelectImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Selecciona un archivo de imagen válido.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen no puede superar los 5 MB.');
      return;
    }
    setMediaFile(file);
    setMediaUrl('');
    setShowMediaUrlInput(false);
    setMediaPreview(URL.createObjectURL(file));
  };

  const clearSelectedMedia = () => {
    if (mediaPreview && mediaFile) URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaUrl('');
    setMediaPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleQuoteComment = (comment) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setReplyingTo(comment);
    setTimeout(() => {
      commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      commentInputRef.current?.focus();
    }, 50);
  };

  const handleToggleReaction = async (commentId, reactionKey) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setOpenReactionPickerId(null);
    try {
      await forumApi.toggleReaction({
        postId: Number(id),
        commentId,
        reactionKey
      });
      await refreshReactions();
    } catch (err) {
      showToast(err.message || 'No se pudo registrar la reacción.');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() && !mediaFile && !mediaUrl.trim()) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      await forumApi.addComment({
        postId: Number(id),
        content: commentText.trim(),
        parentCommentId: replyingTo?.commentId || null,
        mediaUrl: mediaUrl.trim(),
        mediaFile,
        honeypot
      });

      const nextTotal = totalComments + 1;
      const targetLastPage = Math.max(1, Math.ceil(nextTotal / COMMENTS_PAGE_SIZE));
      setCommentText('');
      setReplyingTo(null);
      clearSelectedMedia();
      setShowMediaUrlInput(false);
      setShowPreview(false);
      setHoneypot('');
      setCommentPage(targetLastPage);
      await loadCommentsPage(targetLastPage);
      showToast(language === 'en' ? 'Reply published!' : '¡Respuesta publicada con éxito!');
    } catch (err) {
      showToast(err.message || 'No se pudo publicar el comentario.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await forumApi.deleteComment(commentId);
      const nextTotal = Math.max(0, totalComments - 1);
      const maxPage = Math.max(1, Math.ceil(nextTotal / COMMENTS_PAGE_SIZE));
      const nextPage = Math.min(commentPage, maxPage);
      setCommentPage(nextPage);
      await loadCommentsPage(nextPage);
      showToast('Comentario eliminado');
    } catch (err) {
      showToast(err.message || 'Error al eliminar comentario');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('¿Estás seguro de eliminar esta discusión?')) return;
    try {
      await forumApi.deletePost(id);
      navigate('/forum');
    } catch (err) {
      showToast(err.message || 'Error al eliminar discusión');
    }
  };

  const renderReactionsBar = (targetCommentId = null) => {
    const pickerKey = targetCommentId === null ? 'post' : targetCommentId;
    const itemReactions = reactions.filter(r =>
      targetCommentId === null ? r.commentId == null : r.commentId === targetCommentId
    );

    return (
      <div className="reactions-bar-wrap">
        <div className="reactions-chips">
          {itemReactions.map((rx) => {
            const sticker = STICKER_MAP[rx.reactionKey];
            return (
              <button
                key={rx.reactionKey}
                type="button"
                className={`reaction-chip ${rx.userReacted ? 'reacted' : ''} ${sticker ? 'is-sticker' : ''}`}
                onClick={() => handleToggleReaction(targetCommentId, rx.reactionKey)}
                title={rx.usersPreview ? `${rx.usersPreview}` : rx.reactionKey}
                style={sticker ? { '--sticker-color': sticker.color } : undefined}
              >
                <span className="rx-icon">{sticker ? sticker.icon : rx.reactionKey}</span>
                {sticker && <span className="rx-sticker-label">{sticker.label}</span>}
                <span className="rx-count">{rx.count}</span>
              </button>
            );
          })}

          <div className="reaction-picker-anchor">
            <button
              type="button"
              className="btn-add-reaction"
              onClick={() => setOpenReactionPickerId(prev => prev === pickerKey ? null : pickerKey)}
              title={language === 'en' ? 'Add reaction' : 'Agregar reacción'}
            >
              <i className="fa fa-smile-o" aria-hidden="true"></i>
              <span>+</span>
            </button>

            {openReactionPickerId === pickerKey && (
              <div className="reaction-picker-popover" onClick={(e) => e.stopPropagation()}>
                <div className="picker-section-title">
                  {language === 'en' ? 'Emojis' : 'Emojis'}
                </div>
                <div className="picker-emoji-grid">
                  {QUICK_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      className="picker-emoji-btn"
                      onClick={() => handleToggleReaction(targetCommentId, em)}
                    >
                      {em}
                    </button>
                  ))}
                </div>

                <div className="picker-section-title" style={{ marginTop: '10px' }}>
                  {language === 'en' ? 'Stickers & Memes' : 'Stickers y Memes'}
                </div>
                <div className="picker-sticker-grid">
                  {FORUM_STICKERS.map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      className="picker-sticker-btn"
                      style={{ '--sticker-color': st.color }}
                      onClick={() => handleToggleReaction(targetCommentId, st.key)}
                    >
                      <span>{st.icon}</span>
                      <small>{st.label}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPagination = () => {
    const totalPages = Math.max(1, Math.ceil(totalComments / COMMENTS_PAGE_SIZE));
    if (totalPages <= 1) return null;

    return (
      <div className="forum-comments-pagination">
        <button
          type="button"
          className="forum-page-btn"
          disabled={commentPage <= 1 || commentsLoading}
          onClick={() => handlePageChange(commentPage - 1)}
        >
          <i className="fa fa-chevron-left"></i> {language === 'en' ? 'Prev' : 'Anterior'}
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - commentPage) <= 2)
          .map((p, idx, arr) => (
            <React.Fragment key={p}>
              {idx > 0 && arr[idx - 1] !== p - 1 && <span className="forum-page-ellipsis">...</span>}
              <button
                type="button"
                className={`forum-page-btn ${p === commentPage ? 'active' : ''}`}
                onClick={() => handlePageChange(p)}
                disabled={commentsLoading}
              >
                {p}
              </button>
            </React.Fragment>
          ))}

        <button
          type="button"
          className="forum-page-btn"
          disabled={commentPage >= totalPages || commentsLoading}
          onClick={() => handlePageChange(commentPage + 1)}
        >
          {language === 'en' ? 'Next' : 'Siguiente'} <i className="fa fa-chevron-right"></i>
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="forum-detail-wrapper">
        <div className="forum-detail-container">
          <div className="loading-state">
            <i className="fa fa-spinner fa-spin"></i>
            <p>{t('forum.loadingPost')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="forum-detail-wrapper">
        <div className="forum-detail-container">
          <div className="error-state-card">
            <i className="fa fa-exclamation-triangle"></i>
            <h2>{t('forum.postNotFound')}</h2>
            <p>{error || 'El hilo que buscas no se encuentra disponible.'}</p>
            <Link to="/forum" className="btn-primary">
              <i className="fa fa-arrow-left"></i> {t('forum.backToForum')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const postTitle = post.title || post.postName || 'Discusión de la comunidad';
  const postContent = post.content || post.postDescription || '';
  const postAuthor = post.userName || post.username || 'Usuario';
  const postEmail = post.email || `${postAuthor}@mangasite.com`;
  const postAvatar = post.avatarUrl || '';
  const postTopic = post.topic || 'OMS Community';
  const postSubTopic = post.subTopic || 'General';
  const postViews = post.viewsCount || 0;
  const isPinned = Boolean(post.isPinned);

  const isAdmin = user && (user.roleId === 2 || user.roleName?.toUpperCase() === 'ADMIN');
  const isAuthor = user && (user.userId === post.userId || user.id === post.userId);

  return (
    <div className="forum-detail-wrapper" onClick={() => openReactionPickerId && setOpenReactionPickerId(null)}>
      <SEO
        title={`${postTitle} — Foro OurMangaSite`}
        description={(postContent || '').slice(0, 155) || `Únete a la discusión "${postTitle}" en OurMangaSite.`}
        type="article"
        canonicalPath={`/forum/post/${id}`}
      />
      {toast && (
        <div className="forum-toast">
          <i className="fa fa-check-circle"></i>
          <span>{toast}</span>
        </div>
      )}

      <div className="forum-detail-container">
        <div className="top-nav-bar">
          <Link to="/forum" className="back-to-forum-btn">
            <i className="fa fa-arrow-left"></i>
            <span>{t('forum.backToForum')}</span>
          </Link>

          <div className="breadcrumb-pills">
            <span className="pill-topic">
              <i className="fa fa-folder-open"></i> {t(`forum.categories.${postTopic}`, postTopic)}
            </span>
            {postSubTopic && (
              <span className="pill-subtopic">
                <i className="fa fa-tag"></i> {t(`forum.subTopics.${postSubTopic}`, postSubTopic)}
              </span>
            )}
            {isPinned && (
              <span className="pill-pinned">
                <i className="fa fa-thumb-tack"></i> Fijado
              </span>
            )}
          </div>
        </div>

        {/* TARJETA PRINCIPAL DEL POST */}
        <article className="main-post-card">
          <div className="post-header-top">
            <div className="author-block">
              <div className="author-avatar-wrap">
                <Gravatar email={postEmail} avatarUrl={postAvatar} />
              </div>
              <div className="author-meta">
                <div className="author-name-row">
                  <span className="author-username">{postAuthor}</span>
                  {postAuthor === 'anuark22' && <span className="admin-badge">Admin</span>}
                </div>
                <div className="post-time-meta">
                  <span>Publicado {formatTimeAgo(post.createdAt)}</span>
                  {post.createdAt && (
                    <span className="full-date-label">
                      • {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="post-stats-header">
              <div className="stat-pill" title="Visualizaciones">
                <i className="fa fa-eye"></i>
                <span>{postViews}</span>
              </div>
              <div className="stat-pill" title="Comentarios">
                <i className="fa fa-comment-o"></i>
                <span>{totalComments}</span>
              </div>
              {(isAuthor || isAdmin) && (
                <button
                  type="button"
                  className="btn-delete-post"
                  onClick={handleDeletePost}
                  title="Eliminar discusión"
                >
                  <i className="fa fa-trash"></i>
                </button>
              )}
            </div>
          </div>

          <h1 className="post-main-title">{postTitle}</h1>

          <div className="post-body-content">
            <FormattedForumText text={postContent} />
          </div>

          {renderReactionsBar(null)}

          <div className="post-footer-actions">
            <button
              type="button"
              className="btn-reply-action"
              onClick={() => {
                setReplyingTo(null);
                commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                commentInputRef.current?.focus();
              }}
            >
              <i className="fa fa-reply"></i>
              <span>{language === 'en' ? 'Reply to thread' : 'Responder a esta discusión'}</span>
            </button>

            <button
              type="button"
              className="btn-share-action"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                showToast('Enlace copiado al portapapeles');
              }}
            >
              <i className="fa fa-share-alt"></i>
              <span>{language === 'en' ? 'Share' : 'Compartir'}</span>
            </button>
          </div>
        </article>

        {/* SECCIÓN DE COMENTARIOS Y RESPUESTAS */}
        <section className="comments-section">
          <div className="comments-section-header">
            <h2 className="comments-title">
              <i className="fa fa-comments"></i>
              <span>{t('forum.comments')} ({totalComments})</span>
            </h2>
            <span className="comments-note">
              {t('forum.replyNote')}
            </span>
          </div>

          {renderPagination()}

          {commentsLoading ? (
            <div className="loading-state" style={{ padding: '24px 0' }}>
              <i className="fa fa-spinner fa-spin"></i>
            </div>
          ) : comments.length === 0 ? (
            <div className="empty-comments-card">
              <i className="fa fa-commenting-o"></i>
              <h4>{t('forum.noReplies')}</h4>
              <p>{t('forum.beFirstReply')}</p>
            </div>
          ) : (
            <div className="comments-list">
              {comments.map((comment, index) => {
                const commentUser = comment.userName || 'Usuario';
                const commentEmail = comment.email || `${commentUser}@mangasite.com`;
                const canDelete = user && (user.userId === comment.userId || user.id === comment.userId || isAdmin);
                const isPostOp = commentUser === postAuthor;

                return (
                  <div key={comment.commentId || index} className="comment-item-card">
                    <div className="comment-sidebar">
                      <Gravatar email={commentEmail} avatarUrl={comment.avatarUrl} />
                    </div>

                    <div className="comment-main">
                      <div className="comment-meta-bar">
                        <div className="user-info">
                          <span className="comment-author">{commentUser}</span>
                          {isPostOp && <span className="op-pill">Autor</span>}
                          {commentUser === 'anuark22' && <span className="admin-pill">Admin</span>}
                          <span className="comment-date">{formatTimeAgo(comment.createdAt)}</span>
                        </div>

                        <div className="comment-actions-right">
                          <button
                            type="button"
                            className="btn-quote-comment"
                            onClick={() => handleQuoteComment(comment)}
                            title={language === 'en' ? 'Reply / Quote this comment' : 'Responder / Citar este comentario'}
                          >
                            <i className="fa fa-reply"></i>
                            <span>{language === 'en' ? 'Reply' : 'Responder'}</span>
                          </button>

                          {canDelete && (
                            <button
                              type="button"
                              className="btn-delete-comment"
                              onClick={() => handleDeleteComment(comment.commentId)}
                              title="Eliminar este comentario"
                            >
                              <i className="fa fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </div>

                      {comment.parentCommentId && (comment.quotedUserName || comment.quotedContent) && (
                        <div className="comment-quote-box">
                          <div className="quote-author">
                            <i className="fa fa-quote-left" aria-hidden="true"></i>
                            <strong>@{comment.quotedUserName || 'Usuario'}</strong> {language === 'en' ? 'wrote:' : 'dijo:'}
                          </div>
                          <p className="quote-excerpt">
                            {comment.quotedContent || '...'}
                          </p>
                        </div>
                      )}

                      <div className="comment-text">
                        <FormattedForumText text={comment.content} />
                      </div>

                      {comment.mediaUrl && (
                        <div className="comment-media-box">
                          <img
                            src={normalizePageUrl(comment.mediaUrl)}
                            alt="Adjunto del comentario"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {renderReactionsBar(comment.commentId)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {renderPagination()}

          {/* EDITOR INTERACTIVO DE RESPUESTA */}
          <div className="reply-form-wrapper">
            {isAuthenticated ? (
              <form onSubmit={handleCommentSubmit} className="reply-box-form">
                <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0, pointerEvents: 'none', zIndex: -1 }} aria-hidden="true">
                  <input
                    type="text"
                    name="reply_security_hp"
                    tabIndex="-1"
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <div className="reply-form-header">
                  <div className="current-user-avatar">
                    <Gravatar email={user?.email || ''} avatarUrl={user?.avatarUrl} />
                  </div>
                  <div className="current-user-label">
                    <span>{t('forum.replyingAs')} <strong>@{user?.username}</strong></span>
                  </div>
                </div>

                {replyingTo && (
                  <div className="replying-to-banner">
                    <div className="replying-info">
                      <i className="fa fa-reply"></i>
                      <span>
                        {language === 'en' ? 'Replying to' : 'Respondiendo a'}{' '}
                        <strong>@{replyingTo.userName || 'Usuario'}</strong>:{' '}
                        <em>"{(replyingTo.content || '').slice(0, 90)}{(replyingTo.content || '').length > 90 ? '...' : ''}"</em>
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-cancel-reply"
                      onClick={() => setReplyingTo(null)}
                      title="Cancelar respuesta"
                    >
                      &times;
                    </button>
                  </div>
                )}

                <div className="forum-editor-toolbar">
                  <button type="button" onClick={() => applyWrapFormat('**', '**', 'negrita')} title="Negrita">
                    <i className="fa fa-bold"></i>
                  </button>
                  <button type="button" onClick={() => applyWrapFormat('*', '*', 'cursiva')} title="Cursiva">
                    <i className="fa fa-italic"></i>
                  </button>
                  <button type="button" onClick={() => applyWrapFormat('~~', '~~', 'tachado')} title="Tachado">
                    <i className="fa fa-strikethrough"></i>
                  </button>
                  <button type="button" onClick={() => applyWrapFormat('||', '||', 'spoiler')} title="Spoiler">
                    <i className="fa fa-eye-slash"></i>
                  </button>
                  <button type="button" onClick={() => applyWrapFormat('\n> ', '', 'cita')} title="Citar texto">
                    <i className="fa fa-quote-right"></i>
                  </button>

                  <span className="toolbar-divider" />

                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className={showEmojiToolbar ? 'active' : ''}
                      onClick={() => setShowEmojiToolbar(p => !p)}
                      title="Insertar Emoji"
                    >
                      <i className="fa fa-smile-o"></i>
                    </button>
                    {showEmojiToolbar && (
                      <div className="editor-emoji-dropdown">
                        {QUICK_EMOJIS.map(em => (
                          <button key={em} type="button" onClick={() => handleInsertEmoji(em)}>
                            {em}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title={language === 'en' ? 'Upload image' : 'Subir imagen'}
                  >
                    <i className="fa fa-image"></i>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleSelectImageFile}
                  />

                  <button
                    type="button"
                    className={showMediaUrlInput ? 'active' : ''}
                    onClick={() => setShowMediaUrlInput(p => !p)}
                    title={language === 'en' ? 'Attach Image/GIF URL' : 'Pegar URL de Imagen o GIF'}
                  >
                    <i className="fa fa-link"></i>
                  </button>

                  <button
                    type="button"
                    className={`toolbar-preview-btn ${showPreview ? 'active' : ''}`}
                    onClick={() => setShowPreview(p => !p)}
                    title={language === 'en' ? 'Preview' : 'Vista previa'}
                  >
                    <i className="fa fa-eye"></i> {language === 'en' ? 'Preview' : 'Vista previa'}
                  </button>
                </div>

                {showMediaUrlInput && (
                  <div className="media-url-row">
                    <input
                      type="url"
                      placeholder="https://... (URL directa de imagen o GIF)"
                      value={mediaUrl}
                      onChange={(e) => {
                        setMediaUrl(e.target.value);
                        setMediaFile(null);
                        setMediaPreview(e.target.value);
                      }}
                    />
                    {mediaUrl && (
                      <button type="button" onClick={clearSelectedMedia}>&times;</button>
                    )}
                  </div>
                )}

                {mediaPreview && (
                  <div className="editor-media-preview">
                    <img src={mediaPreview} alt="Vista previa" />
                    <button
                      type="button"
                      className="btn-remove-preview"
                      onClick={clearSelectedMedia}
                      title="Quitar imagen"
                    >
                      &times;
                    </button>
                  </div>
                )}

                <div className="textarea-container">
                  {showPreview ? (
                    <div className="editor-preview-box">
                      {commentText.trim()
                        ? <FormattedForumText text={commentText} />
                        : <em style={{ opacity: 0.6 }}>{language === 'en' ? 'Nothing to preview yet...' : 'Nada que previsualizar aún...'}</em>}
                    </div>
                  ) : (
                    <textarea
                      ref={commentInputRef}
                      rows={4}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={t('forum.replyPlaceholder')}
                      maxLength={1000}
                    />
                  )}
                  <div className="textarea-footer">
                    <span className="char-counter">{commentText.length}/1000 {t('forum.chars')}</span>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={submitting || (!commentText.trim() && !mediaFile && !mediaUrl.trim())}
                    >
                      {submitting ? (
                        <>
                          <i className="fa fa-spinner fa-spin"></i>
                          <span>{t('forum.publishing')}</span>
                        </>
                      ) : (
                        <>
                          <i className="fa fa-paper-plane"></i>
                          <span>{t('forum.postReply')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="guest-login-prompt">
                <div className="prompt-icon">
                  <i className="fa fa-lock"></i>
                </div>
                <div className="prompt-content">
                  <h4>{t('forum.joinConversation')}</h4>
                  <p>{t('forum.loginToReply')}</p>
                </div>
                <Link to="/login" className="btn-primary">
                  <i className="fa fa-sign-in"></i>
                  <span>{t('forum.login')}</span>
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ForumPostDetail;
