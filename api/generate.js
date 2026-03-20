export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { prompt, seed } = req.query;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const response = await fetch('https://api.together.xyz/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-schnell-Free',
        prompt,
        width: 512,
        height: 512,
        steps: 4,
        n: 1,
        seed: seed ? parseInt(seed) : undefined,
        response_format: 'b64_json',
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const b64 = data.data?.[0]?.b64_json;
    if (!b64) return res.status(500).json({ error: 'No image returned' });

    const buffer = Buffer.from(b64, 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 's-maxage=86400');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
