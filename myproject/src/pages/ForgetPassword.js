import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { serverEndpoint } from '../config/config';

function ForgetPassword() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

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
        if (formData.email.length === 0) {
            newErrors.email = "Email is required";
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email is invalid";
            isValid = false;
        }
        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (validate()) {
            setLoading(true);
            try {
                const response = await axios.post(`${serverEndpoint}/auth/send-reset-password-token`, {
                    email: formData.email
                });
                
                // Navigate to reset password page with email
                navigate('/reset-password', { 
                    state: { email: formData.email } 
                });
            } catch (error) {
                if (error?.response?.status === 404) {
                    setErrors({ message: "No user found with this email address" });
                } else {
                    setErrors({ message: "Failed to send reset code. Please try again later." });
                }
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="container min-vh-100 d-flex align-items-center justify-content-center">
            <div className="row w-100 justify-content-center">
                <div className="col-12 col-sm-8 col-md-6 col-lg-4">
                    <div className="card shadow-sm p-4">
                        <h2 className="text-center mb-4">Forgot Password</h2>
                        <p className="text-center text-muted mb-4">
                            Enter your email address and we'll send you a 6-digit code to reset your password.
                        </p>
                        
                        {errors.message && (
                            <div className="alert alert-danger" role="alert">
                                {errors.message}
                            </div>
                        )}
                        
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                />
                                {errors.email && (
                                    <div className="invalid-feedback">
                                        {errors.email}
                                    </div>
                                )}
                            </div>
                            
                            <div className="d-grid mb-3">
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Send Reset Code'}
                                </button>
                            </div>
                        </form>
                        
                        <div className="text-center">
                            <a href="/login" className="text-decoration-none">
                                ← Back to Login
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgetPassword; 