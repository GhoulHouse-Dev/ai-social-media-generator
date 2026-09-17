import { buildSocialContentPrompt, parseSocialContentResponse, validateSocialContentRequest } from '../src/social-content.js';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  }
  if (!String(req.headers['content-type'] || '').includes('application/json')) {
    return json(res, 415, { ok: false, error: 'Unsupported media type' });
  }

  const validation = validateSocialContentRequest(req.body || {});
  if (!validation.ok) return json(res, 400, { ok: false, errors: validation.errors });
  if (!process.env.OPENAI_API_KEY) {
    console.error('Social content configuration missing: OPENAI_API_KEY');
    return json(res, 503, { ok: false, error: 'AI content generation is not configured.' });
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.8,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are a careful social media copywriter. Follow the requested JSON schema exactly.' },
          { role: 'user', content: buildSocialContentPrompt(validation.data) }
        ]
      })
    });
    if (!response.ok) {
      console.error('AI provider error', response.status, await response.text());
      return json(res, 502, { ok: false, error: 'Content generation failed. Please try again.' });
    }
    const body = await response.json();
    const content = body.choices?.[0]?.message?.content;
    if (!content) return json(res, 502, { ok: false, error: 'The AI provider returned no content.' });
    return json(res, 200, { ok: true, data: parseSocialContentResponse(content, validation.data.platforms), model: MODEL });
  } catch (error) {
    console.error('Social content generation error', error);
    return json(res, 502, { ok: false, error: 'Content generation failed. Please try again.' });
  }
}
