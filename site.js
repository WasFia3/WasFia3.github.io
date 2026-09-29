// Scroll reveal: fade sections in once as they enter the viewport.
const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  revealItems.forEach((el) => io.observe(el));
} else {
  revealItems.forEach((el) => el.classList.add('is-in'));
}

// Speech bubble: follows the character and reacts to her mood.
// Reads `currentState` from script.js (top-level `let`, shared between classic scripts).
const bubble = document.getElementById('bubble');
const heroCanvas = document.getElementById('animeCanvas');
if (bubble && heroCanvas) {
  const lines = {
    smileIntro: 'hi! want a drawing?',
    smileLoop: 'hi! want a drawing?',
    angry: 'hey! put me down!',
    dizzy: 'everything is spinning...'
  };
  let shownText = '';

  const place = () => {
    const r = heroCanvas.getBoundingClientRect();
    // her head sits around 42-55% across and 15% down the frame
    bubble.style.left = `${r.left + r.width * 0.5}px`;
    bubble.style.top = `${r.top + r.height * 0.2 - bubble.offsetHeight}px`;
  };

  const tick = () => {
    const state = typeof currentState === 'string' ? currentState : 'blink';
    const text = lines[state] || '';
    if (text !== shownText) {
      shownText = text;
      bubble.textContent = text;
      bubble.hidden = !text;
    }
    if (text) place();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Contact form: validate, then open the visitor's email app with the request filled in.
const form = document.getElementById('requestForm');
if (form) {
  const sentMsg = document.getElementById('sentMsg');

  const checks = [
    { input: form.elements.name, error: 'e-name', ok: (v) => v.trim().length > 0 },
    { input: form.elements.email, error: 'e-email', ok: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
    { input: form.elements.refs, error: 'e-refs', ok: (v) => v.trim() === '' || /^https?:\/\/\S+$/.test(v.trim()) },
    { input: form.elements.details, error: 'e-details', ok: (v) => v.trim().length > 0 }
  ];

  const validate = (check) => {
    const valid = check.ok(check.input.value);
    document.getElementById(check.error).hidden = valid;
    check.input.setAttribute('aria-invalid', valid ? 'false' : 'true');
    return valid;
  };

  checks.forEach((check) => {
    check.input.addEventListener('blur', () => { if (check.input.value) validate(check); });
    check.input.addEventListener('input', () => {
      if (check.input.getAttribute('aria-invalid') === 'true') validate(check);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const results = checks.map(validate);
    const firstBad = checks[results.indexOf(false)];
    if (firstBad) {
      firstBad.input.focus();
      return;
    }

    const data = new FormData(form);
    const service = data.get('service');
    const subject = `Commission request: ${service} (${data.get('name').trim()})`;
    const body = [
      `Service: ${service}`,
      `Name: ${data.get('name').trim()}`,
      `Email: ${data.get('email').trim()}`,
      `Deadline: ${data.get('deadline') || 'not set'}`,
      `Reference: ${data.get('refs').trim() || 'none'}`,
      '',
      data.get('details').trim()
    ].join('\n');

    window.location.href = `mailto:wasfia.s.awwad@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    form.hidden = true;
    sentMsg.hidden = false;
    sentMsg.focus();
  });

  document.getElementById('againBtn').addEventListener('click', () => {
    form.reset();
    form.hidden = false;
    sentMsg.hidden = true;
    form.elements.name.focus();
  });
}

// Side quests: fill chess ratings from data/chess.json (numbers only, no username).
const chessFields = document.querySelectorAll('[data-chess]');
if (chessFields.length) {
  fetch('data/chess.json', { cache: 'no-cache' })
    .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
    .then((data) => {
      const games = (m) => (m.wins || 0) + (m.losses || 0) + (m.draws || 0);
      const values = {
        'rapid.rating': data.rapid.rating,
        'rapid.best': data.rapid.best,
        'rapid.games': games(data.rapid).toLocaleString('en-US'),
        'blitz.rating': data.blitz.rating,
        'blitz.best': data.blitz.best,
        updated: new Date(data.updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      };
      chessFields.forEach((el) => {
        const v = values[el.dataset.chess];
        if (v !== undefined && v !== null) el.textContent = v;
      });
    })
    .catch(() => { /* keep the numbers already written in the HTML */ });
}

// Side quests TV: the watchlist buttons switch the channel.
const channelBtns = document.querySelectorAll('.channel-btn');
if (channelBtns.length) {
  const channels = document.querySelectorAll('.channel');
  channelBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      channelBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      channels.forEach((ch) => { ch.hidden = ch.dataset.channel !== btn.dataset.target; });
    });
  });
}
