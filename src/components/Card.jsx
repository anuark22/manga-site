import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Card.scss';
import { useSearchTerm } from '../Context/SearchBarContext';

const Card = ( {mangas} ) => {
  const { searchTerm } = useSearchTerm(); 
  const mangasLength = mangas?.length;    
    return (
          <Fragment>
            {
              mangasLength > 0 ?                
                mangas.filter((e)=>{
                  return e.mangaName.toLowerCase().includes(searchTerm.toLowerCase());
                }).map(({ 
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
                      <p >No Mangas Found</p>
                  </div>
                )
            }
          </Fragment>
    );
};

export default Card;
