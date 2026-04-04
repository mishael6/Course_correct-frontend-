import { useState, useEffect, useCallback } from 'react';
import api from '../api';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#F8F8F5', card: '#FFFFFF', border: '#E8E8E4',
  text: '#111111', muted: '#6B6B6B', light: '#9A9A9A',
  yellow: '#EAB308', yellowBg: '#FEF9C3', yellowText: '#854D0E',
  green: '#16A34A', greenBg: '#DCFCE7', greenText: '#14532D',
  red: '#DC2626', redBg: '#FEE2E2', redText: '#7F1D1D',
  blue: '#1D4ED8', blueBg: '#EFF6FF', blueText: '#1E40AF',
  purple: '#7C3AED', purpleBg: '#F5F3FF',
};

const TABS = ['Overview', 'Uploads', 'Withdrawals', 'Users', 'Settings'];

// ─── Micro components ─────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const map = {
    pending:  { bg: C.yellowBg, color: C.yellowText, border: '#FDE68A' },
    approved: { bg: C.greenBg,  color: C.greenText,  border: '#BBF7D0' },
    rejected: { bg: C.redBg,    color: C.redText,    border: '#FECACA' },
    student:  { bg: C.blueBg,   color: C.blueText,   border: '#BFDBFE' },
    admin:    { bg: C.purpleBg, color: C.purple,     border: '#DDD6FE' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem',
      fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`
    }}>{status}</span>
  );
};

const StatCard = ({ label, value, accent, sub, icon }) => (
  <div style={{
    background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px',
    padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ fontSize: '0.72rem', color: C.light, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
      {icon && <span style={{ fontSize: '1.3rem' }}>{icon}</span>}
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 800, color: accent || C.text, lineHeight: 1, marginTop: '0.5rem', fontFamily: 'monospace' }}>{value}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: C.light, marginTop: '0.4rem' }}>{sub}</div>}
  </div>
);

const ActionBtn = ({ label, color, bg, hoverBg, loading, onClick, style = {} }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} disabled={loading}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        padding: '0.5rem 1rem', border: 'none', borderRadius: '8px',
        fontWeight: 700, fontSize: '0.82rem', cursor: loading ? 'not-allowed' : 'pointer',
        background: hovered && !loading ? hoverBg : bg, color,
        transition: 'background 0.15s', opacity: loading ? 0.6 : 1,
        whiteSpace: 'nowrap', fontFamily: 'inherit', ...style
      }}>
      {loading ? '...' : label}
    </button>
  );
};

const Input = ({ label, value, onChange, type = 'text', prefix, suffix, hint }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
    {label && <label style={{ fontSize: '0.8rem', fontWeight: 700, color: C.muted, letterSpacing: '0.04em' }}>{label}</label>}
    <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden', background: '#FAFAF8' }}>
      {prefix && <span style={{ padding: '0 0.75rem', color: C.muted, fontSize: '0.88rem', borderRight: `1px solid ${C.border}`, height: '100%', display: 'flex', alignItems: 'center' }}>{prefix}</span>}
      <input
        type={type} value={value} onChange={onChange}
        style={{ flex: 1, padding: '0.7rem 0.9rem', border: 'none', outline: 'none', fontSize: '0.95rem', background: 'transparent', color: C.text, fontFamily: 'inherit' }}
      />
      {suffix && <span style={{ padding: '0 0.75rem', color: C.muted, fontSize: '0.85rem' }}>{suffix}</span>}
    </div>
    {hint && <div style={{ fontSize: '0.75rem', color: C.light }}>{hint}</div>}
  </div>
);

// ─── PDF Preview Modal ────────────────────────────────────────────────────────
const PreviewModal = ({ uploadId, title, token, onClose }) => {
  if (!uploadId) return null;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const previewUrl = `${baseUrl}/uploads/${uploadId}/preview?token=${token}`;
  const googleUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(previewUrl)}&embedded=true`;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: C.light, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Reviewing</div>
          <div style={{ fontWeight: 700, color: C.text, fontSize: '0.95rem', marginTop: '2px' }}>{title}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <a href={previewUrl} target="_blank" rel="noreferrer"
            style={{ padding: '0.5rem 1rem', background: C.yellow, borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#111', textDecoration: 'none' }}>
            Open PDF ↗
          </a>
          <button onClick={onClose} style={{ padding: '0.5rem 1rem', background: C.text, border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
            Close ✕
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <iframe src={googleUrl} style={{ width: '100%', height: '100%', border: 'none' }} title={title} />
        <div style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '0.6rem 1.25rem', borderRadius: '999px', fontSize: '0.78rem', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          If preview doesn't load, click "Open PDF" above
        </div>
      </div>
    </div>
  );
};

// ─── Main AdminPanel ──────────────────────────────────────────────────────────
const AdminPanel = () => {
  const [tab, setTab] = useState(0);
  const [uploads, setUploads] = useState([]);
  const [allUploads, setAllUploads] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [settingsDraft, setSettingsDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadFilter, setUploadFilter] = useState('pending');
  const token = localStorage.getItem('token');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [uploadsRes, withdrawalsRes, statsRes, settingsRes] = await Promise.all([
        api.get('/admin/uploads/pending'),
        api.get('/admin/withdrawals/pending'),
        api.get('/admin/stats'),
        api.get('/admin/settings'),
      ]);
      setUploads(uploadsRes.data);
      setWithdrawals(withdrawalsRes.data);
      setStats(statsRes.data);
      setSettings(settingsRes.data);
      setSettingsDraft(settingsRes.data);
    } catch (err) {
      showToast('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllUploads = useCallback(async () => {
    try {
      const res = await api.get(`/admin/uploads?status=${uploadFilter}`);
      setAllUploads(res.data);
    } catch {}
  }, [uploadFilter]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch {}
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (tab === 1) fetchAllUploads(); }, [tab, fetchAllUploads]);
  useEffect(() => { if (tab === 3) fetchUsers(); }, [tab, fetchUsers]);

  const handleUploadStatus = async (id, status) => {
    setActionLoading(id + status);
    try {
      await api.put(`/admin/uploads/${id}/status`, { status });
      setUploads(prev => prev.filter(u => u._id !== id));
      setAllUploads(prev => prev.map(u => u._id === id ? { ...u, status } : u));
      setStats(prev => prev ? {
        ...prev,
        pendingUploads: prev.pendingUploads - 1,
        approvedUploads: status === 'approved' ? prev.approvedUploads + 1 : prev.approvedUploads,
        rejectedUploads: status === 'rejected' ? prev.rejectedUploads + 1 : prev.rejectedUploads,
      } : prev);
      showToast(`Upload ${status}`);
    } catch { showToast('Action failed', 'error'); }
    finally { setActionLoading(null); }
  };

  const handleApproveWithdrawal = async (id) => {
    setActionLoading(id);
    try {
      await api.put(`/admin/withdrawals/${id}/approve`);
      setWithdrawals(prev => prev.filter(w => w._id !== id));
      setStats(prev => prev ? { ...prev, pendingWithdrawals: prev.pendingWithdrawals - 1 } : prev);
      showToast('Withdrawal approved');
    } catch { showToast('Action failed', 'error'); }
    finally { setActionLoading(null); }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await api.put('/admin/settings', settingsDraft);
      setSettings(res.data.settings);
      setSettingsDraft(res.data.settings);
      showToast('Settings saved successfully');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const s = (field) => ({
    value: settingsDraft?.[field] ?? '',
    onChange: (e) => setSettingsDraft(prev => ({ ...prev, [field]: e.target.value }))
  });

  const tabStyle = (i) => ({
    padding: '0.6rem 1.1rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    fontWeight: 700, fontSize: '0.85rem', borderRadius: '9px',
    background: tab === i ? C.card : 'transparent',
    color: tab === i ? C.text : C.muted,
    boxShadow: tab === i ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
    transition: 'all 0.15s'
  });

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 999,
          padding: '0.85rem 1.5rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.88rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          background: toast.type === 'error' ? C.redBg : C.greenBg,
          color: toast.type === 'error' ? C.redText : C.greenText,
          border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`,
        }}>{toast.msg}</div>
      )}

      {preview && (
        <PreviewModal
          uploadId={preview.id} title={preview.title}
          token={token} onClose={() => setPreview(null)}
        />
      )}

      <div style={{ minHeight: '100vh', background: C.bg, padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-0.02em' }}>Admin Panel</h1>
            <p style={{ color: C.muted, margin: '0.3rem 0 0', fontSize: '0.9rem' }}>Manage uploads, users, withdrawals and platform settings</p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', background: '#F0F0EC', borderRadius: '12px', padding: '0.3rem', width: 'fit-content', flexWrap: 'wrap' }}>
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)} style={tabStyle(i)}>
                {t}
                {i === 0 && stats?.pendingUploads > 0 && <span style={{ marginLeft: '5px', background: C.yellow, color: '#111', borderRadius: '999px', padding: '1px 6px', fontSize: '0.7rem' }}>{stats.pendingUploads}</span>}
                {i === 2 && stats?.pendingWithdrawals > 0 && <span style={{ marginLeft: '5px', background: C.purple, color: '#fff', borderRadius: '999px', padding: '1px 6px', fontSize: '0.7rem' }}>{stats.pendingWithdrawals}</span>}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: C.light }}>Loading...</div>
          ) : (
            <>
              {/* ── OVERVIEW TAB ── */}
              {tab === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                    <StatCard label="Total Uploads" value={stats?.totalUploads ?? '—'} icon="📄" />
                    <StatCard label="Pending" value={stats?.pendingUploads ?? '—'} accent={C.yellow} icon="⏳" />
                    <StatCard label="Approved" value={stats?.approvedUploads ?? '—'} accent={C.green} icon="✅" />
                    <StatCard label="Rejected" value={stats?.rejectedUploads ?? '—'} accent={C.red} icon="❌" />
                    <StatCard label="Students" value={stats?.totalStudents ?? '—'} accent={C.blue} icon="🎓" />
                    <StatCard label="Withdrawals" value={stats?.pendingWithdrawals ?? '—'} accent={C.purple} icon="💸" sub="Pending" />
                  </div>

                  {/* Quick pending uploads */}
                  {uploads.length > 0 && (
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ fontWeight: 700, color: C.text }}>Pending Uploads</div>
                        <button onClick={() => setTab(1)} style={{ background: 'none', border: 'none', color: C.muted, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}>View all →</button>
                      </div>
                      {uploads.slice(0, 3).map(u => (
                        <UploadRow key={u._id} upload={u} onStatus={handleUploadStatus} onPreview={setPreview} actionLoading={actionLoading} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── UPLOADS TAB ── */}
              {tab === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Filter */}
                  <div style={{ display: 'flex', gap: '0.5rem', background: '#F0F0EC', borderRadius: '10px', padding: '0.3rem', width: 'fit-content' }}>
                    {['pending', 'approved', 'rejected'].map(f => (
                      <button key={f} onClick={() => setUploadFilter(f)}
                        style={{ padding: '0.45rem 1rem', border: 'none', borderRadius: '7px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', textTransform: 'capitalize', background: uploadFilter === f ? C.card : 'transparent', color: uploadFilter === f ? C.text : C.muted, boxShadow: uploadFilter === f ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                        {f}
                      </button>
                    ))}
                  </div>

                  {allUploads.length === 0 ? <EmptyState message={`No ${uploadFilter} uploads`} /> :
                    allUploads.map(u => (
                      <UploadRow key={u._id} upload={u} onStatus={handleUploadStatus} onPreview={setPreview} actionLoading={actionLoading} showAll />
                    ))
                  }
                </div>
              )}

              {/* ── WITHDRAWALS TAB ── */}
              {tab === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {withdrawals.length === 0 ? <EmptyState message="No pending withdrawals" /> :
                    withdrawals.map(w => (
                      <div key={w._id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: C.purpleBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.3rem' }}>💸</div>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                          <div style={{ fontWeight: 700, color: C.text }}>{w.user?.name}</div>
                          <div style={{ color: C.muted, fontSize: '0.8rem', marginTop: '2px' }}>{w.user?.email} · {w.user?.phone}</div>
                          <div style={{ color: C.light, fontSize: '0.75rem', marginTop: '2px' }}>{new Date(w.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: C.text, fontSize: '1.1rem', fontFamily: 'monospace' }}>GHS {w.amount?.toFixed(2)}</div>
                          <Badge status={w.status} />
                        </div>
                        <ActionBtn label="Approve Payout" color={C.greenText} bg={C.greenBg} hoverBg="#BBF7D0" loading={actionLoading === w._id} onClick={() => handleApproveWithdrawal(w._id)} />
                      </div>
                    ))
                  }
                </div>
              )}

              {/* ── USERS TAB ── */}
              {tab === 3 && (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, color: C.text }}>{users.length} Students</div>
                  </div>
                  {users.length === 0 ? <EmptyState message="No students yet" /> :
                    users.map((u, i) => (
                      <div key={u._id} style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', borderBottom: i < users.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: C.blueBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: C.blue, fontSize: '0.9rem', flexShrink: 0 }}>
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: '160px' }}>
                          <div style={{ fontWeight: 700, color: C.text, fontSize: '0.9rem' }}>{u.name}</div>
                          <div style={{ color: C.muted, fontSize: '0.78rem', marginTop: '1px' }}>{u.email} · {u.phone}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.68rem', color: C.light, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Balance</div>
                            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: C.green }}>GHS {u.balance?.toFixed(2) || '0.00'}</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.68rem', color: C.light, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Earned</div>
                            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: C.yellow }}>GHS {u.totalEarnings?.toFixed(2) || '0.00'}</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.68rem', color: C.light, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Joined</div>
                            <div style={{ fontSize: '0.8rem', color: C.muted }}>{new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                          </div>
                        </div>
                        <Badge status={u.role} />
                      </div>
                    ))
                  }
                </div>
              )}

              {/* ── SETTINGS TAB ── */}
              {tab === 4 && settingsDraft && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                  {/* Pricing */}
                  <SettingsSection title="Pricing" icon="💰" desc="Control how much students can charge for uploads and the monthly subscription price.">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <Input label="Subscription Price" prefix="GHS" type="number" hint="Monthly fee for unlimited access" {...s('subscriptionPrice')} />
                      <Input label="Min Upload Price" prefix="GHS" type="number" hint="Minimum a student can charge" {...s('minUploadPrice')} />
                      <Input label="Max Upload Price" prefix="GHS" type="number" hint="Maximum a student can charge" {...s('maxUploadPrice')} />
                    </div>
                  </SettingsSection>

                  {/* Commission */}
                  <SettingsSection title="Commission" icon="📊" desc="How much uploaders earn per sale. The rest goes to the platform.">
                    <div style={{ maxWidth: '280px' }}>
                      <Input label="Uploader Earnings" type="number" suffix="%" hint={`Platform keeps ${100 - (Number(settingsDraft.uploaderCommissionPercent) || 80)}%`} {...s('uploaderCommissionPercent')} />
                    </div>
                    <div style={{ marginTop: '1rem', padding: '1rem', background: C.bg, borderRadius: '10px', border: `1px solid ${C.border}`, fontSize: '0.85rem', color: C.muted }}>
                      On a GHS 10 sale: uploader earns <strong style={{ color: C.green }}>GHS {((Number(settingsDraft.uploaderCommissionPercent) || 80) / 100 * 10).toFixed(2)}</strong>, platform earns <strong style={{ color: C.text }}>GHS {((100 - (Number(settingsDraft.uploaderCommissionPercent) || 80)) / 100 * 10).toFixed(2)}</strong>
                    </div>
                  </SettingsSection>

                  {/* Upload limits */}
                  <SettingsSection title="Upload Limits" icon="📁" desc="Control the maximum file size students can upload.">
                    <div style={{ maxWidth: '280px' }}>
                      <Input label="Max File Size" type="number" suffix="MB" hint="Maximum PDF file size" {...s('maxFileSizeMB')} />
                    </div>
                  </SettingsSection>

                  {/* Platform info */}
                  <SettingsSection title="Platform Info" icon="ℹ️" desc="Basic platform details.">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                      <Input label="Platform Name" {...s('platformName')} />
                      <Input label="Support Email" type="email" {...s('supportEmail')} />
                    </div>
                  </SettingsSection>

                  {/* Save button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={handleSaveSettings}
                      disabled={savingSettings}
                      style={{
                        padding: '0.85rem 2.5rem', background: C.yellow, color: '#111',
                        border: 'none', borderRadius: '10px', fontFamily: 'inherit',
                        fontWeight: 700, fontSize: '0.95rem', cursor: savingSettings ? 'not-allowed' : 'pointer',
                        opacity: savingSettings ? 0.6 : 1, transition: 'opacity 0.2s'
                      }}
                    >
                      {savingSettings ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

// ─── SettingsSection ──────────────────────────────────────────────────────────
const SettingsSection = ({ title, icon, desc, children }) => (
  <div style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
    <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '1.3rem' }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 700, color: C.text, fontSize: '0.95rem' }}>{title}</div>
        <div style={{ color: C.muted, fontSize: '0.82rem', marginTop: '2px' }}>{desc}</div>
      </div>
    </div>
    <div style={{ padding: '1.5rem' }}>{children}</div>
  </div>
);

// ─── UploadRow ────────────────────────────────────────────────────────────────
const UploadRow = ({ upload, onStatus, onPreview, actionLoading, showAll }) => (
  <div style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: C.yellowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.2rem' }}>📄</div>
    <div style={{ flex: 1, minWidth: '160px' }}>
      <div style={{ fontWeight: 700, color: C.text, fontSize: '0.92rem' }}>{upload.title}</div>
      <div style={{ color: C.muted, fontSize: '0.78rem', marginTop: '2px' }}>{upload.courseCode} · {upload.institution} · {upload.year}</div>
      <div style={{ color: C.light, fontSize: '0.75rem', marginTop: '1px' }}>By {upload.uploader?.name} ({upload.uploader?.email})</div>
    </div>
    <div style={{ textAlign: 'right', minWidth: '80px' }}>
      <div style={{ fontWeight: 800, color: C.text, fontFamily: 'monospace' }}>GHS {upload.price?.toFixed(2)}</div>
      <Badge status={upload.status} />
    </div>
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <ActionBtn label="Preview" color={C.blueText} bg={C.blueBg} hoverBg="#DBEAFE"
        onClick={() => onPreview({ id: upload._id, title: upload.title })} />
      {upload.status === 'pending' && <>
        <ActionBtn label="Approve" color={C.greenText} bg={C.greenBg} hoverBg="#BBF7D0"
          loading={actionLoading === upload._id + 'approved'}
          onClick={() => onStatus(upload._id, 'approved')} />
        <ActionBtn label="Reject" color={C.redText} bg={C.redBg} hoverBg="#FECACA"
          loading={actionLoading === upload._id + 'rejected'}
          onClick={() => onStatus(upload._id, 'rejected')} />
      </>}
    </div>
  </div>
);

// ─── EmptyState ───────────────────────────────────────────────────────────────
const EmptyState = ({ message }) => (
  <div style={{ textAlign: 'center', padding: '4rem', background: '#FFFFFF', borderRadius: '14px', border: `1px dashed ${C.border}`, color: C.light }}>
    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
    <p style={{ margin: 0, fontWeight: 500 }}>{message}</p>
  </div>
);

export default AdminPanel;
