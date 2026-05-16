/** @type {import('next').NextConfig} */
const nextConfig = {
  // Serve i file HTML statici da /public
  // Le API routes sono in /pages/api/
  reactStrictMode: true,
  // NOTA: i CORS header sono gestiti interamente in vercel.json
  // Non duplicarli qui altrimenti il browser vede Access-Control-Allow-Origin doppio e blocca la risposta.
};

module.exports = nextConfig;
