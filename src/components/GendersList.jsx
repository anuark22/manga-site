import React, { useState, useEffect } from 'react';
import genderListData from './genderListData';
import { filtersApi } from '../services/api';
import { useClickOutside } from '../hooks/useClickOutside';

const GendersList = ({ selectedGenres = [], onToggleGenre }) => {
    const [genres, setGenres] = useState(genderListData);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;
        filtersApi.getGenres()
            .then(data => {
                if (isMounted && data && data.length > 0) {
                    setGenres(data);
                }
            })
            .catch(err => console.warn('Usando genderListData fallback:', err));
        return () => { isMounted = false; };
    }, []);

    // Cierra la lista de géneros al hacer clic fuera
    const gendersRef = useClickOutside(() => {
        if (isOpen) setIsOpen(false);
    });

    const toggleGenders = () => {
        setIsOpen(prev => !prev);
    };

    const handleCheckboxChange = (item) => {
        if (onToggleGenre) {
            onToggleGenre({ genreId: item.genreId, genreName: item.genreName });
        }
    };

    return (  
        <div className="genders-content" ref={gendersRef}>
            <button 
                type="button" 
                className="genders-input" 
                onClick={toggleGenders} 
                id="genderHam" 
            >
                <i className="fa fa-tags" aria-hidden="true"></i>
                <span>Genres / Géneros {selectedGenres.length > 0 ? `(${selectedGenres.length})` : ''}</span>
                <i className={`fa ${isOpen ? 'fa-angle-up' : 'fa-angle-down'} filter-chevron`} aria-hidden="true"></i>
            </button>
            {
                genres.length > 0 ?
                <div className="genders-grid" style={{ display: isOpen ? 'grid' : 'none' }}>
                    {genres.map(item => {
                        const name = item.genreName;
                        const id = item.genreId || item.id || name;
                        const isChecked = selectedGenres.some(g => {
                            if (typeof g === 'object' && g !== null) {
                                return g.genreId === item.genreId || g.genreName === item.genreName;
                            }
                            return g === item.genreId || g === item.genreName;
                        });

                        return (
                            <div className="genders-item" key={id}>
                                <input 
                                    type="checkbox" 
                                    name={name} 
                                    value={name} 
                                    id={`genre-${id}`}
                                    checked={isChecked}
                                    onChange={() => handleCheckboxChange(item)}
                                />
                                <label htmlFor={`genre-${id}`}> {name} </label>
                            </div>
                        );
                    })}
                </div>
                :(
                    <div style={{ display: isOpen ? 'block' : 'none' }}>
                        <p className="no-genders">No Genders Found</p>
                    </div>
                )
            }
        </div>
    );
};
 
export default GendersList;
