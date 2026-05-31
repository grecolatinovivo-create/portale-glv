/** @type {import('next').NextConfig} */
const nextConfig = {
  // Serve i file HTML statici da /public
  // Le API routes sono in /pages/api/
  reactStrictMode: true,
  // NOTA: i CORS header sono gestiti interamente in vercel.json
  // Non duplicarli qui altrimenti il browser vede Access-Control-Allow-Origin doppio e blocca la risposta.

  // IMPORTANTE: forza l'inclusione degli asset dell'attestato (template PDF + font)
  // nel bundle serverless di Vercel. Senza questo, l'API di download fallisce in
  // produzione con ENOENT perché Next non traccia i file letti via fs.readFileSync.
  outputFileTracingIncludes: {
    '/api/progress/certificate/[courseId]': ['./lib/cert-assets/**'],
    '/api/admin/certificates': ['./lib/cert-assets/**'],
  },
};

module.exports = nextConfig;
