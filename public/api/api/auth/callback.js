export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`/?error=${error}`);
  }

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.APP_URL}/api/auth/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();

    if (tokens.error) {
      return res.redirect(`/?error=${tokens.error}`);
    }

    // Redirect with tokens in URL fragment (never logged by servers)
    const params = new URLSearchParams({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || '',
      expires_in: tokens.expires_in || 3600,
    });

    return res.redirect(`/?tokens=${encodeURIComponent(params.toString())}`);
  } catch (err) {
    return res.redirect(`/?error=token_exchange_failed`);
  }
}
