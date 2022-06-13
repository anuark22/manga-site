import React, { useState } from 'react';
import genderListData from './genderListData';

const GendersList = () => {
    const display = {
        display: 'none',
    }
    const [style, setStyle] = useState(display);
    function showItem (){
        const ham = document.getElementById("genderHam");
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
        <div className="genders-content">
            <input type="button" value="Genders" className="genders-input" onClick={()=>{showItem()}} id="genderHam" />
            {
                genderListData.length > 0 ?
                genderListData.map( genderListData =>(
                        <div className="genders-list" style={style} key={genderListData.id} >
                            <div className="genders-list-content">
                                <input type="checkbox" name={genderListData.genderName} value={genderListData.genderName} id={genderListData.genderName}/>
                                <label htmlFor={genderListData.genderName} > {genderListData.genderName} </label>
                            </div>
                        </div>
                )):(
                    <div>
                        <p className="no-genders">No Genders Found</p>
                    </div>
                )
            }
        </div>
    );
}
 
export default GendersList;