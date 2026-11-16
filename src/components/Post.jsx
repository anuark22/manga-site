import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import Gravatar from './Gravatar';

const Post = ({ posts = [], loading = false }) => {
    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <i className="fa fa-spinner fa-spin" style={{ fontSize: '28px', marginBottom: '10px', color: 'var(--main-color)' }}></i>
                <p>Cargando discusiones del foro...</p>
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
                        <div key={id} className="post-container" style={{ cursor: 'pointer' }}>
                            <Gravatar email={email}/>
                            <div className="post-related">
                                <div className="post-tittle">
                                    {title}
                                </div>
                                <div className="post-content">
                                    <p className="user-name"><b>{userName}</b></p>
                                    <p className="post-date">{dateStr}</p>
                                    <span className="OMSComunnity" style={{ textTransform: 'capitalize' }}>
                                        {topic}
                                    </span> 
                                    {subTopic && (
                                        <span className="Groups" style={{ textTransform: 'capitalize' }}>
                                            {subTopic}
                                        </span>
                                    )}
                                </div>
                                <div className="post-content" style={{ marginTop: '6px' }}>
                                    <p>{content}</p>
                                </div>
                            </div>
                            <div className="post-stats">
                                <div className="post-stats-content" title="Comentarios">
                                    <i className="fa fa-comment-o" aria-hidden="true"></i> {comments} 
                                </div>
                                <div className="post-stats-content" title="Vistas">
                                    <i className="fa fa-eye" aria-hidden="true"></i> {views} 
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div>
                        <p className="no-mangas">No se encontraron discusiones en esta categoría</p>
                    </div>
                )
            }
        </Fragment>
     );
};
 
export default Post;
