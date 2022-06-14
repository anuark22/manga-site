import React, {useState, Fragment } from 'react';
import postData from './postData';
import Gravatar from './Gravatar';
const Post = () => {

    const [post, setPost] = useState(postData);

    return ( 
        <Fragment>
            {   
                post.length > 0 ?
                post.map( post =>(
                    <a key={post.id}  href="/manga-section" className="post-container">
                        <Gravatar email={post.email}/>
                        <div className="post-related">
                            <div className="post-tittle">
                                {post.postTittle}
                            </div>
                            <div className="post-content">
                                <p className="user-name"><b>{post.userName}</b></p><p className="post-date">response 1 hour ago</p><p className={post.topic} > {post.topic} </p> <p className={post.subTopic} >{post.subTopic}</p>
                            </div>
                            <div className="post-content">
                                {post.postContent}
                            </div>
                        </div>
                        <div className="post-stats">
                            <div className="post-stats-content">
                                <i className="fa fa-comment-o" aria-hidden="true"></i> {post.postComments} 
                            </div>
                            <div className="post-stats-content">
                                <i className="fa fa-eye" aria-hidden="true"></i> {post.postViews} 
                            </div>
                        </div>
                    </a>
                )):(
                  <div>
                      <p className="no-mangas">No Posts Found</p>
                  </div>
                )
            }
        </Fragment>
     );
}
 
export default Post;