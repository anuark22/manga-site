import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { forumApi } from '../services/api';
import { useAuth } from '../Context/AuthContext';
import Gravatar from './Gravatar';
import postData from './postData';
import '../styles/ForumPostDetail.scss';

// Formateador de tiempo amigable
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

const ForumPostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState(null);

  const commentInputRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // Carga del post y sus comentarios
  useEffect(() => {
    let isMounted = true;

    const loadPostAndComments = async () => {
      setLoading(true);
      setError(null);
      try {
        // Incrementa vistas
        forumApi.incrementViews(id).catch(() => {});

        // Obtener el post y sus comentarios en paralelo
        const [postsList, commentsList] = await Promise.all([
          forumApi.getPosts({ postId: id }).catch(() => []),
          forumApi.getComments(id).catch(() => [])
        ]);

        if (!isMounted) return;

        let foundPost = postsList && postsList.length > 0 ? postsList[0] : null;

        // Fallback a postData estático si no se encuentra en backend
        if (!foundPost) {
          foundPost = postData.find(p => String(p.id) === String(id)) || null;
        }

        if (foundPost) {
          setPost(foundPost);
          setComments(commentsList || []);
        } else {
          setError('La discusión solicitada no existe o fue eliminada.');
        }
      } catch (err) {
        console.error('Error cargando discusión del foro:', err);
        if (isMounted) {
          // Intentar fallback
          const fallback = postData.find(p => String(p.id) === String(id));
          if (fallback) {
            setPost(fallback);
            setComments([]);
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

  // Manejador para enviar un nuevo comentario
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      const res = await forumApi.addComment({
        postId: Number(id),
        content: commentText.trim()
      });

      // Crear nuevo comentario de forma optimista
      const newCommentObj = {
        commentId: res?.status === 200 ? res.newCommentId || Date.now() : Date.now(),
        postId: Number(id),
        userId: user?.userId || user?.id || 0,
        userName: user?.username || 'Tú',
        email: user?.email || '',
        content: commentText.trim(),
        createdAt: new Date().toISOString()
      };

      setComments(prev => [...prev, newCommentObj]);
      setCommentText('');
      showToast('¡Comentario publicado con éxito!');

      // Recargar comentarios del servidor para sincronizar
      try {
        const updatedComments = await forumApi.getComments(id);
        if (updatedComments && updatedComments.length > 0) {
          setComments(updatedComments);
        }
      } catch {
        // Mantiene optimista
      }
    } catch (err) {
      console.error('Error al agregar comentario:', err);
      showToast('No se pudo publicar el comentario. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // Manejador para eliminar un comentario
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este comentario?')) return;

    try {
      await forumApi.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.commentId !== commentId));
      showToast('Comentario eliminado.');
    } catch (err) {
      console.error('Error al eliminar comentario:', err);
      showToast('No tienes permisos o ocurrió un error al eliminar.');
    }
  };

  // Manejador para eliminar la discusión (autor o admin)
  const handleDeletePost = async () => {
    if (!window.confirm('¿Estás seguro de eliminar toda esta discusión del foro?')) return;

    try {
      await forumApi.deletePost(id);
      showToast('Discusión eliminada.');
      navigate('/forum');
    } catch (err) {
      console.error('Error al eliminar post:', err);
      showToast('No se pudo eliminar la discusión.');
    }
  };

  const isAuthor = user && post && (user.userId === post.userId || user.id === post.userId);
  const isAdmin = user && (user.roleId === 2 || user.roleName === 'ADMIN' || user.role === 'ADMIN');

  if (loading) {
    return (
      <div className="forum-detail-page">
        <div className="detail-container">
          <div className="detail-loading-box">
            <i className="fa fa-spinner fa-spin"></i>
            <span>Cargando discusión del foro...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="forum-detail-page">
        <div className="detail-container">
          <div className="detail-error-box">
            <i className="fa fa-exclamation-triangle"></i>
            <h3>Discusión no encontrada</h3>
            <p>{error || 'El post no está disponible.'}</p>
            <Link to="/forum" className="btn-primary">
              <i className="fa fa-arrow-left"></i> Volver al Foro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const postTitle = post.title || post.postTittle || 'Discusión';
  const postContent = post.content || post.postContent || '';
  const postAuthor = post.userName || 'Usuario';
  const postEmail = post.email || `${postAuthor}@mangasite.com`;
  const postTopic = post.topic || 'General';
  const postSubTopic = post.subTopic || 'Comunidad';
  const postViews = post.viewsCount ?? post.postViews ?? 0;
  const isPinned = post.isPinned;

  return (
    <div className="forum-detail-page">
      {/* Toast Feedback */}
      {toast && (
        <div className="forum-toast-message">
          <i className="fa fa-check-circle"></i> {toast}
        </div>
      )}

      <div className="detail-container">
        {/* Barra superior de navegación / Breadcrumbs */}
        <div className="detail-nav-row">
          <Link to="/forum" className="btn-back-forum">
            <i className="fa fa-arrow-left"></i>
            <span>Volver a Discusiones</span>
          </Link>

          <div className="topic-badges-group">
            <span className="pill-topic">
              <i className="fa fa-folder-open"></i> {postTopic}
            </span>
            {postSubTopic && (
              <span className="pill-subtopic">
                <i className="fa fa-tag"></i> {postSubTopic}
              </span>
            )}
            {isPinned && (
              <span className="pill-pinned">
                <i className="fa fa-thumb-tack"></i> Fijado
              </span>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* TARJETA PRINCIPAL DEL POST (ORIGINAL POST)                */}
        {/* ========================================================= */}
        <article className="main-post-card">
          <div className="post-header-top">
            <div className="author-block">
              <div className="author-avatar-wrap">
                <Gravatar email={postEmail} />
              </div>
              <div className="author-meta">
                <div className="author-name-row">
                  <span className="author-username">{postAuthor}</span>
                  {postAuthor === 'anuark22' && (
                    <span className="admin-badge">Admin</span>
                  )}
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
                <span>{comments.length}</span>
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
            {postContent.split('\n').map((paragraph, idx) => (
              paragraph.trim() ? <p key={idx}>{paragraph}</p> : <br key={idx} />
            ))}
          </div>

          <div className="post-footer-actions">
            <button
              type="button"
              className="btn-reply-action"
              onClick={() => {
                if (commentInputRef.current) {
                  commentInputRef.current.focus();
                }
              }}
            >
              <i className="fa fa-reply"></i>
              <span>Responder a esta discusión</span>
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
              <span>Compartir</span>
            </button>
          </div>
        </article>

        {/* ========================================================= */}
        {/* SECCIÓN DE COMENTARIOS Y RESPUESTAS                      */}
        {/* ========================================================= */}
        <section className="comments-section">
          <div className="comments-section-header">
            <h2 className="comments-title">
              <i className="fa fa-comments"></i>
              <span>Respuestas ({comments.length})</span>
            </h2>
            <span className="comments-note">
              Participa con respeto y sigue las normas de la comunidad
            </span>
          </div>

          {/* Lista de comentarios existentes */}
          {comments.length === 0 ? (
            <div className="empty-comments-card">
              <i className="fa fa-commenting-o"></i>
              <h4>No hay respuestas aún</h4>
              <p>Sé el primero en compartir tu punto de vista sobre esta discusión.</p>
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
                      <Gravatar email={commentEmail} />
                    </div>

                    <div className="comment-main">
                      <div className="comment-meta-bar">
                        <div className="user-info">
                          <span className="comment-author">{commentUser}</span>
                          {isPostOp && <span className="op-pill">Autor</span>}
                          {commentUser === 'anuark22' && <span className="admin-pill">Admin</span>}
                          <span className="comment-date">{formatTimeAgo(comment.createdAt)}</span>
                        </div>

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

                      <div className="comment-text">
                        {comment.content.split('\n').map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ======================================================= */}
          {/* FORMULARIO PARA COMENTAR                                */}
          {/* ======================================================= */}
          <div className="reply-form-wrapper">
            {isAuthenticated ? (
              <form onSubmit={handleCommentSubmit} className="reply-box-form">
                <div className="reply-form-header">
                  <div className="current-user-avatar">
                    <Gravatar email={user?.email || ''} />
                  </div>
                  <div className="current-user-label">
                    <span>Respondiendo como <strong>@{user?.username}</strong></span>
                  </div>
                </div>

                <div className="textarea-container">
                  <textarea
                    ref={commentInputRef}
                    rows={4}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Escribe tu comentario o respuesta aquí... Sé constructivo y amable."
                    required
                    maxLength={1000}
                  />
                  <div className="textarea-footer">
                    <span className="char-counter">{commentText.length}/1000 caracteres</span>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={submitting || !commentText.trim()}
                    >
                      {submitting ? (
                        <>
                          <i className="fa fa-spinner fa-spin"></i>
                          <span>Publicando...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa fa-paper-plane"></i>
                          <span>Publicar Respuesta</span>
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
                  <h4>¿Quieres unirte a la conversación?</h4>
                  <p>Inicia sesión o crea una cuenta para comentar en este post y participar en la comunidad de OurMangaSite.</p>
                </div>
                <Link to="/login" className="btn-primary">
                  <i className="fa fa-sign-in"></i> Iniciar Sesión para Comentar
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
