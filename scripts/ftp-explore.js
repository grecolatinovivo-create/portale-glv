require('dotenv').config();
const ftp = require('basic-ftp');
const BASE = '/www.latin-cert.org/classroomresources';

async function list(client, dir) {
  try { return await client.list(dir); } catch { return null; }
}

async function main() {
  const client = new ftp.Client();
  client.ftp.verbose = false;
  await client.access({ host: 'ftp.latin-cert.org', port: 21, user: '7686675@aruba.it', password: process.env.FTP_PASSWORD, secure: false });

  // Tutti gli IDCR presenti
  const all = await list(client, BASE);
  console.log(`\nIDCR presenti in classroomresources (${all.length} totali):`);
  console.log(all.map(f => f.name).join(', '));

  // Esplora IDCR 13 in profondità
  const idlList = await list(client, `${BASE}/13`);
  console.log(`\nIDL dentro IDCR 13 (prime 10): ${idlList?.slice(0,10).map(f=>f.name).join(', ')}`);

  if (idlList?.length) {
    const firstIdl = idlList[0].name;
    const lvl2 = await list(client, `${BASE}/13/${firstIdl}`);
    console.log(`\nContenuto di IDCR 13 / IDL ${firstIdl}:`, lvl2?.map(f=>`[${f.type===2?'dir':'file'}] ${f.name}`).join('\n  '));

    // Se c'è una sottocartella, scendi ancora
    for (const item of lvl2 || []) {
      const lvl3 = await list(client, `${BASE}/13/${firstIdl}/${item.name}`);
      if (lvl3?.length) {
        console.log(`\nContenuto di ${firstIdl}/${item.name}:`, lvl3.map(f=>`[${f.type===2?'dir':'file'}] ${f.name}`).join('\n  '));
      }
    }
  }

  client.close();
}
main().catch(console.error);
