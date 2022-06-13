import React, { Fragment, useState, useEffect} from 'react';
import Card from './Card';
import '../styles/Library.scss';
import Filters from './Filters';
import GendersList from './GendersList';
import mangasData from './mangasData';



const Library = (props) => {    
    //State
    const [mangas, setMangas] = useState();
    useEffect(()=>{
        setMangas(mangasData);
    },[])
    return ( 
        //sacar card de form
        <div className="card-section">
            <div className="filter">
                    <Filters/>
                    <GendersList/>
                    <button type="submit" className="btn-filter">
                        Apply Filters
                        <i className="fa fa-filter" aria-hidden="true">
                    </i></button>
            </div>
            <div className="cards-container">
                <Card mangas={mangas}/>
            </div>
        </div>
     );
}
 
export default Library;