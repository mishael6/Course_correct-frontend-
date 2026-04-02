
import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import MoMoModal from '../components/MoMoModal';

// ─── Sub-components ───────────────────────────────────────────────────────────
const StarRating = ({ rating = 0 }) => (
  <span style={{ color: '#6B7280', fontSize: '0.75rem', letterSpacing: '-0.05em' }}>
    {[1,2,3,4,5].map(i => (
      <span key={i} style={{ opacity: i <= Math.round(rating) ? 1 : 0.2 }}>★</span>
    ))}
  </span>
);

const DocCard = ({ upload, onBuy, onSubscribe, hasSubscription, buying, isAdmin }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#F3F4F6' : '#FFFFFF',
        border: `1px solid ${hovered ? '#D1D5DB' : '#E5E7EB'}`,
        borderRadius: '14px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        transition: 'all 0.2s',
        cursor: 'default',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{
          background: '#E5E7EB', borderRadius: '10px',
          width: '44px', height: '44px', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0
        }}>📄</div>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '1.2rem', fontWeight: 700,
          color: '#1F2937', lineHeight: 1
        }}>
          GHS {upload.price?.toFixed(2)}
        </div>
      </div>

      {/* Title & meta */}
      <div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#111827', lineHeight: 1.3, marginBottom: '0.4rem' }}>
          {upload.title}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#6B7280', lineHeight: 1.6 }}>
          {upload.courseCode} · {upload.institution} · {upload.year}
        </div>
      </div>

      {/* Rating + downloads */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <StarRating rating={upload.averageRating} />
        <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontFamily: "'DM Mono', monospace" }}>
          ↓ {upload.downloadCount || 0}
        </span>
      </div>

      {/* Uploader */}
      <div style={{ fontSize: '0.78rem', color: '#9CA3AF', borderTop: '1px solid #E5E7EB', paddingTop: '0.75rem' }}>
        By <span style={{ color: '#6B7280' }}>{upload.uploader?.name || 'Anonymous'}</span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {isAdmin ? (
          <button
            onClick={() => onBuy(upload._id, 'download')}
            disabled={buying === upload._id}
            style={{
              padding: '0.7rem', borderRadius: '9px', border: 'none',
              background: '#7C3AED', color: '#fff',
              fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '0.85rem',
              cursor: buying === upload._id ? 'not-allowed' : 'pointer',
              opacity: buying === upload._id ? 0.6 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            {buying === upload._id ? 'Opening...' : '↓ Download (Admin)'}
          </button>
        ) : hasSubscription ? (
          <button
            onClick={() => onBuy(upload._id, 'download')}
            disabled={buying === upload._id}
            style={{
              padding: '0.7rem', borderRadius: '9px', border: 'none',
              background: '#059669', color: '#FFFFFF',
              fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '0.85rem',
              cursor: buying === upload._id ? 'not-allowed' : 'pointer',
              opacity: buying === upload._id ? 0.6 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            {buying === upload._id ? 'Opening...' : '↓ Download (Subscribed)'}
          </button>
        ) : (
          <>
            <button
              onClick={() => onBuy(upload._id, 'buy')}
              disabled={buying === upload._id}
              style={{
                padding: '0.7rem', borderRadius: '9px', border: 'none',
                background: '#059669', color: '#FFFFFF',
                fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '0.85rem',
                cursor: buying === upload._id ? 'not-allowed' : 'pointer',
                opacity: buying === upload._id ? 0.6 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              {buying === upload._id ? 'Processing...' : `Buy — GHS ${upload.price?.toFixed(2)}`}
            </button>
            <button
              onClick={onSubscribe}
              style={{
                padding: '0.6rem', borderRadius: '9px',
                border: '1px solid #D1D5DB', background: 'transparent',
                color: '#6B7280', fontFamily: "'Outfit', sans-serif",
                fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                transition: 'border-color 0.2s, color 0.2s'
              }}
              onMouseEnter={e => { e.target.style.borderColor = '#9CA3AF'; e.target.style.color = '#1F2937'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#D1D5DB'; e.target.style.color = '#6B7280'; }}
            >
              ✦ Subscribe GHS 15/mo — Unlimited Access
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main Marketplace ─────────────────────────────────────────────────────────
const Marketplace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [toast, setToast] = useState(null);

  // MoMo Modal
  const [momoOpen, setMomoOpen] = useState(false);
  const [momoMode, setMomoMode] = useState(null);
  const [momoUploadId, setMomoUploadId] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [institution, setInstitution] = useState('');
  const [year, setYear] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUploads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (courseCode) params.append('courseCode', courseCode);
      if (institution) params.append('institution', institution);
      if (year) params.append('year', year);

      const res = await api.get(`/uploads?${params.toString()}`);
      let data = res.data;

      // Client-side sort
      if (sortBy === 'price-asc') data = [...data].sort((a, b) => a.price - b.price);
      else if (sortBy === 'price-desc') data = [...data].sort((a, b) => b.price - a.price);
      else if (sortBy === 'popular') data = [...data].sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
      else data = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setUploads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, courseCode, institution, year, sortBy]);

  const fetchSubscription = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/subscription');
      setHasSubscription(res.data.hasSubscription);
    } catch {}
  }, [user]);

  useEffect(() => { fetchUploads(); }, [fetchUploads]);
  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  // ── Buy / Download ──────────────────────────────────────────────────────────
  const handleBuy = async (uploadId, mode) => {
    if (!user) return navigate('/login');
    
    if (mode === 'download') {
      setBuying(uploadId);
      try {
        const res = await api.get(`/uploads/${uploadId}/download`);
        window.open(res.data.fileUrl, '_blank');
        showToast('Download started!');
      } catch (err) {
        const msg = err.response?.data?.message || 'Something went wrong';
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          showToast(msg, 'error');
        }
      } finally {
        setBuying(null);
      }
    } else {
      // mode === 'buy' — open payment modal
      const upload = uploads.find(u => u._id === uploadId);
      setMomoMode('per-paper');
      setMomoUploadId(uploadId);
      setMomoOpen(true);
    }
  };

  // ── Subscribe ───────────────────────────────────────────────────────────────
  const handleSubscribe = async () => {
    if (!user) return navigate('/login');
    setMomoMode('subscription');
    setMomoUploadId(null);
    setMomoOpen(true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUploads();
  };

  const clearFilters = () => {
    setSearch(''); setCourseCode('');
    setInstitution(''); setYear('');
  };

  const hasFilters = search || courseCode || institution || year;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Outfit:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .mp-root {
          background: #1F2937;
          min-height: 100vh;
          color: #111827;
          font-family: 'Outfit', sans-serif;
          padding: 2.5rem 1.5rem 5rem;
        }
        .mp-inner { max-width: 1100px; margin: 0 auto; }

        .filter-bar {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 0.75rem;
          margin-bottom: 1rem;
          align-items: end;
        }
        .search-row {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }
        .filter-row {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .mp-input {
          background: #F9FAFB;
          border: 1px solid #D1D5DB;
          border-radius: 10px;
          padding: 0.7rem 1rem;
          color: #111827;
          font-family: 'Outfit', sans-serif;
          font-size: 0.88rem;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
        }
        .mp-input:focus { border-color: #6B7280; }
        .mp-input::placeholder { color: #9CA3AF; }

        .mp-select {
          background: #F9FAFB;
          border: 1px solid #D1D5DB;
          border-radius: 10px;
          padding: 0.7rem 1rem;
          color: #6B7280;
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          outline: none;
          cursor: pointer;
          appearance: none;
          min-width: 140px;
        }
        .mp-select:focus { border-color: #6B7280; }

        .mp-search-btn {
          padding: 0.7rem 1.5rem;
          background: #59A310308;
          color: #59A31090B;
          border: none;
          border-radius: 10px;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.2s;
          flex-shrink: 0;
        }
        .mp-search-btn:hover { opacity: 0.88; }

        .docs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.25rem;
        }

        @media (max-width: 1200px) {
          .docs-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
        }

        @media (max-width: 768px) {
          .mp-root { padding: 1rem; }
          .mp-content-wrapper { gap: 1rem; }
          .filter-bar { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
          .docs-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
          .mp-doc-card { padding: 1rem; }
          .mp-doc-title { font-size: 1.1rem; }
          .mp-doc-desc { font-size: 0.85rem; }
        }

        @media (max-width: 600px) {
          .mp-root { padding: 0.75rem; }
          .filter-bar { grid-template-columns: 1fr; }
          .docs-grid { grid-template-columns: 1fr; }
          .mp-doc-card { padding: 0.75rem; }
          .mp-doc-title { font-size: 1rem; }
          .mp-doc-desc { font-size: 0.8rem; }
          .mp-search-btn { padding: 0.5rem 1rem; font-size: 0.85rem; }
        }
      `}</style>

      <div className="mp-root">

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 999,
            padding: '0.85rem 1.5rem', borderRadius: '10px', fontWeight: 600,
            fontSize: '0.88rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            background: toast.type === 'error' ? '#FEE2E2' : '#DCFCE7',
            color: toast.type === 'error' ? '#7F1D1D' : '#14532D',
            border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`,
          }}>
            {toast.msg}
          </div>
        )}

        <div className="mp-inner">

          {/* Header */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: '#6B7280', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              {uploads.length} document{uploads.length !== 1 ? 's' : ''} available
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Marketplace
            </h1>
          </div>

          {/* Subscription banner — show if no sub */}
          {user && !hasSubscription && (
            <div style={{
              background: 'linear-gradient(135deg, #F0F0EC, #E5E7EB)',
              border: '1px solid #59A310200',
              borderRadius: '12px',
              padding: '1.1rem 1.5rem',
              marginBottom: '1.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#59A310308', fontSize: '0.92rem' }}>✦ Unlock everything for GHS 15/month</div>
                <div style={{ color: '#59A310F12', fontSize: '0.8rem', marginTop: '2px' }}>Download any document, unlimited times.</div>
              </div>
              <button
                onClick={handleSubscribe}
                style={{
                  padding: '0.6rem 1.25rem', background: '#59A310308', color: '#59A31090B',
                  border: 'none', borderRadius: '8px', fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                Subscribe Now
              </button>
            </div>
          )}

          {/* Search & Filters */}
          <form onSubmit={handleSearch} style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                className="mp-input"
                style={{ flex: '1', minWidth: '200px' }}
                type="text"
                placeholder="Search by title..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <input
                className="mp-input"
                style={{ width: '140px' }}
                type="text"
                placeholder="Course code"
                value={courseCode}
                onChange={e => setCourseCode(e.target.value)}
              />
              <input
                className="mp-input"
                style={{ width: '140px' }}
                type="text"
                placeholder="Institution"
                value={institution}
                onChange={e => setInstitution(e.target.value)}
              />
              <input
                className="mp-input"
                style={{ width: '100px' }}
                type="number"
                placeholder="Year"
                value={year}
                onChange={e => setYear(e.target.value)}
              />
              <select
                className="mp-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Downloaded</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button type="submit" className="mp-search-btn">Search</button>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  style={{
                    background: 'none', border: 'none', color: '#59A31025B',
                    fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit',
                    padding: '0.4rem 0'
                  }}
                >
                  Clear filters ✕
                </button>
              )}
            </div>
          </form>

          {/* Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: '#59A310F46' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>⏳</div>
              Loading documents...
            </div>
          ) : uploads.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '5rem 2rem',
              border: '1px dashed #59A31072A', borderRadius: '14px', color: '#59A310F46'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</div>
              <div style={{ fontWeight: 700, color: '#59A31025B', marginBottom: '0.4rem' }}>No documents found</div>
              <div style={{ fontSize: '0.85rem' }}>
                {hasFilters ? 'Try adjusting your filters.' : 'No approved documents yet. Check back soon.'}
              </div>
              {hasFilters && (
                <button onClick={clearFilters} style={{
                  marginTop: '1rem', background: 'none', border: '1px solid #59A31072A',
                  color: '#59A31017A', borderRadius: '8px', padding: '0.5rem 1.25rem',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem'
                }}>Clear filters</button>
              )}
            </div>
          ) : (
            <div className="docs-grid">
              {uploads.map(upload => (
                <DocCard
                  key={upload._id}
                  upload={upload}
                  onBuy={handleBuy}
                  onSubscribe={handleSubscribe}
                  hasSubscription={hasSubscription}
                  buying={buying}
                  isAdmin={user?.role === 'admin'}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <MoMoModal
        isOpen={momoOpen}
        onClose={() => setMomoOpen(false)}
        onSuccess={() => { fetchSubscription(); showToast(momoMode === 'subscription' ? 'Subscription activated!' : 'Payment completed!'); }}
        title={momoMode === 'subscription' ? 'Monthly Subscription' : 'Buy Document'}
        amount={momoMode === 'subscription' ? 15 : uploads.find(u => u._id === momoUploadId)?.price}
        mode={momoMode}
        uploadId={momoUploadId}
      />
    </>
  );
};

export default Marketplace;