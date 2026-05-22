import https from 'https';

const SUPABASE_URL = 'reverseipdata.omega-connect.tech';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY0ODI3NjU5LCJleHAiOjIwODAxODc2NTl9.VA05oYHz3POmAxP7E6JaS1Df7GKGVnLD8-Ra6P29qx8';

const options = {
  hostname: SUPABASE_URL,
  path: '/rest/v1/societe?select=*&Pays=eq.Suisse&or=(Mail.is.null,Mail.eq.)&order=ID.asc',
  method: 'GET',
  headers: {
    'apikey'        : SUPABASE_KEY,
    'Authorization' : `Bearer ${SUPABASE_KEY}`,
    'Accept'        : 'application/json'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const rows = JSON.parse(data);
    console.log(`✅ ${rows.length} sociétés récupérées`);
    //console.log(rows);
  });
});