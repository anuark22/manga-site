import React, { useState } from 'react';
import Post from './Post';
import SideBar from './SideBar';
import '../styles/Forum.scss';

const Forum = () => {
    const display = {
        display: 'none',
    }
    const [style, setStyle] = useState(display);
    function showItem (){
        const ham = document.getElementById("postHam");
        ham.addEventListener('click', closeItem);
        function closeItem(){
            if (style.display === 'none'){
                setStyle({
                    ...style,
                    display:'flex',
                })
            }else{
                setStyle({
                    ...style,
                    display:'none',
                    })     
            }
        }
    }
    return ( 
        <div className="forum-section">
            <div className="forum-content">
                <SideBar className="sidebar-comp" />
                <div className="forum-post">
                    <div className="post-card">
                        <div className="post-btns">
                            <div className="discussion-btn">
                                <div className="forum-post-select">
                                    <button type="submit" onClick={()=>{showItem()}} id="postHam" > 
                                        <i className="fa fa-filter" aria-hidden="true"></i>
                                        <p>Lastest</p>
                                        <i className="fa fa-angle-down" aria-hidden="true"></i>
                                    </button>
                                    <ul className="forum-post-ul" style={style}>
                                        <li>Lastest</li>
                                        <li>Above</li>
                                        <li>Newer</li>
                                        <li>Older</li>
                                        <li>Popular</li>
                                        <li>Unpopular</li>
                                    </ul>
                                </div>
                                <button type="submit" className="refresh-btn"> 
                                    <i className="fa fa-refresh" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                        <div className="all-post-container">
                            <Post />                  
                        </div>
                    </div>
                </div>
            </div>
        </div>
     );
}
 
export default Forum;