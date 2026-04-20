import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { SkeletonText } from '../components/Skeleton';
import { apiClient } from '../api/client';

const FEATURES = [
  { icon: '✉️', text: 'Unbegrenzte automatische Review-Emails' },
  { icon: '⏰', text: 'Konfigurierbarer Versandzeitpunkt (0–168h)' },
  { icon: '📊', text: 'Klick-Tracking & Dashboard-Analytics' },
  { icon: '✏️', text: 'Individueller Betreff & Absendername' },
  { icon: '🔗', text: 'Webhooks für alle abgeschlossenen Bestellungen' },
  { icon: '🛡️', text: 'Sichere Shopify-Integration' },
  { icon: '💬', text: 'Priority Email-Support' },
];

const FAQ = [
  {
    q: 'Wann werde ich belastet?',
    a: 'Erst nach Ablauf deiner 14-tägigen kostenlosen Testphase. Du kannst vorher jederzeit kündigen.',
  },
  {
    q: 'Kann ich jederzeit kündigen?',
    a: 'Ja, mit einem Klick über das Kundencenter. Keine Mindestlaufzeit, keine Kündigungsfristen.',
  },
  {
    q: 'Was passiert nach der Kündigung?',
    a: 'Der Email-Versand stoppt sofort. Deine Daten bleiben 30 Tage gespeichert.',
  },
  {
    q: 'Welche Zahlungsmethoden akzeptiert ihr?',
    a: 'Alle gängigen Kredit- und Debitkarten (Visa, Mastercard, Amex) über Stripe.',
  },
];

const STATUS_CONFIG = {
  active:    { label: 'Aktiv',                 cls: 'badge-active',   icon: '✓' },
  trialing:  { label: 'Testphase',             cls: 'badge-trialing', icon: '⏳' },
  past_due:  { label: 'Zahlung fehlgeschlagen',cls: 'badge-past_due', icon: '⚠' },
  canceled:  { label: 'Gekündigt',             cls: 'badge-canceled', icon: '✕' },
};

export default function Billing() {
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    apiClient.get('/api/shop')
      .then(setShop)
      .catch(() => toast.error('Billing-Daten konnten nicht geladen werden'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubscribe() {
    setActionLoading(true);
    try {
      const { url } = await apiClient.post('/billing/create-checkout');
      window.top.location.href = url;
    } catch (err) {
      toast.error('Checkout fehlgeschlagen: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleManage() {
    setActionLoading(true);
    try {
      const { url } = await apiClient.post('/billing/portal');
      window.top.location.href = url;
    } catch (err) {
      toast.error('Portal konnte nicht geöffnet werden: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  const sub = shop?.subscription;
  const cfg = STATUS_CONFIG[sub?.status] || {};
  const isActive = sub?.status === 'active' || sub?.status === 'trialing';
  const trialEnd = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;

  const daysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000))
    : null;

  return (
    <Layout shopDomain={shop?.shopDomain}>
      <div style={{ maxWidth: 680 }}>
        <div style={{ marginBottom: 28 }}>
          <div className="page-title">Billing</div>
          <div className="page-subtitle">Dein Abonnement verwalten</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

          {/* ── Plan card ── */}
          <div className="pricing-card animate-slide-up">
            <div className="pricing-header">
              {loading ? (
                <SkeletonText width={80} style={{ background: 'rgba(255,255,255,0.3)', height: 20 }} />
              ) : sub && (
                <div className="pricing-badge">
                  {cfg.icon} {cfg.label}
                  {sub.status === 'trialing' && daysLeft !== null && ` — noch ${daysLeft} Tage`}
                </div>
              )}
              <div className="pricing-price">
                $15
                <span className="pricing-period"> / Monat</span>
              </div>
              <div className="pricing-desc">
                ReviewPulse Pro — alles inklusive
              </div>
            </div>

            <div className="pricing-body">
              {sub?.status === 'trialing' && daysLeft !== null && (
                <div className="banner banner-info" style={{ marginBottom: 20 }}>
                  <span className="banner-icon">ℹ️</span>
                  <div className="banner-body">
                    <div className="banner-title">Testphase läuft</div>
                    Deine kostenlose Testphase endet am{' '}
                    <strong>
                      {trialEnd?.toLocaleDateString('de-DE', {
                        day: '2-digit', month: 'long', year: 'numeric',
                      })}
                    </strong>.
                    Danach werden $15/Monat abgerechnet.
                  </div>
                </div>
              )}

              {sub?.status === 'past_due' && (
                <div className="banner banner-error" style={{ marginBottom: 20 }}>
                  <span className="banner-icon">⚠️</span>
                  <div className="banner-body">
                    <div className="banner-title">Zahlung fehlgeschlagen</div>
                    Bitte aktualisiere deine Zahlungsdaten, damit Review-Emails weiter versendet werden.
                  </div>
                </div>
              )}

              {/* Features */}
              <div style={{ marginBottom: 24 }}>
                {FEATURES.map(f => (
                  <div key={f.text} className="pricing-feature">
                    <div className="pricing-check">
                      <svg viewBox="0 0 12 12" fill="none" width="10" height="10">
                        <path d="M2 6l3 3 5-5" stroke="#1a5c38" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span>{f.icon} {f.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {loading ? (
                <SkeletonText width="100%" style={{ height: 44 }} />
              ) : !sub || sub.status === 'canceled' ? (
                <button
                  className="btn btn-primary btn-lg w-full"
                  onClick={handleSubscribe}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Wird geladen…' : '🚀 14 Tage kostenlos testen'}
                </button>
              ) : sub.status === 'past_due' ? (
                // past_due: customer must update payment — go to Stripe portal, NOT checkout
                <button
                  className="btn btn-danger btn-lg w-full"
                  onClick={handleManage}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Wird geladen…' : '⚠ Zahlung aktualisieren'}
                </button>
              ) : isActive ? (
                <button
                  className="btn btn-secondary btn-lg w-full"
                  onClick={handleManage}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Wird geladen…' : 'Abonnement verwalten'}
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-lg w-full"
                  onClick={handleSubscribe}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Wird geladen…' : 'Erneut abonnieren'}
                </button>
              )}

              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--gray-400)', marginTop: 12 }}>
                Keine Einrichtungsgebühren · Jederzeit kündbar · Sicher über Stripe
              </p>
            </div>
          </div>

          {/* ── FAQ ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              FAQ
            </div>
            {FAQ.map((item, i) => (
              <div
                key={i}
                className="card"
                style={{ overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-800)' }}>{item.q}</div>
                  <svg
                    viewBox="0 0 16 16"
                    width="14" height="14"
                    fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round"
                    style={{
                      flexShrink: 0,
                      transition: 'transform 200ms',
                      transform: openFaq === i ? 'rotate(180deg)' : 'none',
                    }}
                  >
                    <path d="M3 6l5 5 5-5"/>
                  </svg>
                </div>
                {openFaq === i && (
                  <div style={{
                    padding: '0 16px 12px',
                    fontSize: 13,
                    color: 'var(--gray-500)',
                    lineHeight: 1.6,
                    borderTop: '1px solid var(--gray-100)',
                    paddingTop: 10,
                    animation: 'fadeIn 150ms ease',
                  }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
