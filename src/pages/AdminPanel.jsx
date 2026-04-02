import { useState, useEffect, useCallback } from 'react';
import api from '../api';

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const colors = {
    pending:  { bg: '#59A3103C7', color: '#59A31000E' },
    approved: { bg: '#59A310AE5', color: '#59A310F46' },
    rejected: { bg: '#59A3102E2', color: '#59A310B1B' },
  };
  const s = colors[status] || colors.pending;
  return (
    <span style={{
      padding: '2px 10px', borderRadius: '999px', fontSize: '0.75rem',
      fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
      background: s.bg, color: s.color
    }}>
      {status}
    </span>
  );
};

const StatCard = ({ label, value, accent }) => (
  <div style={{
    background: '#FFFFFF', border: '1px solid #59A3107EB', borderRadius: '12px',
    padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
  }}>
    <span style={{ fontSize: '0.8rem', color: '#59A310280', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
    <span style={{ fontSize: '2.2rem', fontWeight: 800, color: accent || '#59A310827' }}>{value}</span>
  </div>
);

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = ['Pending Uploads', 'Pending Withdrawals'];

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [uploads, setUploads] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [uploadsRes, withdrawalsRes] = await Promise.all([
        api.get('/admin/uploads/pending'),
        api.get('/admin/withdrawals/pending'),
      ]);
      setUploads(uploadsRes.data);
      setWithdrawals(withdrawalsRes.data);
    } catch (err) {
      showToast('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Upload actions ──────────────────────────────────────────────────────────
  const handleUploadStatus = async (id, status) => {
    setActionLoading(id + status);
    try {
      await api.put(`/admin/uploads/${id}/status`, { status });
      setUploads(prev => prev.filter(u => u._id !== id));
      showToast(`Upload ${status} successfully`);
    } catch {
      showToast('Action failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Withdrawal actions ──────────────────────────────────────────────────────
  const handleApproveWithdrawal = async (id) => {
    setActionLoading(id);
    try {
      await api.put(`/admin/withdrawals/${id}/approve`);
      setWithdrawals(prev => prev.filter(w => w._id !== id));
      showToast('Withdrawal approved');
    } catch {
      showToast('Action failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#59A310AFB', padding: '2rem 1.5rem' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 999,
          padding: '0.85rem 1.5rem', borderRadius: '10px', fontWeight: 600,
          fontSize: '0.9rem', boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          background: toast.type === 'error' ? '#59A3102E2' : '#59A310AE5',
          color: toast.type === 'error' ? '#59A310B1B' : '#59A310F46',
          transition: 'all 0.3s ease'
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#59A310827', margin: 0 }}>
            Admin Panel
          </h1>
          <p style={{ color: '#59A310280', margin: '0.3rem 0 0', fontSize: '0.95rem' }}>
            Review uploads and manage withdrawals
          </p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard label="Pending Uploads" value={uploads.length} accent="var(--primary, #59A3106F1)" />
          <StatCard label="Pending Withdrawals" value={withdrawals.length} accent="#59A310E0B" />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #59A3107EB' }}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '0.65rem 1.25rem', border: 'none', background: 'none',
                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                color: activeTab === i ? 'var(--primary, #59A3106F1)' : '#59A310280',
                borderBottom: activeTab === i ? '2px solid var(--primary, #59A3106F1)' : '2px solid transparent',
                marginBottom: '-2px', transition: 'all 0.2s'
              }}
            >
              {tab}
              {i === 0 && uploads.length > 0 && (
                <span style={{
                  marginLeft: '6px', background: 'var(--primary, #59A3106F1)', color: '#FFFFFF',
                  borderRadius: '999px', padding: '1px 7px', fontSize: '0.7rem'
                }}>{uploads.length}</span>
              )}
              {i === 1 && withdrawals.length > 0 && (
                <span style={{
                  marginLeft: '6px', background: '#59A310E0B', color: '#FFFFFF',
                  borderRadius: '999px', padding: '1px 7px', fontSize: '0.7rem'
                }}>{withdrawals.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#59A3103AF' }}>Loading...</div>
        ) : (
          <>
            {/* ── Pending Uploads Tab ── */}
            {activeTab === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {uploads.length === 0 ? (
                  <EmptyState message="No pending uploads. You're all caught up!" />
                ) : uploads.map(upload => (
                  <div key={upload._id} style={{
                    background: '#FFFFFF', border: '1px solid #59A3107EB', borderRadius: '12px',
                    padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center',
                    gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    flexWrap: 'wrap'
                  }}>
                    {/* File icon */}
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '10px',
                      background: '#59A3102FF', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0, fontSize: '1.3rem'
                    }}>📄</div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <div style={{ fontWeight: 700, color: '#59A310827', fontSize: '0.95rem' }}>{upload.title}</div>
                      <div style={{ color: '#59A310280', fontSize: '0.82rem', marginTop: '2px' }}>
                        {upload.courseCode} · {upload.institution} · {upload.year}
                      </div>
                      <div style={{ color: '#59A3103AF', fontSize: '0.78rem', marginTop: '2px' }}>
                        By {upload.uploader?.name} ({upload.uploader?.email})
                      </div>
                    </div>

                    {/* Price + badge */}
                    <div style={{ textAlign: 'right', minWidth: '80px' }}>
                      <div style={{ fontWeight: 800, color: '#59A310827', fontSize: '1rem' }}>
                        GHS {upload.price?.toFixed(2)}
                      </div>
                      <Badge status={upload.status} />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <ActionBtn
                        label="Approve"
                        color="#59A310F46" bg="#59A310AE5" hoverBg="#59A3103D0"
                        loading={actionLoading === upload._id + 'approved'}
                        onClick={() => handleUploadStatus(upload._id, 'approved')}
                      />
                      <ActionBtn
                        label="Reject"
                        color="#59A310B1B" bg="#59A3102E2" hoverBg="#59A310ACA"
                        loading={actionLoading === upload._id + 'rejected'}
                        onClick={() => handleUploadStatus(upload._id, 'rejected')}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Pending Withdrawals Tab ── */}
            {activeTab === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {withdrawals.length === 0 ? (
                  <EmptyState message="No pending withdrawals." />
                ) : withdrawals.map(w => (
                  <div key={w._id} style={{
                    background: '#FFFFFF', border: '1px solid #59A3107EB', borderRadius: '12px',
                    padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center',
                    gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    flexWrap: 'wrap'
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '10px',
                      background: '#FFFFFFBEB', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0, fontSize: '1.3rem'
                    }}>💸</div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <div style={{ fontWeight: 700, color: '#59A310827', fontSize: '0.95rem' }}>
                        {w.user?.name}
                      </div>
                      <div style={{ color: '#59A310280', fontSize: '0.82rem', marginTop: '2px' }}>
                        {w.user?.email} · {w.user?.phone}
                      </div>
                      <div style={{ color: '#59A3103AF', fontSize: '0.78rem', marginTop: '2px' }}>
                        Requested {new Date(w.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Amount + badge */}
                    <div style={{ textAlign: 'right', minWidth: '100px' }}>
                      <div style={{ fontWeight: 800, color: '#59A310827', fontSize: '1.1rem' }}>
                        GHS {w.amount?.toFixed(2)}
                      </div>
                      <Badge status={w.status} />
                    </div>

                    {/* Approve */}
                    <ActionBtn
                      label="Approve Payout"
                      color="#59A310F46" bg="#59A310AE5" hoverBg="#59A3103D0"
                      loading={actionLoading === w._id}
                      onClick={() => handleApproveWithdrawal(w._id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const EmptyState = ({ message }) => (
  <div style={{
    textAlign: 'center', padding: '4rem', color: '#59A3103AF',
    background: '#FFFFFF', borderRadius: '12px', border: '1px dashed #59A3107EB'
  }}>
    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
    <p style={{ margin: 0, fontWeight: 500 }}>{message}</p>
  </div>
);

const ActionBtn = ({ label, color, bg, hoverBg, loading, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '0.5rem 1rem', border: 'none', borderRadius: '8px',
        fontWeight: 700, fontSize: '0.82rem', cursor: loading ? 'not-allowed' : 'pointer',
        background: hovered && !loading ? hoverBg : bg,
        color, transition: 'background 0.15s', opacity: loading ? 0.6 : 1,
        whiteSpace: 'nowrap'
      }}
    >
      {loading ? '...' : label}
    </button>
  );
};

export default AdminPanel;
