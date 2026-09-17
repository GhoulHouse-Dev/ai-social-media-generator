const form = document.querySelector('#content-form');
const results = document.querySelector('#results');
const status = document.querySelector('#form-status');
const submit = form.querySelector('button[type="submit"]');
const copyAll = document.querySelector('#copy-all');

const sample = {
  imageTags: 'behind the scenes, team, product, natural light',
  projectContext: 'A small team is preparing a new product launch. We want to celebrate the people behind the work and invite our community to follow along.',
  tone: 'friendly', language: 'en', audience: 'existing customers and curious new followers',
  brandTerms: 'Example Co', avoid: 'unverified claims'
};

document.querySelector('#sample-button').addEventListener('click', () => {
  document.querySelector('#image-tags').value = sample.imageTags;
  document.querySelector('#project-context').value = sample.projectContext;
  document.querySelector('#tone').value = sample.tone;
  document.querySelector('#language').value = sample.language;
  document.querySelector('#audience').value = sample.audience;
  document.querySelector('#brand-terms').value = sample.brandTerms;
  document.querySelector('#avoid').value = sample.avoid;
  status.textContent = 'Sample inputs loaded.';
  status.className = 'form-status success';
});

function values(selector) {
  return [...document.querySelectorAll(selector)].map((field) => field.value.trim()).filter(Boolean);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character]));
}

function captionCard(option) {
  return `<article class="caption-card"><button class="copy-button" type="button" data-copy="${escapeHtml(option.text)}" aria-label="Copy caption">Copy</button><p>${escapeHtml(option.text)}</p><small>${escapeHtml(option.angle || 'Suggested angle')}</small></article>`;
}

function render(data) {
  const sections = Object.entries(data.captions || {}).map(([platform, options]) => `<section class="result-section"><h3>${escapeHtml(platform)} · caption options</h3>${options.map(captionCard).join('')}</section>`).join('');
  const tags = (data.hashtags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
  const prompts = (data.engagementPrompts || []).map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join('');
  const notes = (data.contentNotes || []).map((note) => `<li>${escapeHtml(note)}</li>`).join('');
  results.className = 'results-content';
  results.innerHTML = `${sections}<section class="result-section"><h3>Hashtags</h3><div class="tag-list">${tags || '<span class="notes">No hashtags returned.</span>'}</div></section><section class="result-section"><h3>Questions & calls to action</h3><ol class="prompt-list">${prompts || '<li>No prompts returned.</li>'}</ol></section>${notes ? `<section class="result-section"><h3>Content notes</h3><ul class="prompt-list notes">${notes}</ul></section>` : ''}`;
  copyAll.hidden = false;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const platforms = values('input[name="platforms"]:checked');
  if (!platforms.length) { status.textContent = 'Select at least one platform.'; status.className = 'form-status error'; return; }
  const payload = {
    imageTags: values('#image-tags')[0]?.split(',').map((tag) => tag.trim()).filter(Boolean) || [],
    projectContext: document.querySelector('#project-context').value.trim(),
    platforms,
    preferences: {
      tone: document.querySelector('#tone').value,
      language: document.querySelector('#language').value.trim() || 'en',
      audience: document.querySelector('#audience').value.trim(),
      brandTerms: values('#brand-terms')[0]?.split(',').map((term) => term.trim()).filter(Boolean) || [],
      avoid: values('#avoid')[0]?.split(',').map((term) => term.trim()).filter(Boolean) || []
    }
  };
  submit.disabled = true; submit.querySelector('span').textContent = 'Generating…'; status.textContent = 'The AI is shaping your content set…'; status.className = 'form-status';
  try {
    const response = await fetch('/api/social-content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || Object.values(body.errors || {})[0] || 'Generation failed.');
    render(body.data); status.textContent = 'Content generated successfully.'; status.className = 'form-status success';
  } catch (error) { status.textContent = error.message; status.className = 'form-status error'; }
  finally { submit.disabled = false; submit.querySelector('span').textContent = 'Generate content'; }
});

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-copy]');
  if (!button) return;
  await navigator.clipboard.writeText(button.dataset.copy);
  button.textContent = 'Copied'; setTimeout(() => { button.textContent = 'Copy'; }, 1200);
});

copyAll.addEventListener('click', async () => {
  const text = [...results.querySelectorAll('.caption-card p')].map((item) => item.textContent).join('\n\n');
  if (!text) return;
  await navigator.clipboard.writeText(text);
  copyAll.textContent = 'Copied'; setTimeout(() => { copyAll.textContent = 'Copy all'; }, 1200);
});
