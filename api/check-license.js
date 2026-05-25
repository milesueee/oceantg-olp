export default async function handler(req, res) {
  // Allow CORS from the extension
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { licenseKey } = req.query;

  if (!licenseKey) {
    return res.status(400).json({ valid: false, error: 'Missing licenseKey' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for better security on server-side

  try {
    const url = `${SUPABASE_URL}/rest/v1/licenses?key=eq.${encodeURIComponent(licenseKey)}&select=*`;
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await response.json();
    
    // Debug logging for Vercel logs
    console.log("License check for:", licenseKey);
    console.log("Supabase returned:", JSON.stringify(data));

    if (data && data.length > 0) {
      const license = data[0];
      const expiry = new Date(license.expiry_date);
      const now = new Date();

      if (license.active !== true) {
        return res.status(200).json({ valid: false, reason: 'License is inactive' });
      }

      if (expiry <= now) {
        return res.status(200).json({ valid: false, reason: 'License expired', expiry: license.expiry_date });
      }

      return res.status(200).json({ valid: true, expiry: license.expiry_date });
    } else {
      return res.status(200).json({ valid: false, reason: 'License key not found' });
    }
  } catch (e) {
    console.error("Supabase check error:", e);
    return res.status(500).json({ valid: false, error: 'Internal server error' });
  }

  return res.status(200).json({ valid: false });
}
