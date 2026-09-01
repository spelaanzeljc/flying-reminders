'use strict';

const ASSETS = '../../assets/characters/';
const SCALE = 0.8;

// text.left/top are relative to the banner's own box (the text block is a
// DOM child of banner-wrap), centered in the banner's own width — not
// biased toward the notched tail end the way the reference art was.
const SCENES = {
  dog: {
    character: { src: 'dog-character.png', left: 0, top: 0, width: 272, height: 272 },
    banner: { src: 'dog-banner.png', left: 132, top: 18, width: 629, height: 99 },
    text: { left: 148, top: 5, width: 333, height: 91, titleColor: '#fbefd9', subtitleColor: '#8fd8b0' },
    // Dog's notch/tail is the right edge (rope attaches on the left) — the
    // notch only cuts into the mid-height band, so near the top edge stays
    // solid all the way out to the tail. (Positions here are rig-absolute,
    // like banner.left/top — not relative to the banner box.)
    dismiss: { left: 716, top: 26 },
    dust: [
      { left: 246, bottom: 12, size: 20, opacity: 0.16, delay: 0 },
      { left: 238, bottom: 22, size: 13, opacity: 0.12, delay: 0.6 }
    ],
    dustDir: 'right'
  },
  cat: {
    character: { src: 'cat-character.png', left: 461, top: 0, width: 272, height: 272 },
    banner: { src: 'cat-banner.png', left: 0, top: 87, width: 541, height: 99 },
    text: { left: 111, top: 4, width: 320, height: 91, titleColor: '#3b1a16', subtitleColor: '#2e9e63' },
    // Cat's notch/tail is the left edge (rope attaches on the right).
    dismiss: { left: 20, top: 95 },
    dust: [
      { left: 452, bottom: 12, size: 20, opacity: 0.14, delay: 0 },
      { left: 460, bottom: 22, size: 13, opacity: 0.1, delay: 0.6 }
    ],
    dustDir: 'left'
  },
  raccoon: {
    character: { src: 'raccoon-character.png', left: 0, top: 0, width: 301, height: 272 },
    banner: { src: 'raccoon-banner.png', left: 271, top: 46, width: 804, height: 126 },
    text: { left: 192, top: 5, width: 420, height: 116, titleColor: '#ffffff', subtitleColor: '#e8c468' },
    // Raccoon's notch/tail is the right edge (rope attaches at the goose's
    // beak, on the left) — same side pattern as the dog.
    dismiss: { left: 1030, top: 54 },
    // No dust — it's flying, not rolling on the ground.
    dust: [],
    dustDir: 'right'
  }
};

function el(tag, props) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  return node;
}

// All rig coordinates above are authored at the reference's original
// scale; this shrinks every position/size passed through it uniformly.
function px(n) {
  return `${n * SCALE}px`;
}

function buildScene(character, data, stage, speedFactor) {
  const scene = SCENES[character];

  const charImg = el('img', { src: ASSETS + scene.character.src, className: 'character' });
  Object.assign(charImg.style, {
    left: px(scene.character.left), top: px(scene.character.top),
    width: px(scene.character.width), height: px(scene.character.height),
    transformOrigin: '50% 92%',
    animationDuration: `${1.5 * speedFactor}s`
  });

  const bannerWrap = el('div', { className: 'banner-wrap' });
  Object.assign(bannerWrap.style, {
    left: px(scene.banner.left), top: px(scene.banner.top),
    width: px(scene.banner.width), height: px(scene.banner.height),
    transformOrigin: scene.dustDir === 'left' ? '100% 50%' : '0% 50%',
    animationDuration: `${2.2 * speedFactor}s`
  });
  const bannerImg = el('img', { src: ASSETS + scene.banner.src });
  Object.assign(bannerImg.style, { inset: 0, width: '100%', height: '100%' });
  bannerWrap.appendChild(bannerImg);

  const textBlock = el('div', { className: 'text-block' });
  Object.assign(textBlock.style, {
    left: px(scene.text.left), top: px(scene.text.top),
    width: px(scene.text.width), height: px(scene.text.height),
    alignItems: 'center', textAlign: 'center'
  });
  const title = el('div', { className: 'title', textContent: data.label || 'Log your hours' });
  title.style.color = scene.text.titleColor;
  const subtitle = el('div', {
    className: 'subtitle',
    textContent: data.hasUrl ? 'Click to open your link' : 'Click to dismiss'
  });
  subtitle.style.color = scene.text.subtitleColor;
  textBlock.appendChild(title);
  textBlock.appendChild(subtitle);
  bannerWrap.appendChild(textBlock);

  stage.appendChild(bannerWrap);
  stage.appendChild(charImg);

  const dismiss = document.getElementById('dismiss');
  dismiss.style.left = px(scene.dismiss.left);
  dismiss.style.top = px(scene.dismiss.top);
  dismiss.style.right = 'auto';

  for (const d of scene.dust) {
    const dust = el('div', { className: `dust ${scene.dustDir === 'right' ? 'right' : ''}`.trim() });
    Object.assign(dust.style, {
      left: px(d.left), bottom: px(d.bottom),
      width: px(d.size), height: px(d.size),
      background: `rgba(59, 26, 22, ${d.opacity})`,
      animationDuration: `${1.2 * speedFactor}s`,
      animationDelay: `${d.delay * speedFactor}s`
    });
    stage.appendChild(dust);
  }
}

