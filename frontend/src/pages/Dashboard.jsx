import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { SkeletonHero, SkeletonStatsGrid, SkeletonTable } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Onboarding from './Onboarding';
import { apiClient } from '../api/client';

// ─── Icons ───────────────────────────────────────────────────────────────────
function IconMail() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><rect x="2" y="4" width="16" height="12" rx="2"/><path d="M2 7l8 5 8-5"/></svg>;
}
function IconClick() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M6 3v8l3-2 2 4 2-1-2-4 3-1z"/></svg>;
}
function IconPercent() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><circle cx="6" cy="6" r="2"/><circle cx="14" cy="14" r="2"/><path d="M16 4L4 16"/></svg>;
}
function IconArrowUp() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M8 12V4M4 8l4-4 4 4"/></svg>;
}
function IconArrowDown() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M8 4v8M4 8l4 4 4-4"/></svg>;
}
function IconRefresh() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M4 4a8 8 0 0114 4M16 16a8 8 0 01-14-4"/><path d="M20 4l-2 4-4-2"/><path d="M0 16l2-4 4 2"/></svg>;
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS = {
  pending: { label: 'Ausstehend', cls: 'badge-pending', dot: '#d97706' },
  sent:    { label: 'Gesendet',   cls: 'badge-sent',    dot: '#2563eb' },
  clicked: { label: 'Geklickt',   cls: 'badge-clicked', dot: '#059669' },
  bounced: { label: 'Bounced',    cls: 'badge-bounced', dot: '#dc2626' },
};

function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, cls: 'badge-pending', dot: '#6b7280' };
  return (
    <span className={`badge ${s.cls}`}>
      <span className="badge-dot" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

// ─── Sparkline bars ───────────────────────────────────────────────────────────
function Sparkline({ daily }) {
  const days = Object.entries(daily || {}).slice(-7);
  const max = Math.max(...days.map(([, v]) => (v.sent || 0) + (v.clicked || 0)), 1);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="hero-sparkline">
      {days.map(([date, v]) => {
        const total = (v.sent || 0) + (v.clicked || 0);
        const pct = Math.max((total / max) * 100, 8);
        return (
          <div
            key={date}
            className={`hero-bar${date === today ? ' active' : ''}`}
            style={{ height: `${pct}%` }}
            title={`${date}: ${total} emails`}
          />
        );
      })}
      {days.length === 0 && [1,2,3,4,5,6,7].map(i => (
        <div key={i} className="hero-bar" style={{ height: `${8 + i * 4}%`, opacity: 0.4 }} />
      ))}
    </div>
  );
}

// ─── Week stats ───────────────────────────────────────────────────────────────
function getWeekStats(daily) {
  if (!daily) return { thisWeek: 0, lastWeek: 0, trend: 0 };
  const entries = Object.entries(daily);
  const now = Date.now();
  const D = 86400000;
  const thisWeek = entries
    .filter(([d]) => now - new Date(d).getTime() < 7 * D)
    .reduce((s, [, v]) => s + (v.sent || 0) + (v.clicked || 0), 0);
  const lastWeek = entries
    .filter(([d]) => {
      const t = now - new Date(d).getTime();
      return t >= 7 * D && t < 14 * D;
    })
    .reduce((s, [, v]) => s + (v.sent || 0) + (v.clicked || 0), 0);
  const trend = lastWeek === 0 ? null : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  return { thisWeek, lastWeek, trend };
}

