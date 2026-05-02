window.InitUserScripts = function()
{
var player = GetPlayer();
var object = player.object;
var once = player.once;
var addToTimeline = player.addToTimeline;
var setVar = player.SetVar;
var getVar = player.GetVar;
var update = player.update;
var pointerX = player.pointerX;
var pointerY = player.pointerY;
var showPointer = player.showPointer;
var hidePointer = player.hidePointer;
var slideWidth = player.slideWidth;
var slideHeight = player.slideHeight;
var getKeyDown = player.getKeyDown;
var keydown = player.keydown;
var keyup = player.keyup;
window.Script2 = function()
{
  // Horizontal accordion tabs for: Rectangle 1, Rectangle 2, Rectangle 3
// Collapsed tabs remain visible but dimmed; expanded tab is fully opaque and brought to front.

const tabs = [
  { name: 'Rectangle 1', obj: object('5reQCd6kNlm') },
  { name: 'Rectangle 2', obj: object('678CFEZhAZb') },
  { name: 'Rectangle 3', obj: object('6eZNAuSQy7B') }
];

// --- Config ---
// Width of collapsed (non-selected) tabs, in pixels
const collapsedW = 70;
// How quickly the animation eases to its target (higher = snappier)
const easeSpeed = 10;
// Opacity values (0-100)
const expandedOpacity = 100;
const collapsedOpacity = 35;

// --- Helpers ---
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Determine which tab is visually on top at start and use it as default open.
let selectedIndex = 0;
let maxDepth = -Infinity;
for (let i = 0; i < tabs.length; i++) {
  const d = tabs[i].obj.depth;
  if (d > maxDepth) {
    maxDepth = d;
    selectedIndex = i;
  }
}

// Base depth ordering (keep relative stacking stable, bring selected to front)
const baseDepths = tabs.map(t => t.obj.depth);
const topDepth = Math.max.apply(null, baseDepths) + 10;

// Cache initial geometry
const startX = tabs.map(t => t.obj.x);
const startY = tabs.map(t => t.obj.y);
const startW = tabs.map(t => t.obj.width);

// Total horizontal space currently occupied by the group.
// We’ll keep the overall span constant, based on initial positions and widths.
const minLeft = Math.min.apply(null, startX);
const maxRight = Math.max.apply(null, startX.map((x, i) => x + startW[i]));
const totalW = maxRight - minLeft;

// Expanded width is whatever is left after allocating collapsed widths to the other tabs
const expandedW = clamp(totalW - collapsedW * (tabs.length - 1), 80, totalW);

// Current animated values
const state = tabs.map((t, i) => ({
  x: t.obj.x,
  // “virtual width” we animate; Storyline API doesn’t set width directly,
  // so we emulate width changes by scaling from the original width.
  w: t.obj.width,
  opacity: t.obj.opacity
}));

// Set cursor and wire clicks
tabs.forEach((t, i) => {
  t.obj.style.cursor = 'pointer';
  t.obj.click(() => {
    selectedIndex = i;
    // Bring selected to front; keep others behind in stable order
    tabs.forEach((tt, ii) => {
      tt.obj.depth = (ii === selectedIndex) ? topDepth : baseDepths[ii];
    });
  });
});

// Layout targets each frame
update((time) => {
  // Compute target widths
  const targetW = tabs.map((t, i) => (i === selectedIndex ? expandedW : collapsedW));

  // Compute target X positions left-to-right, anchored to minLeft
  // Order by their original x so the visual left-to-right order matches the design.
  const order = tabs
    .map((t, i) => ({ i, x: startX[i] }))
    .sort((a, b) => a.x - b.x)
    .map(o => o.i);

  const targetX = new Array(tabs.length);
  let cursor = minLeft;
  for (let k = 0; k < order.length; k++) {
    const i = order[k];
    targetX[i] = cursor;
    cursor += targetW[i];
  }

  // Animate towards targets
  for (let i = 0; i < tabs.length; i++) {
    const t = tabs[i].obj;

    // Ease x
    state[i].x += (targetX[i] - state[i].x) / easeSpeed;
    t.x = state[i].x;

    // Ease width via scaleX relative to original width
    state[i].w += (targetW[i] - state[i].w) / easeSpeed;
    const sx = (state[i].w / startW[i]) * 100;
    t.scaleX = sx;

    // Keep y stable
    t.y = startY[i];

    // Ease opacity
    const targetOpacity = (i === selectedIndex) ? expandedOpacity : collapsedOpacity;
    state[i].opacity += (targetOpacity - state[i].opacity) / easeSpeed;
    t.opacity = state[i].opacity;
  }
});

}

};
