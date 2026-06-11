// VocRussian Audio Engine: Text-to-Speech & Sound Synthesis

(function () {
  let audioCtx = null;
  let russianVoice = null;

  // Initialize AudioContext on first user interaction to bypass browser policies
  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Load voices for TTS
  function loadRussianVoice() {
    if (typeof speechSynthesis === "undefined") return;
    const voices = speechSynthesis.getVoices();
    // Try to find a Russian voice
    russianVoice = voices.find(v => v.lang === "ru-RU" || v.lang.startsWith("ru")) || null;
  }

  // Bind voice loading
  if (typeof speechSynthesis !== "undefined") {
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadRussianVoice;
    }
    loadRussianVoice();
  }

  const AudioEngine = {
    // --- TTS RUSSIAN PRONUNCIATION ---
    speak: function (text, rate = 1.0) {
      if (typeof speechSynthesis === "undefined") {
        console.warn("Speech Synthesis is not supported in this browser.");
        return;
      }

      // Stop any current speaking
      speechSynthesis.cancel();

      // Clean the text from accents/stress marks (Cyrillic combining acute accent is \u0301)
      const cleanText = text.replace(/\u0301/g, "");

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "ru-RU";
      utterance.rate = rate; // 1.0 normal, 0.5 slow

      if (russianVoice) {
        utterance.voice = russianVoice;
      } else {
        // Double check voices in case they loaded late
        loadRussianVoice();
        if (russianVoice) utterance.voice = russianVoice;
      }

      speechSynthesis.speak(utterance);
    },

    // --- SYNTHESIZED SOUND EFFECTS ---

    // Correct Answer Chime: Two pleasant rising notes (sine wave)
    playSuccess: function () {
      try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // Note 1: E5 (659.25 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(659.25, now);
        
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.25);

        // Note 2: A5 (880.00 Hz) playing slightly later
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880.00, now + 0.08);

        gain2.gain.setValueAtTime(0, now + 0.08);
        gain2.gain.linearRampToValueAtTime(0.15, now + 0.13);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.4);

      } catch (e) {
        console.warn("Failed to play success sound: ", e);
      }
    },

    // Incorrect Answer Buzz: Low-pitched harsh square wave decaying fast
    playError: function () {
      try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(130.81, now); // C3
        // Frequency drop for a downward sliding buzz
        osc.frequency.linearRampToValueAtTime(85.00, now + 0.3);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.35);
      } catch (e) {
        console.warn("Failed to play error sound: ", e);
      }
    },

    // Card Flip Sound: Soft pop (low pass filter sweep)
    playFlip: function () {
      try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(150.00, now);
        osc.frequency.exponentialRampToValueAtTime(350.00, now + 0.08);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.1);
      } catch (e) {
        console.warn("Failed to play flip sound: ", e);
      }
    },

    // Streak / Level-up Fanfare: Ascending arpeggio
    playLevelUp: function () {
      try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major arpeggio
        const noteDuration = 0.08;

        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * noteDuration);

          gain.gain.setValueAtTime(0, now + idx * noteDuration);
          gain.gain.linearRampToValueAtTime(0.12, now + idx * noteDuration + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * noteDuration + 0.25);

          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now + idx * noteDuration);
          osc.stop(now + idx * noteDuration + 0.25);
        });
      } catch (e) {
        console.warn("Failed to play level-up fanfare: ", e);
      }
    }
  };

  // Export to window
  window.AudioEngine = AudioEngine;
})();
