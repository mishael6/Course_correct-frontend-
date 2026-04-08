import React, { useState } from 'react';
import api from '../api';

const UploadPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    courseCode: '',
    institution: '',
    year: '',
    price: ''
  });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFile = (e) => setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage({ type: 'error', text: 'Please select a PDF file' });
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append('document', file);

    try {
      // Don't set Content-Type header - let axios handle it automatically with FormData
      const res = await api.post('/uploads', data);
      setMessage({ type: 'success', text: res.data.message });
      setFormData({ title: '', courseCode: '', institution: '', year: '', price: '' });
      setFile(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message;
      if (err.response?.status === 401) {
        setMessage({ type: 'error', text: 'Your session has expired. Please log in again.' });
      } else if (err.response?.status === 400) {
        setMessage({ type: 'error', text: errorMsg || 'Invalid file or form data' });
      } else {
        setMessage({ type: 'error', text: errorMsg || 'Error uploading file. Please try again.' });
      }
    }
  };

  return (
    <div className="page form-container" style={{ maxWidth: '500px' }}>
      <style>{`
        /* Mobile: < 640px */
        @media (max-width: 639px) {
          .upload-row { flex-direction: column !important; gap: 0.75rem !important; }
          .upload-row input { flex: 1 !important; }
        }
      `}</style>

      <h2>Upload Document</h2>
      {message && <p style={{ color: message.type === 'error' ? 'red' : 'green', margin: 0, fontWeight: 'bold' }}>{message.text}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input type="text" name="title" placeholder="Document Title (e.g.,SOFTWARE ENGINEERING Final Exam 2023)" value={formData.title} onChange={handleChange} required />
        <input type="text" name="courseCode" placeholder="Course Code (e.g., CS101)" value={formData.courseCode} onChange={handleChange} required />
        <input type="text" name="institution" placeholder="Institution" value={formData.institution} onChange={handleChange} required />

        <div className="upload-row" style={{ display: 'flex', gap: '1rem' }}>
          <input type="number" name="year" placeholder="Level" value={formData.year} onChange={handleChange} required style={{ flex: 1 }} />
          <input type="number" name="price" placeholder="Price (GHS)" value={formData.price} onChange={handleChange} required style={{ flex: 1 }} />
        </div>

        <input type="file" onChange={handleFile} required style={{ border: 'none', padding: '0.75rem 0' }} />
        <button type="submit" className="btn">Submit for Admin Approval</button>
      </form>
    </div>
  );
};

export default UploadPage;
