import React from 'react';
import notice1 from '../styles/img/notice1.webp';
import '../styles/NoticeCard.scss';

const NoticeCard = () => {
    return (  
        <a className="notice-card" href='/'>
            <img src={notice1} alt="noticia sobre anime" />
            <div className="notice-container">
                <p className="notice-tittle">One Piece has enter in heatus period</p>
                <p className="notice-content">Lorem ipsum, dolor sit amet consectetur adipisicing elit. Facere blanditiis adipisci harum, sequi velit quos voluptates consequatur? Possimus tempora rerum nesciunt libero iste consequuntur vel rem vero facere. Tempore, iure!</p>
            </div>
        </a>
    );
}
 
export default NoticeCard;