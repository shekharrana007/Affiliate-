import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { serverEndpoint } from '../config/config';

function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const userDetails = useSelector((state) => state.userDetails);
    
    // Get email from location state (if coming from forget password) or from Redux (if logged in)
    const emailFromState = location.state?.email;
    const emailFromRedux = userDetails?.email;
    const email = emailFromState || emailFromRedux;
    
    const [formData, setFormData] = useState({
        email: email || '',
        code: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showEmailField, setShowEmailField] = useState(!emailFromRedux);

    useEffect(() => {
        // If no email is available, redirect to forget password
        if (!email) {
            navigate('/forget-password');
        }
    }, [email, navigate]);

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
        
        if (showEmailField) {
            if (formData.email.length === 0) {
                newErrors.email = "Email is required";
                isValid = false;
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = "Email is invalid";
                isValid = false;
            }
        }
        
        if (formData.code.length === 0) {
            newErrors.code = "Reset code is required";
            isValid = false;
        } else if (formData.code.length !== 6) {
            newErrors.code = "Reset code must be 6 digits";
            isValid = false;
        }
        
        if (formData.newPassword.length === 0) {
            newErrors.newPassword = "New password is required";
            isValid = false;
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = "Password must be at least 6 characters";
            isValid = false;
        }
        
        if (formData.confirmPassword.length === 0) {
            newErrors.confirmPassword = "Please confirm your password";
            isValid = false;
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
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
                const response = await axios.post(`${serverEndpoint}/auth/reset-password`, {
                    email: formData.email,
                    code: formData.code,
                    newPassword: formData.newPassword
                });
                
                // Show success message and redirect
                alert('Password reset successfully!');
                if (userDetails) {
                    // If user is logged in, redirect to dashboard
                    navigate('/dashboard');
                } else {
                    // If user is not logged in, redirect to login
                    navigate('/login');
                }
            } catch (error) {
                if (error?.response?.status === 404) {
                    setErrors({ message: "User not found" });
                } else if (error?.response?.status === 400) {
                    setErrors({ message: error.response.data.message });
                } else {
                    setErrors({ message: "Failed to reset password. Please try again later." });
                }
            } finally {
                setLoading(false);
            }
        }
    };

    if (!email) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="container min-vh-100 d-flex align-items-center justify-content-center">
            <div className="row w-100 justify-content-center">
                <div className="col-12 col-sm-8 col-md-6 col-lg-4">
                    <div className="card shadow-sm p-4">
                        <h2 className="text-center mb-4">Reset Password</h2>
                        <p className="text-center text-muted mb-4">
                            Enter the 6-digit code sent to your email and your new password.
                        </p>
                        
                        {errors.message && (
                            <div className="alert alert-danger" role="alert">
                                {errors.message}
                            </div>
                        )}
                        
                        <form onSubmit={handleSubmit}>
                            {showEmailField && (
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
                            )}
                            
                            <div className="mb-3">
                                <label htmlFor="code" className="form-label">Reset Code</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.code ? 'is-invalid' : ''}`}
                                    id="code"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    placeholder="Enter 6-digit code"
                                    maxLength="6"
                                />
                                {errors.code && (
                                    <div className="invalid-feedback">
                                        {errors.code}
                                    </div>
                                )}
                            </div>
                            
                            <div className="mb-3">
                                <label htmlFor="newPassword" className="form-label">New Password</label>
                                <input
                                    type="password"
                                    className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                                    id="newPassword"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    placeholder="Enter new password"
                                />
                                {errors.newPassword && (
                                    <div className="invalid-feedback">
                                        {errors.newPassword}
                                    </div>
                                )}
                            </div>
                            
                            <div className="mb-3">
                                <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                                <input
                                    type="password"
                                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm new password"
                                />
                                {errors.confirmPassword && (
                                    <div className="invalid-feedback">
                                        {errors.confirmPassword}
                                    </div>
                                )}
                            </div>
                            
                            <div className="d-grid mb-3">
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPassword; 