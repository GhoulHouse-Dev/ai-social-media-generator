import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSocialContentPrompt, parseSocialContentResponse, validateSocialContentRequest } from '../src/social-content.js';

test('validates tags, context, platforms, and preferences', () => {
  const result = validateSocialContentRequest({
    imageTags: ['team', 'product'],
    projectContext: 'An update for customers.',
    platforms: ['instagram', 'linkedin'],
    preferences: { tone: 'friendly', language: 'en' }
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.data.platforms, ['instagram', 'linkedin']);
});

test('rejects empty context and unknown values', () => {
  const result = validateSocialContentRequest({ platforms: ['tiktok'], preferences: { tone: 'secret' } });
  assert.equal(result.ok, false);
  assert.ok(result.errors.context);
  assert.ok(result.errors.platforms);
  assert.ok(result.errors.tone);
});

test('builds a prompt containing project context and constraints', () => {
  const result = validateSocialContentRequest({ imageTags: ['team'], projectContext: 'Spring launch' });
  const prompt = buildSocialContentPrompt(result.data);
  assert.match(prompt, /Spring launch/);
  assert.match(prompt, /exactly 3 caption options/);
  assert.match(prompt, /engaging questions/);
});

test('normalizes provider JSON into bounded content', () => {
  const result = parseSocialContentResponse(JSON.stringify({
    captions: { instagram: [{ text: 'Hello!', angle: 'intro' }, { text: 'Another' }, { text: 'Third' }, { text: 'Extra' }] },
    hashtags: ['marketing', '#launch'],
    engagementPrompts: ['What do you think?']
  }), ['instagram']);
  assert.equal(result.captions.instagram.length, 3);
  assert.deepEqual(result.hashtags, ['#marketing', '#launch']);
});