// ─── Stats cards ──────────────────────────────────────────────────────────────
function StatsGrid({ stats }) {
  const cards = [
    {
      label: 'Emails gesendet',
      value: stats.sent,
      Icon: IconMail,
      color: '#2563eb',
      bg: '#eff6ff',
      sub: 'gesamt',
    },
    {
      label: 'Links geklickt',
      value: stats.clicked,
      Icon: IconClick,
      color: '#059669',
      bg: '#ecfdf5',
      sub: 'Kunden haben geklickt',
    },
    {
      label: 'Klickrate',
      value: stats.emailsSent > 0 ? Math.round((stats.linksClicked / stats.emailsSent) * 100) + "%" : "0%",
      Icon: IconPercent,
      color: '#7c3aed',
      bg: '#f5f3ff',
      sub: 'der gesendeten Emails',
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map(({ label, value, Icon, color, bg, sub }) => (
        <div key={label} className="stat-card animate-fade-in">
          <div className="stat-card-header">
            <span className="stat-card-label">{label}</span>
            <div className="stat-card-icon" style={{ background: bg }}>
              <span style={{ color }}><Icon /></span>
            </div>
          </div>
          <div className="stat-card-value">{value}</div>
          <div className="stat-card-sub">{sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Requests table ───────────────────────────────────────────────────────────
const FILTERS = [
  { key: '',        label: 'Alle' },
  { key: 'pending', label: 'Ausstehend' },
  { key: 'sent',    label: 'Gesendet' },
  { key: 'clicked', label: 'Geklickt' },
  { key: 'bounced', label: 'Bounced' },
];

function RequestsTable({ requests, loading, pagination, onPageChange, statusFilter, onFilter, stats }) {
  if (loading) return <SkeletonTable rows={6} />;

  return (
    <>
      {/* Filter tabs */}
      <div className="filter-bar">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`filter-tab${statusFilter === f.key ? ' active' : ''}`}
            onClick={() => onFilter(f.key)}
          >
            {f.label}
            {f.key === '' && stats?.total > 0 && (
              <span className="filter-tab-count">{stats.total}</span>
            )}
            {f.key === 'clicked' && stats?.clicked > 0 && (
              <span className="filter-tab-count">{stats.clicked}</span>
            )}
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <EmptyState variant="noRequests" />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Bestellung</th>
                <th>Kunde</th>
                <th>Email</th>
                <th>Gesendet am</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td className="table-primary-cell">{r.orderName || '—'}</td>
                  <td>{r.customerName}</td>
                  <td>
                    <a
                      href={`mailto:${r.customerEmail}`}
                      style={{ color: 'var(--green-700)', textDecoration: 'none' }}
                      onMouseOver={e => e.target.style.textDecoration = 'underline'}
                      onMouseOut={e => e.target.style.textDecoration = 'none'}
                    >
                      {r.customerEmail}
                    </a>
                  </td>
                  <td className="table-muted">
                    {r.sentAt
                      ? new Date(r.sentAt).toLocaleDateString('de-DE', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })
                      : <span style={{ color: 'var(--gray-400)' }}>—</span>
                    }
                  </td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderTop: '1px solid var(--color-border)',
          fontSize: 13, color: 'var(--gray-500)',
        }}>
          <span>
            {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} von {pagination.total}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              ← Zurück
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Weiter →
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Initial data load
  useEffect(() => {
    Promise.all([apiClient.get('/api/shop'), apiClient.get('/api/analytics')])
      .then(([shopData, analyticsData]) => {
        setShop(shopData);
        setAnalytics(analyticsData);
        if (!shopData.googleReviewUrl) setShowOnboarding(true);
      })
      .catch(err => toast.error('Daten konnten nicht geladen werden'))
      .finally(() => setInitialLoading(false));
  }, []);

  // Table load
  const loadRequests = useCallback(async () => {
    setTableLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) params.set('status', statusFilter);
      const data = await apiClient.get(`/api/review-requests?${params}`);
      setRequests(data.requests);
      setPagination(data.pagination);
    } catch {
      toast.error('Anfragen konnten nicht geladen werden');
    } finally {
      setTableLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  if (showOnboarding) {
    return (
      <Onboarding
        onComplete={() => {
          setShowOnboarding(false);
          // Reload shop data after onboarding
          apiClient.get('/api/shop').then(setShop).catch(() => {});
          toast.success('🎉 ReviewPulse ist jetzt aktiv!');
        }}
      />
    );
  }

  const { thisWeek, trend } = getWeekStats(analytics?.daily);
  const stats = analytics?.stats || {};

  // Subscription warning
  const subStatus = shop?.subscription?.status;
  const showSubWarning = subStatus === 'past_due' || subStatus === 'canceled';

  return (
    <Layout
      shopDomain={shop?.shopDomain}
      headerRight={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {subStatus && (
            <span
              className={`badge badge-${subStatus}`}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/billing')}
            >
              {subStatus === 'trialing' ? '⏳ Trial' :
               subStatus === 'active'   ? '✓ Aktiv' :
               subStatus === 'past_due' ? '⚠ Zahlung fehlgeschlagen' :
               'Inaktiv'}
            </span>
          )}
          <button className="btn btn-secondary btn-sm" onClick={loadRequests}>
            <IconRefresh /> Aktualisieren
          </button>
        </div>
      }
    >
      {/* Subscription warning */}
      {showSubWarning && (
        <div
          className={`banner banner-${subStatus === 'past_due' ? 'error' : 'warning'} mb-6`}
          style={{ marginBottom: 24 }}
        >
          <span className="banner-icon">{subStatus === 'past_due' ? '⚠️' : '🔒'}</span>
          <div className="banner-body">
            <div className="banner-title">
              {subStatus === 'past_due' ? 'Zahlung fehlgeschlagen' : 'Subscription inaktiv'}
            </div>
            <div>
              ReviewEmails werden nicht mehr versendet.{' '}
              <button
                style={{ color: 'inherit', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
                onClick={() => navigate('/billing')}
              >
                Jetzt beheben →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero card ── */}
      {initialLoading ? <SkeletonHero /> : (
        <div className="hero-card animate-slide-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="hero-label">Diese Woche versendet</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
                <div className="hero-number">{thisWeek}</div>
                {trend !== null && (
                  <span className="hero-trend">
                    {trend >= 0 ? <IconArrowUp /> : <IconArrowDown />}
                    {Math.abs(trend)}%
                  </span>
                )}
              </div>
              <div className="hero-sub">
                Review-Anfragen • {stats.clicked || 0} Kunden haben geklickt
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>
                Letzte 7 Tage
              </div>
              <Sparkline daily={analytics?.daily} />
            </div>
          </div>
        </div>
      )}

      {/* ── Stats grid ── */}
      {initialLoading ? (
        <SkeletonStatsGrid />
      ) : (
        <div style={{ marginBottom: 24 }}>
          <StatsGrid stats={stats} />
        </div>
      )}

      {/* ── Requests table ── */}
      <div className="card animate-fade-in" style={{ overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div className="section-title">Review-Anfragen</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
              {stats.total > 0
                ? `${stats.total} Anfragen insgesamt`
                : 'Wird automatisch gefüllt sobald Bestellungen eingehen'
              }
            </div>
          </div>
          {!shop?.googleReviewUrl && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowOnboarding(true)}
            >
              Setup abschließen
            </button>
          )}
        </div>

        <RequestsTable
          requests={requests}
          loading={tableLoading || initialLoading}
          pagination={pagination}
          onPageChange={p => setPage(p)}
          statusFilter={statusFilter}
          onFilter={f => { setStatusFilter(f); setPage(1); }}
          stats={stats}
        />
      </div>
    </Layout>
  );
}
