import React from 'react';
import { Link } from 'react-router-dom';
import { getNoticeImage } from '../utils/imageHelper';
import '../styles/NoticeCard.scss';

const NoticeCard = ({ notice }) => {
    const title = notice?.title || notice?.noticeTittle || 'Noticia destacada';
    const content = notice?.content || notice?.noticeContent || 'Información de la comunidad y lanzamientos.';
    const image = getNoticeImage(notice);
    const noticeId = notice?.noticeId || notice?.id;
    const targetUrl = noticeId ? `/news/${noticeId}` : '/news';

    return (  
        <Link className="notice-card" to={targetUrl} title={`Leer noticia: ${title}`}>
            <img src={image} alt={title} />
            <div className="notice-container">
                <p className="notice-tittle">{title}</p>
                <p className="notice-content">{content}</p>
            </div>
        </Link>
    );
};
 
export default NoticeCard;
