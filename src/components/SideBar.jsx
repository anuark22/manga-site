import React,{ useState } from 'react';
import '../styles/SideBar.scss';

const SideBar = () => {
    const display = {
        display: 'none',
    }
    const [style, setStyle] = useState(display);
    function showItem (){
        const ham = document.getElementById("hamSidebar");
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
        <div className="forum-sidebar">
            <div className="sidebar-main-group">
                <div className="topic-head" onClick={()=>{showItem()}} id="hamSidebar">
                    <i className="fa fa-square oms-color" aria-hidden="true"></i>
                    <p >OMS Community</p>
                </div>
                <div className="option-group" style={style}>
                    <ul>
                        <li>Release</li>
                        <li>General</li>
                        <li>Suggestions</li>
                        <li>Video game</li>
                        <li>Off-topic</li>
                        <li>Help</li>
                    </ul>
                </div>            
            </div>
            <div className="sidebar-main-group">
                <div className="topic-head">
                    <i className="fa fa-square library-color" aria-hidden="true"></i>
                    <div>Library</div>
                </div>
                <div className="option-group" style={style}>
                    <ul>
                        <li>Release</li>
                        <li>General</li>
                        <li>Suggestions</li>
                        <li>Video game</li>
                        <li>Off-topic</li>
                        <li>Help</li>
                    </ul>
                </div>  
            </div>
            <div className="sidebar-main-group">
                <div className="topic-head">
                    <i className="fa fa-square  video-library-color" aria-hidden="true"></i>
                    <div>Video</div>
                </div>
                <div className="option-group" style={style}>
                    <ul>
                        <li>Release</li>
                        <li>General</li>
                        <li>Suggestions</li>
                        <li>Video game</li>
                        <li>Off-topic</li>
                        <li>Help</li>
                    </ul>
                </div>  
            </div>
            <div className="sidebar-main-group ">
                <div className="topic-head">
                    <i className="fa fa-square groups-color" aria-hidden="true"></i>
                    <div>Groups</div>
                </div>
                <div className="option-group" style={style}>
                    <ul>
                        <li>Release</li>
                        <li>General</li>
                        <li>Suggestions</li>
                        <li>Video game</li>
                        <li>Off-topic</li>
                        <li>Help</li>
                    </ul>
                </div>  
            </div>
        </div>
    );
}
 
export default SideBar;