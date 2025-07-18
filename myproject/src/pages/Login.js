import { useState } from 'react';
import axios from 'axios';
import { serverEndpoint } from '../config/config';
import { useDispatch } from 'react-redux';
import { SET_USER } from '../redux/user/actions';
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
            newErrors.username = "Username is required";
            isValid = false;
        }
        if (formData.password.length === 0) {
            newErrors.password = "Password is required";
            isValid = false;
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
                dispatch({
                    type: SET_USER,
                    payload: response.data.userDetails
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
    };

    const handleGoogleSignin = async (authResponse) => {
        try {
            const response = await axios.post(`${serverEndpoint}/auth/google-auth`, {
                idToken: authResponse.credential
            }, {
                withCredentials: true
            });
            dispatch({
                type: SET_USER,
                payload: response.data.userDetails
            });
        }
        catch (error) {
            setErrors({ message: "Google Signin failed" });
        }
    };

    const handleGoogleSigninFailure = async (error) => {
        setErrors({ message: "Google Signin failed" });
    };

    return (
        <div className="container min-vh-100 d-flex align-items-center justify-content-center">
            <div className="row w-100 justify-content-center">
                <div className="col-12 col-sm-8 col-md-6 col-lg-4">
                    <div className="card shadow-sm p-4">
                        <h2 className="text-center mb-4">Sign in to Continue</h2>
                        {errors.message && (
                            <div className="alert alert-danger" role="alert">
                                {errors.message}
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="username" className="form-label">Username</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                />
                                {errors.username && (
                                    <div className="invalid-feedback">
                                        {errors.username}
                                    </div>
                                )}
                            </div>
                            <div className="mb-3">
                                <label htmlFor="password" className="form-label">Password</label>
                                <input
                                    type="password"
                                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                {errors.password && (
                                    <div className="invalid-feedback">
                                        {errors.password}
                                    </div>
                                )}
                            </div>
                            <div className="d-grid mb-3">
                                <button type="submit" className="btn btn-primary">Submit</button>
                            </div>
                        </form>
                        <div className="text-center my-3">
                            <div className="d-flex align-items-center">
                                <hr className="flex-grow-1" />
                                <span className="px-2 text-muted">OR</span>
                                <hr className="flex-grow-1" />
                            </div>
                        </div>
                        <div className="d-grid">
                            <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
                                <GoogleLogin onSuccess={handleGoogleSignin} onError={handleGoogleSigninFailure} />
                            </GoogleOAuthProvider>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;





