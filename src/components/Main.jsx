import React from 'react';
import Lastest from './Lastest';
import '../styles/Main.scss';
import NoticeCard from './NoticeCard';

const Main = () => {
    return (
        <div className="main-container">
            <div className="main-content">
                <Lastest/>
            </div>
            <div className="main-sidebar">
                <div className="notices-bar">Notices</div>
                <NoticeCard/>
                <NoticeCard/>
                <NoticeCard/>
                <NoticeCard/>
                <NoticeCard/>
                <NoticeCard/>
                <NoticeCard/>
                <NoticeCard/>
                <NoticeCard/>
                <NoticeCard/>
            </div>
        </div>
    );
}

export default Main;
