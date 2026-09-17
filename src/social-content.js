const PLATFORMS = new Set(['instagram', 'facebook', 'linkedin']);
const TONES = new Set(['professional', 'friendly', 'playful', 'authoritative', 'minimal', 'inspiring']);
const MAX_TAGS = 30;
const MAX_CONTEXT = 4000;

function text(value, maxLength) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function list(value, maxItems, maxLength = 80) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => text(item, maxLength)).filter(Boolean).slice(0, maxItems);
}

export function validateSocialContentRequest(input = {}) {
  const requestedPlatforms = list(input.platforms, 3, 20).map((value) => value.toLowerCase());
  const platforms = requestedPlatforms.length ? requestedPlatforms : ['instagram', 'facebook', 'linkedin'];
  const tone = text(input.preferences?.tone || input.tone || 'professional', 40).toLowerCase();
  const data = {
    imageTags: list(input.imageTags || input.tags, MAX_TAGS),
    projectContext: text(input.projectContext || input.context, MAX_CONTEXT),
    platforms: [...new Set(platforms)],
    preferences: {
      tone,
      language: text(input.preferences?.language || input.language || 'en', 20),
      audience: text(input.preferences?.audience || input.audience, 300),
      brandTerms: list(input.preferences?.brandTerms, 20, 80),
      avoid: list(input.preferences?.avoid, 20, 120)
    }
  };

  const errors = {};
  if (!data.imageTags.length && !data.projectContext) errors.context = 'Add image tags or project context.';
  if (data.platforms.some((platform) => !PLATFORMS.has(platform))) errors.platforms = 'Unsupported platform.';
  if (!TONES.has(data.preferences.tone)) errors.tone = 'Unsupported tone.';
  return { ok: Object.keys(errors).length === 0, data, errors };
}

export function buildSocialContentPrompt(data) {
  const { preferences } = data;
  return `Create social media copy from the supplied image tags and project context. Do not invent facts, claims, prices, locations, people, or results that are not supported by the input.

Return JSON only with this shape:
{"captions":{"instagram":[{"text":"...","angle":"..."}],"facebook":[{"text":"...","angle":"..."}],"linkedin":[{"text":"...","angle":"..."}]},"hashtags":["#..."],"engagementPrompts":["..."],"contentNotes":["..."]}

Requirements:
- Generate exactly 3 caption options for every requested platform: ${data.platforms.join(', ')}.
- Make each platform distinct: Instagram is concise and visual, Facebook is conversational, LinkedIn is useful and professional.
- Suggest 8-12 relevant hashtags, mixing broad and specific terms. Hashtags must begin with # and contain no spaces.
- Provide 4 engaging questions or calls to action.
- Write in ${preferences.language}; use a ${preferences.tone} tone.
- Target audience: ${preferences.audience || 'the intended audience for this project'}.
- Include brand terms where natural: ${preferences.brandTerms.join(', ') || 'none'}.
- Avoid: ${preferences.avoid.join(', ') || 'unsupported claims and generic filler'}.

Image tags: ${data.imageTags.join(', ') || 'none'}
Project context: ${data.projectContext || 'none'}`;
}

function cleanResult(result, platforms) {
  const captions = {};
  for (const platform of platforms) {
    const options = Array.isArray(result?.captions?.[platform]) ? result.captions[platform] : [];
    captions[platform] = options.map((option) => ({
      text: text(option?.text, 1200),
      angle: text(option?.angle, 120)
    })).filter((option) => option.text).slice(0, 3);
  }
  return {
    captions,
    hashtags: list(result?.hashtags, 12, 60).map((tag) => tag.startsWith('#') ? tag : `#${tag.replace(/^#+/, '')}`),
    engagementPrompts: list(result?.engagementPrompts, 4, 300),
    contentNotes: list(result?.contentNotes, 6, 300)
  };
}

export function parseSocialContentResponse(value, platforms) {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  return cleanResult(parsed, platforms);
}

export { PLATFORMS, TONES };
