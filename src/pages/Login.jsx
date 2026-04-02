import { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '', password: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email: formData.email, password: formData.password });

      login(res.data.token, res.data.user);

      // Redirect based on role
      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page form-container">
      <h2>Login</h2>
      {error && <p style={{ color: 'red', margin: 0, fontSize: '0.9rem' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Please wait...' : 'Login'}
        </button>
      </form>

      <p style={{ textAlign: 'center', margin: 0, marginTop: '1rem' }}>
        Don't have an account? <a href="/signup" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Sign Up</a>
      </p>
    </div>
  );
};

export default Login;
