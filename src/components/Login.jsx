import React from 'react';
import '../styles/Login.scss';

const Login = () => {
    return ( 
        <div className="log-section">
            <form action="">
                <div className="log-container">
                    <div className="log-inputs">
                        <input type="text" placeholder="Username" className="username-input"/>
                    </div>
                    <div className="log-inputs">
                        <input type="password" placeholder="Password" className="password-input"/>
                    </div>
                    <button type="submit" className="btn-login">Login</button>
                </div>
            </form>
        </div>
     );
}
 
export default Login;