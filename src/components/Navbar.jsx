import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/COURSE_CORRECT-removebg-preview.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <img src={logo} alt="Course Correct" style={{ height: '30px', width: 'auto' }} />
        Course Correct
      </Link>
      <div className="links">
        <Link to="/marketplace">Marketplace</Link>
        {user && <Link to="/upload">Upload</Link>}
        {user && <Link to="/dashboard">Dashboard</Link>}
        {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
        {user ? (
          <button className="btn-small" onClick={handleLogout}>Logout</button>
        ) : (
          <>
            <Link to="/login" className="btn-small">Login</Link>
            <Link to="/signup" className="btn-small btn-secondary">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;