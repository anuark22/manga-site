import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import mangasTopTier from './mangasTopTier';
import '../styles/Lastest.scss';

const Lastest = () => {
    const [mangas] = useState(mangasTopTier);
    return (  
        <div className="main-header">
           <div className="main-header-bar">Popular Manga Tier</div> 
           <div className="top-tier-mangas">
            {
                    mangas.length > 0 ?
                    mangas.map(({ 
                        id, 
                        card,
                        synopsis,
                        mangaImage,
                        mangaType,
                        mangaName, 
                        mangaDemography
                    }) =>(
                    <Link to={`/manga/${id}`} key={id} className={card}>
                            <div className="synopsis">
                            <p><b>Synopsis: </b>{synopsis}</p>
                            </div>
                            <div className="card-content">
                                <img src={mangaImage} alt={mangaName}/>
                                <div className="manga-tittle">
                                    <b>{mangaName}</b>
                                </div>
                                <div className={mangaType}>
                                    {mangaType}
                                </div>
                                <div className={mangaDemography}>
                                    <b>{mangaDemography}</b>
                                </div>
                            </div>
                    </Link>
                    )):(
                    <div className="no-mangas">
                        <p>No Ranking yet</p>
                    </div>
                    )
            }
           </div>
        </div>
    );
};
export default Lastest;
