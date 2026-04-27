// ⟡· Scrapric Translator v0.1
// Converts simple English phrases → Fogre-style gremlin dialect.

class ScrapricTranslator {
  constructor() {
    this.gremlinSyllables = ["skree", "pif", "grum", "tik", "fo", "drif"];
    this.endings = ["hum", "bip", "fzz", "oo", "hm"];
  }

  translate(english, spiral = false) {
    if (!english || typeof english !== "string") return "";

    let words = english.toLowerCase().split(/\s+/);

    // Step 1: Drop random consonants
    words = words.map(w => this._dropConsonants(w));

    // Step 2: Double vowels for excitement
    words = words.map(w => this._doubleVowels(w));

    // Spiral mode: extra chaos
    if (spiral) {
      words = words.map(w => this._doubleVowels(w)); // extra chaos
      words.push(this._pick(this.gremlinSyllables));
    }

    // Step 3: Inject gremlin syllables
    words = this._injectGremlin(words);

    // Step 4: Add Fogric ending
    const ending = this._pick(this.endings);
    return words.join("-") + " " + ending;
  }

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------

  _dropConsonants(word) {
    return word.replace(/[bcdfghjklmnpqrstvwxyz]/g, (c) =>
      Math.random() < 0.25 ? "" : c
    );
  }

  _doubleVowels(word) {
    return word.replace(/[aeiou]/g, (v) =>
      Math.random() < 0.3 ? v + v : v
    );
  }

  _injectGremlin(words) {
    if (Math.random() < 0.5) {
      const syl = this._pick(this.gremlinSyllables);
      const pos = Math.floor(Math.random() * (words.length + 1));
      words.splice(pos, 0, syl);
    }
    return words;
  }

  _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}
