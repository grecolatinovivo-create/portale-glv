const { generateCertificate } = require('./lib/certificate');
generateCertificate({ studentName:'Lucia Ferrari', courseTitle:'Latino — livello A1.1', sofiaCode:'445566', startDate:new Date('2025-03-10'), endDate:new Date('2025-05-20'), hours:20, issueDate:new Date('2026-05-31') })
 .then(b=>{ require('fs').writeFileSync('/sessions/modest-fervent-fermi/tmp/att/test2.pdf', b); console.log('OK', b.length); })
 .catch(e=>console.log('ERR', e.code||'', (e.message||'').slice(0,100)));
