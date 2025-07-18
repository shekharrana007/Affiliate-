import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import Can from "../rbac/Can";
import axios from "axios";
import { serverEndpoint } from "../config/config";
import { FaUserCircle, FaSignOutAlt, FaKey, FaUsers, FaMoneyCheckAlt, FaTachometerAlt } from 'react-icons/fa';

function UserHeader() {
    const userDetails = useSelector((state) => state.userDetails);
    const navigate = useNavigate();

    const handleResetPassword = async () => {
        try {
            await axios.post(`${serverEndpoint}/auth/send-reset-password-token`, {
                email: userDetails.email
            });
            
            // Navigate to reset password page with email from Redux
            navigate('/reset-password');
        } catch (error) {
            console.error('Failed to send reset code:', error);
            alert('Failed to send reset code. Please try again.');
        }
    };

    // Custom styles for UserHeader
    const customStyles = `
    .navbar {
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
    }
    .navbar-brand span {
        font-weight: 600;
        letter-spacing: 1px;
        font-size: 1.2rem;
    }
    .dropdown-menu {
        border-radius: 12px !important;
        box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important;
        border: none;
        padding: 0.5rem 0;
    }
    .dropdown-item {
        font-size: 1rem;
        padding: 0.6rem 1.2rem;
        transition: background 0.2s, color 0.2s;
        border-radius: 6px;
        margin: 0 0.3rem;
    }
    .dropdown-item:hover, .dropdown-item:focus {
        background: #f0f4fa;
        color: #0d6efd;
    }
    .dropdown-divider {
        margin: 0.3rem 0;
    }
    .dropdown-item.text-danger {
        color: #dc3545 !important;
    }
    .dropdown-item.text-danger:hover {
        background: #ffeaea;
        color: #b02a37 !important;
    }
    .nav-link.dropdown-toggle {
        font-weight: 500;
        font-size: 1.05rem;
    }
    `;

    return (
        <>
            <style>{customStyles}</style>
            <nav className="navbar navbar-expand-lg bg-dark border-bottom border-body" data-bs-theme="dark">
                <div className="container">
                    <Link className="navbar-brand text-light d-flex align-items-center gap-2" to="/">
                        <FaTachometerAlt style={{ fontSize: '1.5rem' }} />
                        <span>Dashboard</span>
                    </Link>
                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarSupportedContent"
                        aria-controls="navbarSupportedContent"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon" />
                    </button>
                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                            <li className="nav-item dropdown">
                                <button
                                    className="nav-link dropdown-toggle btn btn-link text-light d-flex align-items-center gap-2"
                                    type="button"
                                    id="userDropdown"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                    style={{ textDecoration: "none" }}
                                >
                                    <FaUserCircle style={{ fontSize: '1.3rem', marginRight: '0.5rem' }} />
                                    {userDetails && userDetails.name ? userDetails.name : "Account"}
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end shadow" aria-labelledby="userDropdown" style={{ minWidth: '200px', borderRadius: '10px', padding: '0.5rem 0' }}>
                                    <li><Link className="dropdown-item d-flex align-items-center gap-2" to="/manage-payment"><FaMoneyCheckAlt /> Payments</Link> </li>

                                    <Can
                                        permission='canViewUser'>
                                        <li>
                                            <Link className="dropdown-item d-flex align-items-center gap-2" to="/users">
                                                <FaUsers />
                                                Manage Users
                                            </Link>
                                        </li>
                                    </Can>
                                    <li>
                                        <hr className="dropdown-divider" />
                                    </li>
                                    <li>
                                        <button 
                                            className="dropdown-item d-flex align-items-center gap-2" 
                                            onClick={handleResetPassword}
                                            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                                        >
                                            <FaKey />
                                            Reset Password
                                        </button>
                                    </li>
                                    <li>
                                        <Link className="dropdown-item d-flex align-items-center gap-2 text-danger" to="/logout">
                                            <FaSignOutAlt />
                                            Logout
                                        </Link>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </>
    );
}

export default UserHeader;