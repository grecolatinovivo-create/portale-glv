// pages/verifica/[certCode].js — Pagina pubblica di verifica autenticità attestato
// Nessuna autenticazione richiesta.
// URL: /verifica/GLV-2025-A3B7F2C1

import Head from 'next/head';

export async function getServerSideProps(context) {
  const { certCode } = context.params;

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (context.req
        ? `https://${context.req.headers.host}`
        : 'https://portale.grecolatinovivo.it');

    const res = await fetch(`${baseUrl}/api/verify/${encodeURIComponent(certCode)}`);
    const data = await res.json();

    return { props: { certCode, data } };
  } catch {
    return {
      props: {
        certCode,
        data: { valid: false, error: 'Errore di connessione. Riprova più tardi.' },
      },
    };
  }
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function VerificaAttestatoPagina({ certCode, data }) {
  const valid = data?.valid === true;
  const revoked = data?.revoked === true;

  return (
    <>
      <Head>
        <title>Verifica Attestato — GrecoLatinoVivo</title>
        <meta name="robots" content="noindex" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #0a0a0a;
          color: #f5f5f5;
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .verify-card {
          background: #141414;
          border: 1px solid #2a2a2a;
          border-radius: 10px;
          padding: 48px 40px;
          width: 100%;
          max-width: 520px;
          text-align: center;
        }
        .verify-logo {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          color: #c9a84c;
          letter-spacing: 0.06em;
          margin-bottom: 36px;
        }
        .verify-logo span {
          display: block;
          font-size: 10px;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(245,245,245,.45);
          margin-top: 4px;
        }
        .verify-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
        .verify-status {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .verify-status.valid   { color: #3db05b; }
        .verify-status.invalid { color: #e05a6a; }
        .verify-desc {
          font-size: 14px;
          color: rgba(245,245,245,.55);
          margin-bottom: 32px;
          line-height: 1.6;
        }
        .verify-table {
          background: #1e1e1e;
          border: 1px solid #2a2a2a;
          border-radius: 6px;
          padding: 20px 24px;
          text-align: left;
          margin-bottom: 28px;
        }
        .verify-row {
          display: flex;
          flex-direction: column;
          margin-bottom: 16px;
        }
        .verify-row:last-child { margin-bottom: 0; }
        .verify-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(245,245,245,.4);
          margin-bottom: 3px;
        }
        .verify-value {
          font-size: 15px;
          font-weight: 600;
          color: #f5f5f5;
        }
        .verify-code {
          font-size: 12px;
          color: rgba(245,245,245,.4);
          margin-top: 20px;
          letter-spacing: 0.05em;
        }
        .verify-footer {
          margin-top: 48px;
          font-size: 11px;
          color: rgba(245,245,245,.25);
          letter-spacing: 0.05em;
        }
        @media (max-width: 560px) {
          .verify-card { padding: 32px 20px; }
        }
      `}</style>

      <div className="verify-card">
        <div className="verify-logo">
          GrecoLatinoVivo
          <span>Portale di Studi Classici</span>
        </div>

        {valid && !revoked ? (
          <>
            <div className="verify-icon">✅</div>
            <div className="verify-status valid">Attestato valido</div>
            <p className="verify-desc">
              Questo documento è autentico e risulta nei registri ufficiali di GrecoLatinoVivo.
            </p>

            <div className="verify-table">
              <div className="verify-row">
                <span className="verify-label">Studente</span>
                <span className="verify-value">{data.studentName}</span>
              </div>
              <div className="verify-row">
                <span className="verify-label">Corso</span>
                <span className="verify-value">{data.courseTitle}</span>
              </div>
              {(data.courseLang || data.courseLevel) && (
                <div className="verify-row">
                  <span className="verify-label">Lingua / Livello</span>
                  <span className="verify-value">
                    {[data.courseLang, data.courseLevel].filter(Boolean).join(' · ')}
                  </span>
                </div>
              )}
              <div className="verify-row">
                <span className="verify-label">Data di emissione</span>
                <span className="verify-value">{fmtDate(data.issuedAt)}</span>
              </div>
            </div>

            <div className="verify-code">Codice: {data.certCode}</div>
          </>
        ) : revoked ? (
          <>
            <div className="verify-icon">⚠️</div>
            <div className="verify-status invalid">Attestato revocato</div>
            <p className="verify-desc">
              Questo attestato è stato revocato
              {data.revokedAt ? ` il ${fmtDate(data.revokedAt)}` : ''}.
            </p>
          </>
        ) : (
          <>
            <div className="verify-icon">❌</div>
            <div className="verify-status invalid">Attestato non trovato</div>
            <p className="verify-desc">
              {data?.error ||
                'Il codice inserito non corrisponde ad alcun attestato nei nostri registri. Verifica di aver copiato correttamente il codice.'}
            </p>
            <div className="verify-code">Codice cercato: {certCode}</div>
          </>
        )}
      </div>

      <div className="verify-footer">portale.grecolatinovivo.it</div>
    </>
  );
}
