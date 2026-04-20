import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '../api/client';

const STEPS = [
  {
    label: 'Schritt 1 von 3',
    title: 'Google Review URL einrichten',
    desc: 'Öffne Google Maps, suche dein Unternehmen, klicke auf "Rezension schreiben" und kopiere den Link aus der URL-Leiste.',
  },
  {
    label: 'Schritt 2 von 3',
    title: 'Email personalisieren',
    desc: 'Passe Absendername und Betreff an — deine Kunden sehen, dass die Email direkt von dir kommt.',
  },
  {
    label: 'Schritt 3 von 3',
    title: 'Sendezeitpunkt wählen',
    desc: 'Wann soll die Email nach einer Bestellbestätigung versendet werden? 24h nach Versand ist oft ideal.',
  },
];

const DELAY_OPTIONS = [
  { label: 'Sofort nach Bestellabschluss', value: '0' },
  { label: '1 Stunde später', value: '1' },
  { label: '6 Stunden später', value: '6' },
  { label: '24 Stunden (empfohlen)', value: '24' },
  { label: '48 Stunden (2 Tage)', value: '48' },
  { label: '72 Stunden (3 Tage)', value: '72' },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    googleReviewUrl: '',
    emailFromName: '',
    emailSubject: 'Wie war deine Bestellung? Hinterlasse uns eine Bewertung!',
    emailDelay: '24',
  });
  const [errors, setErrors] = useState({});

  const progress = ((step) / 3) * 100;
  const isDone = step === 3;

  function field(key) {
    return {
      value: form[key],
      onChange: e => setForm(p => ({ ...p, [key]: e.target.value })),
    };
  }

  function validateStep() {
    if (step === 0) {
      if (!form.googleReviewUrl) return { googleReviewUrl: 'Bitte gib eine URL ein' };
      if (!form.googleReviewUrl.startsWith('http')) return { googleReviewUrl: 'URL muss mit https:// beginnen' };
    }
    if (step === 1) {
      if (!form.emailFromName.trim()) return { emailFromName: 'Absendername ist erforderlich' };
      if (!form.emailSubject.trim()) return { emailSubject: 'Betreff ist erforderlich' };
    }
    return {};
  }

  async function handleNext() {
    const errs = validateStep();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});

    if (step === 2) {
      // Save everything
      setSaving(true);
      try {
        await apiClient.put('/api/shop', {
          googleReviewUrl: form.googleReviewUrl,
          emailFromName: form.emailFromName,
          emailSubject: form.emailSubject,
          emailDelay: parseInt(form.emailDelay, 10),
        });
        setStep(3);
      } catch (err) {
        toast.error('Speichern fehlgeschlagen: ' + err.message);
      } finally {
        setSaving(false);
      }
      return;
    }
    setStep(s => s + 1);
  }

  return (
    <div className="onboarding-wrapper">
      <div className="onboarding-card animate-scale-in">
        {/* Header */}
        <div className="onboarding-header">
          <div className="onboarding-logo">🌱</div>
          <div className="onboarding-title">Willkommen bei ReviewPulse</div>
          <div className="onboarding-subtitle">
            {isDone ? 'Alles eingerichtet!' : 'Einrichtung in 3 einfachen Schritten'}
          </div>

          {!isDone && (
            <>
              <div className="onboarding-progress" style={{ marginTop: 20 }}>
                <div
                  className="onboarding-progress-bar"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="onboarding-steps-dots">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className={`onboarding-dot${i === step ? ' active' : i < step ? ' done' : ''}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Body */}
        <div className="onboarding-body">
          {isDone ? (
            <div className="onboarding-success animate-fade-in">
              <div className="onboarding-success-icon">🎉</div>
              <div className="onboarding-success-title">Du bist startklar!</div>
              <div className="onboarding-success-text">
                ReviewPulse sendet ab sofort automatisch nach jedem abgeschlossenen Kauf
                eine Review-Anfrage an deine Kunden.
                <br /><br />
                Im Dashboard siehst du alle gesendeten Anfragen und die Klickrate.
              </div>
              <button className="btn btn-primary btn-lg w-full" onClick={onComplete}>
                Zum Dashboard →
              </button>
            </div>
          ) : (
            <>
              <div className="onboarding-step-label">{STEPS[step].label}</div>
              <div className="onboarding-step-title">{STEPS[step].title}</div>
              <div className="onboarding-step-desc">{STEPS[step].desc}</div>

              {/* Step 0: Google URL */}
              {step === 0 && (
                <div className="form-group">
                  <label className="form-label">Google Review URL</label>
                  <input
                    className={`input${errors.googleReviewUrl ? ' error' : ''}`}
                    type="url"
                    placeholder="https://g.page/r/DEIN_PLACE_ID/review"
                    autoComplete="off"
                    {...field('googleReviewUrl')}
                  />
                  {errors.googleReviewUrl && (
                    <div className="form-error">{errors.googleReviewUrl}</div>
                  )}
                  <div className="form-hint">
                    💡 Google Maps → Dein Unternehmen → "Rezension schreiben" → Link kopieren
                  </div>
                </div>
              )}

              {/* Step 1: Email */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Absendername</label>
                    <input
                      className={`input${errors.emailFromName ? ' error' : ''}`}
                      type="text"
                      placeholder="z.B. Das Team vom Blumenladen Meyer"
                      {...field('emailFromName')}
                    />
                    {errors.emailFromName && <div className="form-error">{errors.emailFromName}</div>}
                    <div className="form-hint">Wird im Posteingang deiner Kunden angezeigt</div>
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
              )}

              {/* Step 2: Delay */}
              {step === 2 && (
                <div className="form-group">
                  <label className="form-label">Email-Versandzeitpunkt</label>
                  <div className="select-wrapper">
                    <select className="select" {...field('emailDelay')}>
                      {DELAY_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-hint">
                    Nach dem Erstellen dieser Auftragserstellung wird die Email versandt.
                    24 Stunden geben dem Kunden genug Zeit, das Produkt zu erhalten.
                  </div>
                </div>
              )}

              <button
                className="btn btn-primary btn-lg w-full"
                style={{ marginTop: 24 }}
                onClick={handleNext}
                disabled={saving}
              >
                {saving
                  ? 'Wird gespeichert…'
                  : step === 2
                  ? 'Einrichtung abschließen'
                  : 'Weiter →'
                }
              </button>

              {step > 0 && (
                <button
                  className="btn btn-ghost w-full"
                  style={{ marginTop: 8 }}
                  onClick={() => setStep(s => s - 1)}
                  disabled={saving}
                >
                  ← Zurück
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
