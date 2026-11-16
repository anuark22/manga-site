import React, { useState } from 'react';
import genderListData from './genderListData';
import { useClickOutside } from '../hooks/useClickOutside';

const GendersList = () => {
    const [isOpen, setIsOpen] = useState(false);

    // Cierra la lista de géneros al hacer clic fuera
    const gendersRef = useClickOutside(() => {
        if (isOpen) setIsOpen(false);
    });

    const toggleGenders = () => {
        setIsOpen(prev => !prev);
    };

    return (  
        <div className="genders-content" ref={gendersRef}>
            <input 
                type="button" 
                value="Genres / Géneros" 
                className="genders-input" 
                onClick={toggleGenders} 
                id="genderHam" 
            />
            {
                genderListData.length > 0 ?
                <div className="genders-grid" style={{ display: isOpen ? 'grid' : 'none' }}>
                    {genderListData.map( item => (
                        <div className="genders-item" key={item.id}>
                            <input type="checkbox" name={item.genderName} value={item.genderName} id={item.genderName}/>
                            <label htmlFor={item.genderName}> {item.genderName} </label>
                        </div>
                    ))}
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
