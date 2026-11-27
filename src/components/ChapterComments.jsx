import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { chapterCommentsApi } from '../services/api';
import { useAuth } from '../Context/AuthContext';
import { useLanguage } from '../Context/LanguageContext';
import Gravatar from './Gravatar';
import ConfirmModal from './ConfirmModal';
import '../styles/ChapterComments.scss';

function buildCommentTree(flatList) {
  const map = new Map();
  const roots = [];

  (flatList || []).forEach((item) => {
    map.set(item.commentId, { ...item, replies: [] });
  });

  map.forEach((node) => {
    if (node.parentCommentId && map.has(node.parentCommentId)) {
      map.get(node.parentCommentId).replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

const CommentForm = ({
  chapterId,
  parentCommentId = null,
  onSuccess,
  onCancel = null,
  placeholder,
  submitLabel,
  t
}) => {
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo no debe superar los 5 MB.');
      return;
    }
    setError('');
    setMediaFile(file);
    setMediaUrl('');
    setShowUrlInput(false);
    const reader = new FileReader();
    reader.onload = () => setPreviewSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (val) => {
    setMediaUrl(val);
    setMediaFile(null);
    setPreviewSrc(val.trim());
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaUrl('');
    setPreviewSrc('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile && !mediaUrl.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await chapterCommentsApi.addComment({
        chapterId,
        parentCommentId,
        content: content.trim(),
        mediaUrl: mediaUrl.trim(),
        mediaFile,
        honeypot
      });
      const created = res?.items?.[0] || null;
      setContent('');
      clearMedia();
      setShowUrlInput(false);
      if (onSuccess) onSuccess(created);
    } catch (err) {
      setError(err.message || 'No se pudo publicar el comentario.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`chapter-comment-form ${parentCommentId ? 'is-reply' : ''}`}>
      <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} aria-hidden="true">
        <input
          type="text"
          name="comment_hp"
          tabIndex="-1"
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {error && (
        <div className="cc-error-alert">
          <i className="fa fa-exclamation-triangle"></i> {error}
        </div>
      )}

      <textarea
        rows={parentCommentId ? 2 : 3}
        maxLength={2000}
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {showUrlInput && (
        <div className="cc-url-row">
          <input
            type="url"
            placeholder={t('chapterComments.pasteUrlPlaceholder')}
            value={mediaUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
          />
        </div>
      )}

      {previewSrc && (
        <div className="cc-media-preview">
          <img
            src={previewSrc}
            alt="Preview"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <button type="button" className="cc-remove-media" onClick={clearMedia} title="Quitar imagen">
            <i className="fa fa-times"></i>
          </button>
        </div>
      )}

      <div className="cc-form-toolbar">
        <div className="cc-media-buttons">
          <label className="cc-media-btn" title={t('chapterComments.uploadMedia')}>
            <i className="fa fa-picture-o"></i>
            <span>{t('chapterComments.uploadMedia')}</span>
            <input
              type="file"
              accept="image/*,.gif"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </label>
          <button
            type="button"
            className={`cc-media-btn ${showUrlInput ? 'active' : ''}`}
            onClick={() => setShowUrlInput((v) => !v)}
          >
            <i className="fa fa-link"></i>
            <span>{t('chapterComments.pasteGifUrl')}</span>
          </button>
        </div>

        <div className="cc-submit-buttons">
          {onCancel && (
            <button type="button" className="cc-btn-cancel" onClick={onCancel} disabled={submitting}>
              {t('reader.cancel')}
            </button>
          )}
          <button
            type="submit"
            className="cc-btn-submit"
            disabled={submitting || (!content.trim() && !mediaFile && !mediaUrl.trim())}
          >
            {submitting ? (
              <><i className="fa fa-spinner fa-spin"></i> {t('chapterComments.sending')}</>
            ) : (
              <><i className="fa fa-paper-plane"></i> {submitLabel}</>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

const CommentNode = ({
  node,
  depth = 0,
  chapterId,
  currentUser,
  isAuthenticated,
  onReload,
  onZoomImage,
  onRequestDelete,
  t
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);

  const isAdmin = currentUser && (currentUser.roleId === 2 || currentUser.roleName?.toUpperCase() === 'ADMIN');
  const canDelete = currentUser && !node.isDeleted && (
    currentUser.userId === node.userId ||
    currentUser.id === node.userId ||
    isAdmin
  );

  const handleDelete = () => {
    onRequestDelete?.(node.commentId);
  };

  return (
    <div className={`cc-node depth-${Math.min(depth, 5)}`}>
      <div className="cc-node-main">
        {/* Línea vertical estilo Reddit para colapsar/expandir ramas */}
        <div
          className="cc-thread-gutter"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? t('chapterComments.expandThread') : t('chapterComments.collapseThread')}
        >
          <div className="cc-avatar-wrap">
            <Gravatar email={node.email || `${node.username}@mangasite.com`} />
          </div>
          {!collapsed && node.replies?.length > 0 && <div className="cc-thread-line"></div>}
        </div>

        <div className="cc-node-body">
          <div className="cc-node-meta">
            <span className="cc-author">{node.username}</span>
            {node.roleId === 2 && <span className="cc-role-badge admin">Admin</span>}
            {node.roleId === 3 && <span className="cc-role-badge scan">Scan</span>}
            <span className="cc-date">
              {new Date(node.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
            </span>
            {collapsed && (
              <button type="button" className="cc-expand-btn" onClick={() => setCollapsed(false)}>
                [+{1 + (node.replies?.length || 0)}]
              </button>
            )}
          </div>

          {!collapsed && (
            <>
              {node.content && (
                <p className={`cc-text ${node.isDeleted ? 'deleted' : ''}`}>
                  {node.content}
                </p>
              )}

              {node.mediaUrl && !node.isDeleted && (
                <div className="cc-media-box">
                  <img
                    src={node.mediaUrl}
                    alt="Adjunto de comentario"
                    loading="lazy"
                    onClick={() => onZoomImage(node.mediaUrl)}
                  />
                </div>
              )}

              <div className="cc-node-actions">
                {isAuthenticated && !node.isDeleted && (
                  <button
                    type="button"
                    className="cc-action-link"
                    onClick={() => setReplyOpen((r) => !r)}
                  >
                    <i className="fa fa-reply"></i> {t('chapterComments.reply')}
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    className="cc-action-link delete"
                    onClick={handleDelete}
                  >
                    <i className="fa fa-trash"></i> {t('chapterComments.delete')}
                  </button>
                )}
              </div>

              {replyOpen && (
                <div className="cc-inline-reply">
                  <CommentForm
                    chapterId={chapterId}
                    parentCommentId={node.commentId}
                    placeholder={t('chapterComments.replyPlaceholder')}
                    submitLabel={t('chapterComments.reply')}
                    onCancel={() => setReplyOpen(false)}
                    onSuccess={() => {
                      setReplyOpen(false);
                      onReload();
                    }}
                    t={t}
                  />
                </div>
              )}

              {node.replies && node.replies.length > 0 && (
                <div className="cc-replies-list">
                  {node.replies.map((child) => (
                    <CommentNode
                      key={child.commentId}
                      node={child}
                      depth={depth + 1}
                      chapterId={chapterId}
                      currentUser={currentUser}
                      isAuthenticated={isAuthenticated}
                      onReload={onReload}
                      onZoomImage={onZoomImage}
                      onRequestDelete={onRequestDelete}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ChapterComments = ({ chapterId }) => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deletingComment, setDeletingComment] = useState(false);
  const [commentAlert, setCommentAlert] = useState(null);

  const loadComments = async () => {
    if (!chapterId) return;
    try {
      const items = await chapterCommentsApi.getComments(chapterId);
      setComments(items);
    } catch (err) {
      console.warn('Error cargando comentarios del capítulo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadComments();
  }, [chapterId]);

  const tree = useMemo(() => buildCommentTree(comments), [comments]);

  if (!chapterId) return null;

  return (
    <section className="chapter-comments-section" onClick={(e) => e.stopPropagation()}>
      <div className="cc-header">
        <div>
          <h3>
            <i className="fa fa-comments"></i> {t('chapterComments.title')} ({comments.length})
          </h3>
          <p>{t('chapterComments.subtitle')}</p>
        </div>
      </div>

      {isAuthenticated ? (
        <CommentForm
          chapterId={chapterId}
          placeholder={t('chapterComments.placeholder')}
          submitLabel={t('chapterComments.publish')}
          onSuccess={loadComments}
          t={t}
        />
      ) : (
        <div className="cc-guest-banner">
          <i className="fa fa-lock"></i>
          <span>{t('chapterComments.loginPrompt')}</span>
          <Link to="/login" className="cc-login-btn">{t('nav.login')}</Link>
        </div>
      )}

      {loading ? (
        <div className="cc-loading">
          <i className="fa fa-spinner fa-spin"></i>
        </div>
      ) : tree.length === 0 ? (
        <div className="cc-empty">
          <i className="fa fa-commenting-o"></i>
          <p>{t('chapterComments.empty')}</p>
        </div>
      ) : (
        <div className="cc-tree-container">
          {tree.map((rootNode) => (
            <CommentNode
              key={rootNode.commentId}
              node={rootNode}
              depth={0}
              chapterId={chapterId}
              currentUser={user}
              isAuthenticated={isAuthenticated}
              onReload={loadComments}
              onZoomImage={setLightboxUrl}
              onRequestDelete={setDeleteTargetId}
              t={t}
            />
          ))}
        </div>
      )}

      {lightboxUrl && (
        <div className="cc-lightbox" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Vista ampliada" onClick={(e) => e.stopPropagation()} />
          <button type="button" className="cc-lightbox-close" onClick={() => setLightboxUrl(null)}>
            <i className="fa fa-times"></i>
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        variant="danger"
        title={t('chapterComments.delete')}
        message={t('chapterComments.deleteConfirm')}
        confirmText={t('chapterComments.delete')}
        cancelText={t('forum.cancel')}
        loading={deletingComment}
        onCancel={() => !deletingComment && setDeleteTargetId(null)}
        onConfirm={async () => {
          if (!deleteTargetId) return;
          setDeletingComment(true);
          try {
            await chapterCommentsApi.deleteComment(deleteTargetId);
            setDeleteTargetId(null);
            loadComments();
          } catch (err) {
            setDeleteTargetId(null);
            setCommentAlert(err.message || 'No se pudo eliminar el comentario.');
          } finally {
            setDeletingComment(false);
          }
        }}
      />

      <ConfirmModal
        isOpen={Boolean(commentAlert)}
        hideCancel={true}
        variant="danger"
        icon="fa-exclamation-circle"
        title="Error"
        message={commentAlert}
        confirmText="Cerrar"
        onConfirm={() => setCommentAlert(null)}
        onCancel={() => setCommentAlert(null)}
      />
    </section>
  );
};

export default ChapterComments;
