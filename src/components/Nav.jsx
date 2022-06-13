import React, {useState} from 'react';
import '../styles/Nav.scss';
import { Link } from 'react-router-dom';
import { useSearchTerm } from '../Context/SearchBarContext';


const Nav = () => {
    const { searchTerm, setSearchTerm } = useSearchTerm();       
    const display = {
        display: 'none',
    }
    const [style, setStyle] = useState(display);

    function showItem (){
        const ham = document.getElementById("ham");
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
        <div>
            <nav className="main-navbar">
                <div className="page-tittle">
                    <Link to="/" >
                        <p>Our<b>Manga</b>Site</p>
                    </Link>
                </div>
                <div className="nav-buttons">
                    <Link to="/manga-section"><b>LIBRARY</b></Link>
                    <Link to="/"><b>YOUR LIST</b></Link>
                    <Link to="/forum"><b>FORUM</b></Link>
                </div>
                <div className="search">
                    <input type="text" name="search" placeholder="Search ..." onChange={e => {setSearchTerm(e.target.value)}}/>
                    <Link to="manga-section" >
                        <i className="fa fa-search" aria-hidden="true"></i>
                    </Link>
                </div>
                <div className="nav-log-section">
                    <Link to="/login" >LOGIN</Link>
                    <Link to="/register" >REGISTER</Link>
                </div>
            </nav>
            <nav className="toggle-navbar "> 
                <div className="page-tittle">
                        <Link to="/">
                            <p>Our<b>Manga</b>Site</p>
                        </Link>
                        <i className="fa fa-bars" aria-hidden="true" onClick={()=>{showItem()}} id="ham"></i>                   
                        <ul style={style}>
                            <li><Link to="/manga-section"><b>LIBRARY</b></Link></li>
                            <li><Link to="/"><b>YOUR LIST</b></Link></li>
                            <li><Link to="/forum"><b>FORUM</b></Link></li>
                            <li><Link to="/login" >LOGIN</Link></li>
                            <li><Link to="/register" >REGISTER</Link></li>
                            <div className="search">
                                <input type="text" name="search" placeholder="Search ..."  onChange={e => {setSearchTerm(e.target.value)}}/>
                                <Link to="manga-section" >
                                    <i className="fa fa-search" aria-hidden="true"></i>
                                </Link>
                            </div>
                        </ul>
                </div>
            </nav> 
        </div>
     );
}
export default Nav;