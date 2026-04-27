// ⟡· Scrapia Behavior Engine
// Scrapia — Scrappy's Baby Bro.! (Note Gremlin)

const ScrapiaStates = {
  CALM: "calm",
  BORED: "bored",
  ANXIOUS: "anxious",
  PANIC: "panic",
};

class ScrapiaEngine {
  constructor(options = {}) {
    this.editorEl = options.editorEl;          // main text area / content div
    this.rootEl = options.rootEl || document.body; // window root for global effects
    this.idleMs = options.idleMs || 45_000;    // time before boredom
    this.tickMs = options.tickMs || 2_000;     // engine tick
    this.state = ScrapiaStates.CALM;
    this.lastActivity = Date.now();
    this.timer = null;
    this.isActive = true;                      // window focus / safety
    this.effectsEnabled = true;                // master kill switch
    this.currentMood = {                       // mood multipliers
      flicker: 1.0,
      jitter: 1.0,
      wiggle: 1.0,
      scramble: 1.0,
      calmDecay: 1.0,
      panicRise: 1.0
    };
    this.mintPack = null;                      // Mint Mischief pack
    this.currentTheme = 'light';               // Track current theme
    this.convo = null;                         // Conversation engine reference
    this._bindEvents();
  }

  _bindEvents() {
    if (!this.editorEl) return;

    const resetActivity = () => this._onActivity();

    this.editorEl.addEventListener("input", resetActivity);
    this.editorEl.addEventListener("click", resetActivity);
    this.editorEl.addEventListener("keydown", resetActivity);

    window.addEventListener("focus", () => {
      this.isActive = true;
      this._onActivity();
    });

    window.addEventListener("blur", () => {
      this.isActive = false;
      this._setState(ScrapiaStates.CALM);
      this._clearEffects();
    });
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this._tick(), this.tickMs);
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
    this._setState(ScrapiaStates.CALM);
    this._clearEffects();
  }

  setEffectsEnabled(enabled) {
    this.effectsEnabled = enabled;
    if (!enabled) {
      this._clearEffects();
    }
  }

  _onActivity() {
    this.lastActivity = Date.now();
    this._setState(ScrapiaStates.CALM);
    this._clearEffects();
  }

  _tick() {
    if (!this.effectsEnabled || !this.isActive) return;
    if (!this.editorEl) return;

    const idleFor = Date.now() - this.lastActivity;
    const m = this.currentMood || { calmDecay: 1, panicRise: 1 };

    // State transitions based on idle time (using mood multipliers)
    if (idleFor < this.idleMs) {
      this._setState(ScrapiaStates.CALM);
      return;
    } else if (idleFor < this.idleMs * (1.7 * m.calmDecay)) {
      this._setState(ScrapiaStates.BORED);
    } else if (idleFor < this.idleMs * (2.4 * m.calmDecay * m.panicRise)) {
      this._setState(ScrapiaStates.ANXIOUS);
    } else {
      this._setState(ScrapiaStates.PANIC);
    }

    // Trigger micro‑events based on state
    this._runStateEffects();
  }

  _setState(newState) {
    if (this.state === newState) return;
    this.state = newState;
    this.rootEl.dataset.scrapiaState = newState; // for CSS hooks if desired
  }

  _runStateEffects() {
    const m = this.currentMood || { flicker: 1, jitter: 1, wiggle: 1, scramble: 1 };

    // Mint Mischief special effects
    if (this.currentMood && this.currentMood.name === "Mint Mischief" && this.mintPack) {
      this._maybe(0.35 * m.flicker, () => this.mintPack.triggerRandom());
    }

    switch (this.state) {
      case ScrapiaStates.BORED:
        this._maybe(0.35 * m.flicker, () => this._flickerScreen("scrapia-flicker-soft"));
        this._maybe(0.25 * m.wiggle, () => this._wiggleEditor("scrapia-wiggle-soft"));
        break;

      case ScrapiaStates.ANXIOUS:
        this._maybe(0.55 * m.flicker, () => this._flickerScreen("scrapia-flicker-mid"));
        this._maybe(0.45 * m.jitter, () => this._jitterText());
        this._maybe(0.25 * m.wiggle, () => this._wiggleEditor("scrapia-wiggle-mid"));
        break;

      case ScrapiaStates.PANIC:
        this._maybe(0.75 * m.flicker, () => this._flickerScreen("scrapia-flicker-hard"));
        this._maybe(0.65 * m.scramble, () => this._scrambleTextBriefly());
        this._maybe(0.40 * m.wiggle, () => this._wiggleEditor("scrapia-wiggle-hard"));
        break;

      default:
        break;
    }
  }

  _maybe(prob, fn) {
    if (Math.random() < prob) fn();
  }

  // ---- EFFECTS -------------------------------------------------------------

  _flickerScreen(className) {
    this.rootEl.classList.add(className);
    setTimeout(() => this.rootEl.classList.remove(className), 180);
  }

  _wiggleEditor(className) {
    if (!this.editorEl) return;
    this.editorEl.classList.add(className);
    setTimeout(() => this.editorEl.classList.remove(className), 220);
  }

  _jitterText() {
    if (!this.editorEl) return;
    this.editorEl.classList.add("scrapia-text-jitter");
    setTimeout(() => this.editorEl.classList.remove("scrapia-text-jitter"), 260);
  }

  _scrambleTextBriefly() {
    if (!this.editorEl) return;
    const el = this.editorEl;
    const original = el.value;
    if (!original || original.length < 4) return;

    const chars = original.split("");
    const scrambled = [...chars];

    // light scramble, not full chaos
    for (let i = 0; i < Math.min(12, scrambled.length); i++) {
      const a = Math.floor(Math.random() * scrambled.length);
      const b = Math.floor(Math.random() * scrambled.length);
      [scrambled[a], scrambled[b]] = [scrambled[b], scrambled[a]];
    }

    el.value = scrambled.join("");

    setTimeout(() => {
      el.value = original;
    }, 260);
  }

  _clearEffects() {
    this.rootEl.classList.remove(
      "scrapia-flicker-soft",
      "scrapia-flicker-mid",
      "scrapia-flicker-hard"
    );
    if (!this.editorEl) return;
    this.editorEl.classList.remove(
      "scrapia-wiggle-soft",
      "scrapia-wiggle-mid",
      "scrapia-wiggle-hard",
      "scrapia-text-jitter"
    );
  }
}
