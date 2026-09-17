# AI Social Media Generator

An AI-powered module for generating platform-specific social media copy from tagged image elements and project context.

## Features

- Three caption options per requested platform: Instagram, Facebook, and LinkedIn.
- Relevant hashtag suggestions.
- Audience questions and calls to action for engagement.
- Client-controlled tone, language, audience, brand terms, and words to avoid.
- Server-side AI provider integration so API keys are never exposed to clients.
- Input validation and bounded response normalization.

## API

`POST /api/social-content`

```json
{
  "imageTags": ["product", "team", "office"],
  "projectContext": "A behind-the-scenes launch update for customers.",
  "platforms": ["instagram", "facebook", "linkedin"],
  "preferences": {
    "tone": "friendly",
    "language": "en",
    "audience": "existing customers",
    "brandTerms": ["Example Co"],
    "avoid": ["unverified claims"]
  }
}
```

The response contains three caption options per requested platform, hashtag suggestions, engagement prompts, and content notes. Supported tones are `professional`, `friendly`, `playful`, `authoritative`, `minimal`, and `inspiring`.

## Configuration

Set `OPENAI_API_KEY` in the deployment environment. `OPENAI_MODEL` defaults to `gpt-4o-mini`; `OPENAI_API_URL` can point to another OpenAI-compatible chat-completions endpoint. The API key is only used server-side.

## Development

```bash
npm test
```
