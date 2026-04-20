import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { SkeletonText } from '../components/Skeleton';
import { apiClient } from '../api/client';

const DELAY_OPTIONS = [
  { label: 'Sofort nach Bestellabschluss', value: '0' },
  { label: '1 Stunde später', value: '1' },
  { label: '2 Stunden später', value: '2' },
  { label: '6 Stunden später', value: '6' },
  { label: '12 Stunden später', value: '12' },
  { label: '24 Stunden — 1 Tag (empfohlen)', value: '24' },
  { label: '48 Stunden — 2 Tage', value: '48' },
  { label: '72 Stunden — 3 Tage', value: '72' },
];

// ─── Icons ───────────────────────────────────────────────────────────────────
function IconLink() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M10 13H7a4 4 0 110-8h3"/><path d="M10 7h3a4 4 0 110 8h-3"/><path d="M7 10h6"/></svg>;
}
function IconMail() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><rect x="2" y="4" width="16" height="12" rx="2"/><path d="M2 7l8 5 8-5"/></svg>;
}
function IconClock() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><circle cx="10" cy="10" r="8"/><path d="M10 6v4l3 2"/></svg>;
}

export default function Settings() {
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [form, setForm] = useState({
    googleReviewUrl: '',
    emailDelay: '24',
    emailSubject: '',
    emailFromName: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get('/api/shop')
      .then(s => {
        setShop(s);
        setForm({
          googleReviewUrl: s.googleReviewUrl || '',
          emailDelay: String(s.emailDelay ?? 24),
          emailSubject: s.emailSubject || '',
          emailFromName: s.emailFromName || '',
        });
      })
      .catch(() => toast.error('Einstellungen konnten nicht geladen werden'))
      .finally(() => setLoading(false));
  }, []);

  function field(key) {
    return {
      value: form[key],
      onChange: e => {
        setForm(p => ({ ...p, [key]: e.target.value }));
        if (errors[key]) setErrors(p => ({ ...p, [key]: null }));
      },
    };
  }

  function validate() {
    const errs = {};
    if (!form.googleReviewUrl) errs.googleReviewUrl = 'Google Review URL ist erforderlich';
    else if (!form.googleReviewUrl.startsWith('http')) errs.googleReviewUrl = 'URL muss mit https:// beginnen';
    if (!form.emailFromName.trim()) errs.emailFromName = 'Absendername ist erforderlich';
    if (!form.emailSubject.trim()) errs.emailSubject = 'Betreff ist erforderlich';
    return errs;
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      await apiClient.put('/api/shop', {
        googleReviewUrl: form.googleReviewUrl,
        emailDelay: parseInt(form.emailDelay, 10),
        emailSubject: form.emailSubject,
        emailFromName: form.emailFromName,
      });
      toast.success('Einstellungen gespeichert ✓');
    } catch (err) {
      toast.error('Fehler: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  const sections = [
    {
      icon: '🔗',
      color: '#eff6ff',
      title: 'Google Review URL',
      subtitle: 'Link zu deiner Google-Bewertungsseite',
      Icon: IconLink,
      content: (
        <div className="form-group">
          <label className="form-label">Google Review URL</label>
          <input
            className={`input${errors.googleReviewUrl ? ' error' : ''}`}
            type="url"
            placeholder="https://g.page/r/DEIN_PLACE_ID/review"
            autoComplete="off"
            {...field('googleReviewUrl')}
          />
          {errors.googleReviewUrl
            ? <div className="form-error">{errors.googleReviewUrl}</div>
            : <div className="form-hint">💡 Google Maps → Dein Unternehmen → "Rezension schreiben" → URL kopieren</div>
          }
        </div>
      ),
    },
    {
      icon: '✉️',
      color: '#f0faf4',
      title: 'Email-Inhalt',
      subtitle: 'Wie deine Kunden die Email sehen',
      Icon: IconMail,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="settings-row">
            <div className="form-group">
              <label className="form-label">Absendername</label>
              <input
                className={`input${errors.emailFromName ? ' error' : ''}`}
                type="text"
                placeholder="Team vom Café Sonne"
                {...field('emailFromName')}
              />
              {errors.emailFromName && <div className="form-error">{errors.emailFromName}</div>}
              <div className="form-hint">Erscheint im Posteingang als Absender</div>
            </div>
            <div className="form-group">
              <label className="form-label">Betreffzeile</label>
              <input
                className={`input${errors.emailSubject ? ' error' : ''}`}
                type="text"
                placeholder="Wie war deine Bestellung?"
                {...field('emailSubject')}
              />
              {errors.emailSubject && <div className="form-error">{errors.emailSubject}</div>}
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: '⏰',
      color: '#faf5ff',
      title: 'Versandzeitpunkt',
      subtitle: 'Wann nach Bestellabschluss senden',
      Icon: IconClock,
      content: (
        <div className="settings-row">
          <div className="form-group">
            <label className="form-label">Verzögerung nach Bestellabschluss</label>
            <div className="select-wrapper">
              <select className="select" {...field('emailDelay')}>
                {DELAY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="form-hint">
              24h lässt dem Kunden Zeit, das Paket zu erhalten und gibt ein realistisches Feedback-Gefühl
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Layout shopDomain={shop?.shopDomain}>
      <div style={{ maxWidth: 720 }}>
        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <div className="page-title">Einstellungen</div>
          <div className="page-subtitle">Konfiguriere ReviewPulse für deinen Shop</div>
        </div>

        {/* Sections */}
        {sections.map(s => (
          <div key={s.title} className="settings-section animate-fade-in">
            <div className="settings-section-header">
              <div className="settings-icon" style={{ background: s.color }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-900)' }}>{s.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>{s.subtitle}</div>
              </div>
            </div>
            <div className="settings-section-body">
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <SkeletonText width="40%" />
                  <SkeletonText width="100%" style={{ height: 38 }} />
                </div>
              ) : s.content}
            </div>
          </div>
        ))}

        {/* Email preview */}
        {!loading && (
          <div className="settings-section animate-fade-in">
            <div className="settings-section-header">
              <div className="settings-icon" style={{ background: '#fff7ed' }}>👁️</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-900)' }}>Email-Vorschau</div>
                <div style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>So sieht dein Kunde die Email</div>
              </div>
            </div>
            <div className="settings-section-body" style={{ alignItems: 'center' }}>
              <EmailPreview fromName={form.emailFromName} subject={form.emailSubject} />
            </div>
          </div>
        )}

        {/* Save button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8, paddingBottom: 32 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>Abbrechen</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Wird gespeichert…' : 'Einstellungen speichern'}
          </button>
        </div>
      </div>
    </Layout>
  );
}

// ─── Email Preview Component ──────────────────────────────────────────────────
function EmailPreview({ fromName, subject }) {
  const name = fromName || 'Dein Shop';
  const subj = subject || 'Wie war deine Bestellung?';

  return (
    <div className="email-preview">
      {/* Browser chrome */}
      <div className="email-chrome">
        <div className="email-chrome-dot" style={{ background: '#ff5f57' }} />
        <div className="email-chrome-dot" style={{ background: '#ffbd2e' }} />
        <div className="email-chrome-dot" style={{ background: '#28c840' }} />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'var(--gray-500)', marginLeft: -50 }}>
          {name} · {subj.slice(0, 35)}{subj.length > 35 ? '…' : ''}
        </div>
      </div>

      {/* Email header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a5c38 0%, #2d8653 100%)',
        padding: '28px 24px',
        textAlign: 'center',
      }}>
        {/* Stars */}
        <div style={{ fontSize: 28, letterSpacing: 2, marginBottom: 12 }}>⭐⭐⭐⭐⭐</div>
        <div style={{ color: 'white', fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>
          Vielen Dank für deinen Einkauf!
        </div>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 }}>
          Wir hoffen, du liebst dein Produkt
        </div>
      </div>

      {/* Email body */}
      <div style={{ padding: '20px 24px', background: 'white' }}>
        <p style={{ margin: '0 0 12px', fontSize: 14, color: '#1f2937' }}>
          Hallo <strong>Max</strong>,
        </p>
        <p style={{ margin: '0 0 16px', fontSize: 13.5, color: '#374151', lineHeight: 1.6 }}>
          wir hoffen, dass du mit deinem Einkauf bei <strong>{name}</strong> rundum zufrieden bist.
          Dein Feedback ist für uns und andere Kunden enorm wertvoll!
        </p>
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <span style={{
            display: 'inline-block',
            background: '#1a5c38',
            color: 'white',
            padding: '12px 28px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
          }}>
            Jetzt Google-Bewertung schreiben →
          </span>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
          Dauert nur 60 Sekunden und bedeutet uns sehr viel.
        </p>
      </div>

      {/* Email footer */}
      <div style={{
        padding: '12px 24px',
        background: '#f9fafb',
        borderTop: '1px solid #e5e7eb',
        fontSize: 11,
        color: '#9ca3af',
        textAlign: 'center',
      }}>
        Du erhältst diese Email, weil du bei {name} eingekauft hast.
      </div>
    </div>
  );
}
