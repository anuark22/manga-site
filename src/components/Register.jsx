import React from 'react';
import'../styles/Register.scss';

const Register = () => {
    return (  
        <div className="register-section">
            <form action="">
                <div className="register-container">
                    <div className="reg-inputs">
                        <input type="text" placeholder="Username" className="username-input"/>
                        <input type="text" placeholder="Email" className="username-input"/>
                    </div>
                    <div className="reg-inputs">
                        <input type="password" placeholder="Password" className="password-input"/>
                        <input type="password" placeholder="Confirm Password" className="password-input"/>
                    </div>
                    <button type="submit" className="btn-register">Register</button>
                </div>
            </form>
        </div>
    );
}
 
export default Register;