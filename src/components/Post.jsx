import React, { useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import postData from './postData';
import Gravatar from './Gravatar';

const Post = () => {
    const [posts] = useState(postData);

    return ( 
        <Fragment>
            {   
                posts.length > 0 ?
                posts.map( item =>(
                    <Link key={item.id} to="/manga-section" className="post-container">
                        <Gravatar email={item.email}/>
                        <div className="post-related">
                            <div className="post-tittle">
                                {item.postTittle}
                            </div>
                            <div className="post-content">
                                <p className="user-name"><b>{item.userName}</b></p>
                                <p className="post-date">response 1 hour ago</p>
                                <p className={item.topic}> {item.topic} </p> 
                                <p className={item.subTopic}>{item.subTopic}</p>
                            </div>
                            <div className="post-content">
                                {item.postContent}
                            </div>
                        </div>
                        <div className="post-stats">
                            <div className="post-stats-content">
                                <i className="fa fa-comment-o" aria-hidden="true"></i> {item.postComments} 
                            </div>
                            <div className="post-stats-content">
                                <i className="fa fa-eye" aria-hidden="true"></i> {item.postViews} 
                            </div>
                        </div>
                    </Link>
                )):(
                    <div>
                        <p className="no-mangas">No Posts Found</p>
                    </div>
                )
            }
        </Fragment>
     );
};
 
export default Post;
