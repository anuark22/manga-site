import React, { Fragment, useState } from 'react';
import '../styles/Card.scss';
import { SearchBarProvider, useSearchTerm } from '../Context/SearchBarContext';

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
                      <p >No Mangas Found</p>
                  </div>
                )
            }
          </Fragment>
    );
}

export default Card;