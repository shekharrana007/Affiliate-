import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { serverEndpoint } from './config';
import { useDispatch } from 'react-redux';
import{SET_USER} from './redux/user/actions';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

function Login() {
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [errors, setErrors] = useState({});

    const handleChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const validate = () => {
        let newErrors = {};
        let isValid = true;
        if (formData.username.length === 0) {
            isValid = false;
            newErrors.username = "Username is required";
        }
        if (formData.password.length === 0) {
            isValid = false;
            newErrors.password = "Password is required";
        }
        setErrors(newErrors);
        return isValid;
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (validate()) {
            const body = {
                username: formData.username,
                password: formData.password
            };
            const configuration = {
                withCredentials: true
            };
            try {
                const response = await axios.post(`${serverEndpoint}/auth/login`, body, configuration);
                // Redirect after successful login
                dispatch({
                    type: SET_USER,
                    payload:response.data.userDetails
                });
               
            }
            catch (error) {
                if (error?.response?.status === 401) {
                    setErrors({ message: "Invalid credentials" });
                } else {
                    setErrors({ message: "Login failed. Please try again later." });
                }
            }
        }
    }
    const handleGoogleSignin = async (authResponse) => {
        try {
            const response = await axios.post(`${serverEndpoint}/auth/google-auth`, {
                idToken: authResponse.credential
            }, {
                withCredentials: true // to send cookies with the request
            });
            dispatch({
                    type: SET_USER,
                    payload:response.data.userDetails
                });
            
        }
        catch (error) {
            console.log(error);
            setErrors({ message: "Google Signin failed" });
        }
    };
    const handleGoogleSigninFailure = async (error) => {
        console.log(error);
        setErrors({ message: "Google Signin failed" });
    };
    return (
        <div className="container text-center">
            <h1>Login Page</h1>
            <p>Please enter your credentials to log in.</p>
            
            {errors.message && (errors.message)}
            <form onSubmit={handleSubmit}>

                <div>
                    <label>Username </label>
                    <input type="text" name="username" placeholder="Enter your username" value={formData.username} onChange={handleChange} />
                    {errors.username && (errors.username)}
                </div>
                <div>
                    <label>Password </label>
                    <input type="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} />
                    {errors.password && (errors.password)}
                </div>
                <button type='submit' >Login</button>
            </form>
            <h2>OR</h2>
            <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
                <GoogleLogin onSuccess={handleGoogleSignin} onError={handleGoogleSigninFailure} />
            </GoogleOAuthProvider>
        </div>
    );

};
export default Login;





