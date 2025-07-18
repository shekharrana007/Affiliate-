import { Link } from "react-router-dom";
import { FaRocket } from 'react-icons/fa';
import { BsPersonCircle } from 'react-icons/bs';
import { FiCompass } from 'react-icons/fi';
import { HiOutlineLockClosed } from 'react-icons/hi2';

function Header() {
  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary border-bottom border-body custom-navbar">
      <style>{`
        .custom-navbar {
          font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
          background: #f8fafc !important;
        }
        .navbar-brand {
          font-weight: 700;
          font-size: 1.45rem;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .navbar-brand .brand-icon {
          background: linear-gradient(135deg, #0d6efd 60%, #67c6ff 100%);
          color: #fff;
          border-radius: 50%;
          width: 2.1rem;
          height: 2.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          box-shadow: 0 2px 8px rgba(13,110,253,0.13);
        }
        .navbar-nav .nav-link {
          font-size: 1.08rem;
          font-weight: 500;
          color: #222 !important;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          border-radius: 6px;
          padding: 0.4rem 1rem;
          transition: background 0.18s, color 0.18s;
        }
        .navbar-nav .nav-link svg {
          transition: transform 0.18s, color 0.18s;
          color: #6c757d;
        }
        .navbar-nav .nav-link.active, .navbar-nav .nav-link:hover {
          background: #e3f0ff;
          color: #0d6efd !important;
        }
        .navbar-nav .nav-link.active svg, .navbar-nav .nav-link:hover svg {
          color: #0d6efd;
          transform: scale(1.18) rotate(-8deg);
        }
      `}</style>
      <div className="container">
        <Link className="navbar-brand" to="/">
          <span className="brand-icon"><FaRocket /></span>
          Affiliate++
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
            <li className="nav-item">
              <Link className="nav-link active" aria-current="page" to="/">
                <FiCompass /> Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/login">
                <HiOutlineLockClosed /> Login
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/register">
                <BsPersonCircle /> Register
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Header;