function buildAlien(data, stage, durationMs, speedFactor) {
  const hoverGroup = el('div', { className: 'hover-group' });
  hoverGroup.style.animationDuration = `${3.2 * speedFactor}s`;

  const shipImg = el('img', { src: ASSETS + 'alien-ship.png' });
  Object.assign(shipImg.style, { left: px(6), top: px(0), width: px(513), height: px(415) });

  const trapezoid = el('img', { src: ASSETS + 'alien-banner.png', className: 'trapezoid' });
  Object.assign(trapezoid.style, { left: px(87), top: px(414), width: px(391), height: px(118) });

  const textBlock = el('div', { className: 'text-block alien-text' });
  Object.assign(textBlock.style, { left: px(140), top: px(428), width: px(285), alignItems: 'center', textAlign: 'center' });
  const title = el('div', { className: 'title', textContent: data.label || 'Log your hours' });
  title.style.color = '#3b1a16';
  const subtitle = el('div', {
    className: 'subtitle',
    textContent: data.hasUrl ? 'Click to open your link' : 'Click to dismiss'
  });
  subtitle.style.color = '#4a66e8';
  textBlock.appendChild(title);
  textBlock.appendChild(subtitle);

  const twinkleA = el('div', { className: 'twinkle', textContent: '✦' });
  Object.assign(twinkleA.style, { left: px(24), top: px(60), animationDelay: '0s' });
  const twinkleB = el('div', { className: 'twinkle', textContent: '✦' });
  Object.assign(twinkleB.style, { left: px(470), top: px(110), animationDelay: '0.7s' });

  // Anchored to the trapezoid's widest (bottom) band, inside hoverGroup so
  // it bobs together with the ship/banner instead of drifting apart.
  const dismiss = document.getElementById('dismiss');
  dismiss.style.left = px(272);
  dismiss.style.top = px(506);
  dismiss.style.right = 'auto';

  hoverGroup.appendChild(shipImg);
  hoverGroup.appendChild(trapezoid);
  hoverGroup.appendChild(textBlock);
  hoverGroup.appendChild(dismiss);
  stage.appendChild(twinkleA);
  stage.appendChild(twinkleB);
  stage.appendChild(hoverGroup);

  // Sync the banner unfurl to the same hold window the main process uses
  // for the ship's there-and-back travel curve (see windows.js THERE_AND_BACK_CURVE).
  const revealAt = durationMs * 0.36;
  const hideAt = durationMs * 0.78;
  setTimeout(() => {
    trapezoid.classList.add('revealed');
    textBlock.classList.add('revealed');
  }, revealAt);
  setTimeout(() => {
    trapezoid.classList.remove('revealed');
    textBlock.classList.remove('revealed');
  }, hideAt);
}

window.bannerApi.onInit((data) => {
  const stage = document.getElementById('stage');
  const durationMs = data.durationMs || 9000;
  // How much slower/faster the character's own wobble/wave/dust animations
  // run, relative to the 'normal' speed baseline — so a slow banner doesn't
  // just travel slower while still skating at the same frantic tempo.
  const speedFactor = durationMs / 9000;
  if (data.character === 'alien') {
    buildAlien(data, stage, durationMs, speedFactor);
  } else {
    const key = SCENES[data.character] ? data.character : 'cat';
    buildScene(key, data, stage, speedFactor);
  }
});

document.getElementById('rig').addEventListener('click', (event) => {
  if (event.target.id === 'dismiss') return;
  window.bannerApi.click();
});

document.getElementById('dismiss').addEventListener('click', (event) => {
  event.stopPropagation();
  window.bannerApi.dismiss();
});
