// ⟡· Scrapia Mint Mischief Distortion Pack
// Soft chaos. Cute impatience. Playful UI misbehavior.

class MintMischiefPack {
  constructor(engine) {
    this.engine = engine;
    this.editor = engine.editorEl;
    this.root = engine.rootEl;
  }

  // --- Distortion Effects ---------------------------------------------------

  mintPulseFlicker() {
    this.root.classList.add("mint-pulse-flicker");
    this._triggerDialogue("pulse");
    setTimeout(() => this.root.classList.remove("mint-pulse-flicker"), 160);
  }

  bouncyScreenHop() {
    this.editor.classList.add("mint-hop");
    this._triggerDialogue("hop");
    setTimeout(() => this.editor.classList.remove("mint-hop"), 160);
  }

  mintWiggle() {
    this.editor.classList.add("mint-wiggle");
    this._triggerDialogue("wiggle");
    setTimeout(() => this.editor.classList.remove("mint-wiggle"), 200);
  }

  curiousTilt() {
    this.editor.classList.add("mint-tilt");
    this._triggerDialogue("tilt");
    setTimeout(() => this.editor.classList.remove("mint-tilt"), 140);
  }

  letterHop() {
    const el = this.editor;
    const text = el.value;
    if (!text || text.length < 3) return;

    const idx = Math.floor(Math.random() * text.length);
    const char = text[idx];
    const before = text.substring(0, idx);
    const after = text.substring(idx + 1);
    
    // For textarea, we can't use innerHTML with spans, so we'll just do a simple character swap
    // This is a simplified version for textarea compatibility
    const randomChar = String.fromCharCode(97 + Math.floor(Math.random() * 26));
    el.value = before + randomChar + after;
    this._triggerDialogue("letterHop");

    setTimeout(() => {
      el.value = text;
    }, 180);
  }

  mintJitter() {
    this.editor.classList.add("mint-jitter");
    this._triggerDialogue("jitter");
    setTimeout(() => this.editor.classList.remove("mint-jitter"), 220);
  }

  softDistortionFlash() {
    this.editor.classList.add("mint-distort");
    this._triggerDialogue("distort");
    setTimeout(() => this.editor.classList.remove("mint-distort"), 140);
  }

  cursorExcitement() {
    this.root.classList.add("mint-cursor-excited");
    this._triggerDialogue("cursorExcite");
    setTimeout(() => this.root.classList.remove("mint-cursor-excited"), 1000);
  }

  // --- Dialogue Hook ---------------------------------------------------------

  _triggerDialogue(eventName) {
    const convo = this.engine.convo;
    if (!convo) return;

    const now = Date.now();
    if (now - convo.lastSpeech < convo.speechCooldown) return;

    // Base chance per event
    const baseChance = {
      "pulse": 0.25,
      "hop": 0.35,
      "wiggle": 0.40,
      "tilt": 0.30,
      "letterHop": 0.20,
      "jitter": 0.30,
      "distort": 0.45,
      "cursorExcite": 0.15,
    }[eventName] || 0.20;

    // Mood multiplier
    const moodMult = {
      CALM: 0.8,
      PLAYFUL: 1.2,
      IMPATIENT: 1.6,
    }[convo.state];

    // Final chance
    const chance = baseChance * moodMult;

    convo._maybeSpeak(convo.state, chance);
  }

  // --- Random Event Trigger -------------------------------------------------

  triggerRandom() {
    const events = [
      () => this.mintPulseFlicker(),
      () => this.bouncyScreenHop(),
      () => this.mintWiggle(),
      () => this.curiousTilt(),
      () => this.letterHop(),
      () => this.mintJitter(),
      () => this.softDistortionFlash(),
      () => this.cursorExcitement(),
    ];

    const pick = events[Math.floor(Math.random() * events.length)];
    pick();
  }

  _spiralDistortions() {
    const events = [
      () => this.mintWiggle(),
      () => this.bouncyScreenHop(),
      () => this.mintJitter(),
      () => this.softDistortionFlash(),
    ];

    // 1–3 distortions in a burst
    const count = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const e = events[Math.floor(Math.random() * events.length)];
        e();
      }, i * 120);
    }

    // Cooldown check for spiral dialogue
    if (this.engine.convo && Date.now() - this.engine.convo.lastSpeech >= this.engine.convo.speechCooldown) {
      this.engine.convo.lastSpeech = Date.now();
      this.engine.convo.speak(
        this.engine.convo.translator.translate("look at me", true)
      );
    }
  }
}
