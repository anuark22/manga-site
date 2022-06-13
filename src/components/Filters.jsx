import React, { useState } from 'react';

const Filter = () => {    
    const display = {
        display: 'none',
    }
    const [style, setStyle] = useState(display);
    function showItem (){
        const ham = document.getElementById("FilterHam");
        ham.addEventListener('click', closeItem);
        function closeItem(){
            if (style.display === 'none'){
                setStyle({
                    ...style,
                    display:'flex',
                })
            }else{
                setStyle({
                    ...style,
                    display:'none',
                    })     
            }
        }
    }
    return (
        <div className="filter-section">
            <input type="button" value="Filters" className="filter-input" onClick={()=>{showItem()}} id="FilterHam" />
                <div className="filter-list"  style={style}>
                    <div className="filter-item">
                        <div className="filter-item-content">
                            <h3>Type</h3>
                            <div>
                                <label htmlFor="">See all</label>
                                <select name="mangaType">
                                    <option value="">--Please choose an option--</option>
                                    <option value="Manga">Manga</option>
                                    <option value="Manhwa">Manhwa</option>
                                    <option value="Manhua">Manhua</option>
                                </select>
                            </div>
                        </div>
                        <div className="filter-item-content">
                            <h3>Demography</h3>
                            <div>
                                <label htmlFor="">See all</label>
                                <select name="demography">
                                    <option value="">--Please choose an option--</option>
                                    <option value="Shounen">Shounen</option>
                                    <option value="Seinen">Seinen</option>
                                    <option value="Shoujo">Shoujo</option>
                                    <option value="Josei">Josei</option>
                                </select>
                            </div>
                        </div>
                        <div className="filter-item-content">
                            <h3>Amateur</h3>
                            <div>
                                <label htmlFor="">See all</label>
                                <select name="amateur">
                                    <option value="">--Please choose an option--</option>
                                    <option value="noAmateur">No</option>
                                    <option value="yesAmateur">Yes</option>
                                </select>
                            </div>
                        </div>
                        <div className="filter-item-content">
                            <h3>Erotic</h3>
                            <div>
                                <label htmlFor="">See all</label>
                                    <select name="erotic">
                                        <option value="">--Please choose an option--</option>
                                        <option value="noErotic">No</option>
                                        <option value="yesErotic">Yes</option>
                                    </select>
                            </div>
                        </div>
                    </div>
                </div>
        </div>     
    );
}
 
export default Filter;