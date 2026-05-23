export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const accessToken = authHeader.replace('Bearer ', '');

  if (req.method === 'GET') {
    // List upcoming events
    const now = new Date().toISOString();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    try {
      const r = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${future}&singleEvents=true&orderBy=startTime&maxResults=20`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await r.json();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch events' });
    }

  } else if (req.method === 'POST') {
    // Create event
    const { title, date, time, description } = req.body;
    if (!title || !date) return res.status(400).json({ error: 'Missing fields' });

    let start, end;
    if (time) {
      start = { dateTime: `${date}T${time}:00`, timeZone: 'America/Sao_Paulo' };
      const [h, m] = time.split(':').map(Number);
      const endH = String(h + 1).padStart(2, '0');
      end = { dateTime: `${date}T${endH}:${String(m).padStart(2,'0')}:00`, timeZone: 'America/Sao_Paulo' };
    } else {
      start = { date };
      end = { date };
    }

    try {
      const r = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ summary: title, description, start, end }),
        }
      );
      const data = await r.json();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: 'Failed to create event' });
    }

  } else {
    res.status(405).end();
  }
}
