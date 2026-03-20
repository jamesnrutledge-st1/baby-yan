export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { prompt } = req.query;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      }
    );

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart) return res.status(500).json({ error: 'No image returned' });

    const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
    res.setHeader('Content-Type', imagePart.inlineData.mimeType || 'image/png');
    res.setHeader('Cache-Control', 's-maxage=86400');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
