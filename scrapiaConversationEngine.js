// ⟡· Scrapia Conversation Engine v0.1
// Conservative, deterministic, Fogre-fluent, speech-bubble output.

class ScrapiaConversationEngine {
  constructor(engine) {
    this.engine = engine;
    this.root = engine.rootEl;
    this.editor = engine.editorEl;

    this.state = "CALM"; // CALM → PLAYFUL → IMPATIENT
    this.idleTime = 0;
    this.lastInteraction = Date.now();

    this.lastSpeech = 0;       // NEW
    this.speechCooldown = 1500; // 1.5 seconds between lines
    this._lastQuip = "";        // NEW: repeat prevention

    this.quips = {
      CALM: [
        "hoo humioid",
        "orb hum…",
        "fo-drif minty",
        "skree-hello",
      ],
      PLAYFUL: [
        "tik tik ooorb!",
        "mint-pif!",
        "skree-hop!",
        "fo-drif wiggle!",
      ],
      IMPATIENT: [
        "humioid… skree-HEY",
        "fo-drif bored hum",
        "ooorb impatient bip",
        "mint-skree-LOOK",
      ],
      THEME: {
        "mint-mischief": [
          "mint-orb glow hum",
          "mint-skree active!",
        ],
        "blue-gremlin": [
          "bzz-orb!",
          "skree-zap!",
        ],
        "arcane-scribble": [
          "rune-orb hum",
          "fo-drif arcanaaa",
        ],
        "baby-ember": [
          "ember-orb pop!",
          "warm-skree!",
        ],
      }
    };

    this._setupInteractionListeners();
    this._startIdleLoop();
  }

  // ------------------------------------------------------------
  // Interaction listeners reset idle timer + calm Scrapia
  // ------------------------------------------------------------
  _setupInteractionListeners() {
    const reset = () => {
      this.lastInteraction = Date.now();
      this.idleTime = 0;
      this.state = "CALM";
      this._maybeSpeak("CALM", 0.2);
    };

    this.editor.addEventListener("keydown", reset);
    this.editor.addEventListener("click", reset);
    this.editor.addEventListener("input", reset);
    this.root.addEventListener("mousemove", reset);
  }

  getIdleTier() {
    if (this.idleTime > 45000) return 3;
    if (this.idleTime > 25000) return 2;
    if (this.idleTime > 10000) return 1;
    return 0;
  }

  // ------------------------------------------------------------
  // Idle loop: escalates Scrapia's mood over time
  // ------------------------------------------------------------
  _startIdleLoop() {
    setInterval(() => {
      const now = Date.now();
      this.idleTime = now - this.lastInteraction;

      const tier = this.getIdleTier();

      switch (tier) {
        case 0:
          // calm
          break;

        case 1:
          // playful
          this.state = "PLAYFUL";
          this._maybeSpeak("PLAYFUL", 0.3);
          break;

        case 2:
          // impatient
          this.state = "IMPATIENT";
          this._maybeSpeak("IMPATIENT", 0.5);
          this.engine.mintPack?.triggerRandom();
          break;

        case 3:
          // SPIRAL MODE
          this.state = "IMPATIENT";
          this._maybeSpeak("IMPATIENT", 0.8);
          this.engine.mintPack?._spiralDistortions();
          break;
      }
    }, 1000);
  }

  // ------------------------------------------------------------
  // Speak logic
  // ------------------------------------------------------------
  _maybeSpeak(state, chance) {
    const now = Date.now();

    // Cooldown check
    if (now - this.lastSpeech < this.speechCooldown) return;

    if (Math.random() < chance) {
      this.lastSpeech = now;
      this.speak(this._pickQuip(state));
    }
  }

  _pickQuip(state) {
    const list = this.quips[state];
    let q;

    do {
      q = list[Math.floor(Math.random() * list.length)];
    } while (q === this._lastQuip && list.length > 1);

    this._lastQuip = q;
    return q;
  }

  speak(text) {
    this._renderBubble(text);
  }

  // ------------------------------------------------------------
  // Theme-aware quip
  // ------------------------------------------------------------
  speakTheme(themeName) {
    const list = this.quips.THEME[themeName];
    if (!list) return;
    const q = list[Math.floor(Math.random() * list.length)];
    this.speak(q);
  }

  // ------------------------------------------------------------
  // Speech bubble renderer
  // ------------------------------------------------------------
  _renderBubble(text) {
    const bubble = document.createElement("div");
    const tier = this.getIdleTier();
    const spiralClass = tier === 3 ? "bubble-spiral" : "";
    bubble.className = `scrapia-speech-bubble ${this._themeBubbleClass()} ${spiralClass}`;
    bubble.textContent = text;

    this.root.appendChild(bubble);

    // auto-remove
    setTimeout(() => {
      bubble.classList.add("fade-out");
      setTimeout(() => bubble.remove(), 300);
    }, 2000);
  }

  _themeBubbleClass() {
    const theme = this.engine.currentTheme;
    switch (theme) {
      case "mint-mischief": return "bubble-mint";
      case "blue-gremlin": return "bubble-gremlin";
      case "arcane-scribble": return "bubble-arcane";
      case "baby-ember": return "bubble-ember";
      default: return "bubble-mint";
    }
  }
}
