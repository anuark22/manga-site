import React,{ useState, useEffect} from 'react';
import mangasTopTier from './mangasTopTier';
import '../styles/Lastest.scss';

const Lastest = () => {
    const [mangas, setMangas] = useState(mangasTopTier);
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
                    <a href="/" key={id} className={card}>
                            <div className="synopsis">
                            <p><b>Synopsis: </b>{synopsis}</p>
                            </div>
                            <div className="card-content">
                                <img src={mangaImage} alt="manga"/>
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
                    </a>
                    )):(
                    <div className="no-mangas">
                        <p>No Ranking yet</p>
                    </div>
                    )
            }
           </div>
        </div>
    );
}
export default Lastest;