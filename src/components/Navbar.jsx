import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/COURSE_CORRECT-removebg-preview.png';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} onClick={closeMobileMenu}>
        <img src={logo} alt="Course Correct" style={{ height: '46px', width: 'auto', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))' }} />
        <span style={{ fontSize: '1.45rem', letterSpacing: '-0.03em' }}>Course Correct</span>
      </Link>

      {/* Hamburger Button */}
      <button 
        className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className={`links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
        <Link to="/marketplace" onClick={closeMobileMenu}>Marketplace</Link>
        {user && <Link to="/upload" onClick={closeMobileMenu}>Upload</Link>}
        {user && <Link to="/dashboard" onClick={closeMobileMenu}>Dashboard</Link>}
        {user?.role === 'admin' && <Link to="/admin" onClick={closeMobileMenu}>Admin</Link>}
        {user ? (
          <button className="btn-small" onClick={handleLogout}>Logout</button>
        ) : (
          <>
            <Link to="/login" className="btn-small" onClick={closeMobileMenu}>Login</Link>
            <Link to="/signup" className="btn-small btn-secondary" onClick={closeMobileMenu}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;