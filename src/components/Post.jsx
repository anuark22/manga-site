import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import Gravatar from './Gravatar';
import { useLanguage } from '../Context/LanguageContext';

const Post = ({ posts = [], loading = false }) => {
    const { t } = useLanguage();
    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <i className="fa fa-spinner fa-spin" style={{ fontSize: '28px', marginBottom: '10px', color: 'var(--main-color)' }}></i>
                <p>{t('forum.loadingPosts')}</p>
            </div>
        );
    }

    const safePosts = Array.isArray(posts) ? posts : [];

    return ( 
        <Fragment>
            {   
                safePosts.length > 0 ?
                safePosts.map(item => {
                    const id = item.postId || item.id;
                    const title = item.title || item.postTittle;
                    const content = item.content || item.postContent;
                    const comments = item.postCommentsCount ?? item.postComments ?? 0;
                    const views = item.viewsCount ?? item.postViews ?? 0;
                    const topic = item.topic || 'General';
                    const subTopic = item.subTopic || 'Discusión';
                    const userName = item.userName || 'Usuario';
                    const email = item.email || `${userName}@mangasite.com`;
                    const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Reciente';

                    return (
                        <Link to={`/forum/post/${id}`} key={id} className="post-container" title="Ver discusión completa">
                            <Gravatar email={email}/>
                            <div className="post-related">
                                <div className="post-tittle">
                                    {title}
                                </div>
                                <div className="post-content">
                                    <p className="user-name"><b>{userName}</b></p>
                                    <p className="post-date">{dateStr}</p>
                                    <span className="OMSComunnity" style={{ textTransform: 'capitalize' }}>
                                        {t(`forum.categories.${topic}`, topic)}
                                    </span> 
                                    {subTopic && (
                                        <span className="Groups" style={{ textTransform: 'capitalize' }}>
                                            {t(`forum.subTopics.${subTopic}`, subTopic)}
                                        </span>
                                    )}
                                </div>
                                <div className="post-content" style={{ marginTop: '6px' }}>
                                    <p>{content}</p>
                                </div>
                            </div>
                            <div className="post-stats">
                                <div className="post-stats-content" title={t('forum.comments')}>
                                    <i className="fa fa-comment-o" aria-hidden="true"></i> {comments} 
                                </div>
                                <div className="post-stats-content" title={t('forum.views')}>
                                    <i className="fa fa-eye" aria-hidden="true"></i> {views} 
                                </div>
                            </div>
                        </Link>
                    );
                }) : (
                    <div>
                        <p className="no-mangas">{t('forum.emptyPosts')}</p>
                    </div>
                )
            }
        </Fragment>
     );
};
 
export default Post;
