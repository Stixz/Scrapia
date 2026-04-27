// ⟡· Scrapia Mood System
// Maps themes → mood families → behavior multipliers

const MoodFamilies = {
  EMBER: "ember",
  GREMLIN: "gremlin",
  MINT: "mint",
  ARCANE: "arcane",
};

const ThemeToMood = {
  "baby-ember": MoodFamilies.EMBER,
  "blue-gremlin": MoodFamilies.GREMLIN,
  "mint-mischief": MoodFamilies.MINT,
  "arcane-scribble": MoodFamilies.ARCANE,
  "light": MoodFamilies.EMBER,
  "dark": MoodFamilies.EMBER,
};

// Behavior multipliers per mood family
const MoodProfiles = {
  [MoodFamilies.EMBER]: {
    name: "Baby Ember",
    baseline: "calm",
    flicker: 1.0,
    jitter: 0.8,
    wiggle: 1.0,
    scramble: 0.6,
    calmDecay: 1.0,
    panicRise: 0.8,
  },

  [MoodFamilies.GREMLIN]: {
    name: "Blue Gremlin",
    baseline: "anxious",
    flicker: 1.6,
    jitter: 1.4,
    wiggle: 1.3,
    scramble: 1.2,
    calmDecay: 1.4,
    panicRise: 1.6,
  },

  [MoodFamilies.MINT]: {
    name: "Mint Mischief",
    baseline: "calm",
    flicker: 0.8,
    jitter: 0.6,
    wiggle: 1.2,
    scramble: 0.5,
    calmDecay: 0.7,
    panicRise: 0.6,
  },

  [MoodFamilies.ARCANE]: {
    name: "Arcane Scribble",
    baseline: "bored",
    flicker: 1.2,
    jitter: 0.9,
    wiggle: 0.7,
    scramble: 0.9,
    calmDecay: 0.9,
    panicRise: 0.5,
  },
};

// Attach to engine
function applyMoodToEngine(engine, themeName) {
  const mood = ThemeToMood[themeName] || MoodFamilies.EMBER;
  const profile = MoodProfiles[mood];

  engine.currentMood = profile;

  // Optional: expose mood to CSS
  engine.rootEl.dataset.scrapiaMood = mood;

  return profile;
}
