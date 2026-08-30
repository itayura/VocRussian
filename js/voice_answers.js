// Privyetik Voice Answers: speak an answer to activate an existing choice button.
(function () {
  "use strict";

  const TARGETS = [
    { id: "choices-container" },
    { id: "quiz-choices-container" },
    { id: "ending-drill-choices-container" },
    { id: "detective-choices-container" },
    { id: "aspect-trigger-choices-container" },
    { id: "aspect-transform-choices-container" },
    { id: "aspect-left-column" },
    { id: "aspect-right-column" },
    { id: "placement-choices-container" }
  ];

  function normalizeAnswer(text) {
    return String(text || "")
      .normalize("NFC")
      .replace(/\u0301/g, "")
      .replace(/[–—−-]/g, " ")
      .replace(/[^a-zа-яё0-9\s]/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLocaleLowerCase();
  }

  function editSimilarity(a, b) {
    const left = normalizeAnswer(a);
    const right = normalizeAnswer(b);
    if (!left || !right) return 0;
    if (left === right) return 100;
    if (typeof window !== "undefined" && window.SpeechUtils) {
      return window.SpeechUtils.calculateSimilarity(left, right);
    }

    const previous = Array.from({ length: right.length + 1 }, (_, i) => i);
    for (let i = 1; i <= left.length; i++) {
      let diagonal = previous[0];
      previous[0] = i;
      for (let j = 1; j <= right.length; j++) {
        const above = previous[j];
        previous[j] = left[i - 1] === right[j - 1]
          ? diagonal
          : Math.min(diagonal, previous[j - 1], above) + 1;
        diagonal = above;
      }
    }
    return Math.round((1 - previous[right.length] / Math.max(left.length, right.length)) * 100);
  }

  function scoreCandidate(spoken, option) {
    const heard = normalizeAnswer(spoken);
    const label = normalizeAnswer(option);
    if (!heard || !label) return 0;
    if (heard === label) return 100;
    if (heard.includes(label) || label.includes(heard)) {
      const shorter = Math.min(heard.length, label.length);
      const longer = Math.max(heard.length, label.length);
      return Math.max(82, Math.round((shorter / longer) * 100));
    }
    return editSimilarity(heard, label);
  }

  function matchVoiceOption(transcripts, labels, options = {}) {
    const heard = Array.isArray(transcripts) ? transcripts : [transcripts];
    const minimumScore = options.minimumScore || 62;
    const ambiguityMargin = options.ambiguityMargin == null ? 6 : options.ambiguityMargin;
    const ranked = labels.map((label, index) => ({
      index,
      label,
      score: Math.max(...heard.map(transcript => scoreCandidate(transcript, label)))
    })).sort((a, b) => b.score - a.score);

    const best = ranked[0];
    const runnerUp = ranked[1];
    if (!best || best.score < minimumScore) return null;
    if (runnerUp && best.score - runnerUp.score < ambiguityMargin) return null;
    return best;
  }

  function readableButtonLabel(button) {
    if (button.dataset.voiceAnswer) return button.dataset.voiceAnswer;
    const dedicatedLabel = button.querySelector('[id$="-text"]');
    if (dedicatedLabel) return dedicatedLabel.textContent.trim();
    const copy = button.cloneNode(true);
    copy.querySelectorAll("kbd, .sr-only").forEach(node => node.remove());
    return (copy.innerText || copy.textContent || "").trim();
  }

  function chooseLanguage(labels) {
    const text = labels.join(" ");
    const cyrillic = (text.match(/[а-яё]/gi) || []).length;
    const latin = (text.match(/[a-z]/gi) || []).length;
    return cyrillic >= latin ? "ru-RU" : "en-US";
  }

  function availableButtons(container) {
    return Array.from(container.querySelectorAll("button.choice-btn, .aspect-choice-btn, button.aspect-match-tile"))
      .filter(button => !button.disabled && button.offsetParent !== null);
  }

  function createToolbar(container) {
    if (document.querySelector(`[data-voice-target="${container.id}"]`)) return;

    const toolbar = document.createElement("div");
    toolbar.className = "voice-answer-toolbar";
    toolbar.dataset.voiceTarget = container.id;
    toolbar.innerHTML = `
      <button type="button" class="voice-answer-btn" aria-label="Speak an answer" title="Speak an answer">
        <span aria-hidden="true">🎙️</span><span>Speak answer</span>
      </button>
      <span class="voice-answer-status" role="status" aria-live="polite">Choose by voice</span>
    `;
    container.insertAdjacentElement("afterend", toolbar);

    const mic = toolbar.querySelector(".voice-answer-btn");
    const status = toolbar.querySelector(".voice-answer-status");

    mic.addEventListener("click", async () => {
      if (!window.SpeechEngine || !window.SpeechEngine.isSupported()) {
        status.textContent = "Voice input is unavailable in this browser.";
        return;
      }

      if (window.SpeechEngine.isListening()) {
        window.SpeechEngine.stopListening();
        return;
      }

      const buttons = availableButtons(container);
      if (!buttons.length) {
        status.textContent = "No answer choices are available yet.";
        return;
      }

      const labels = buttons.map(readableButtonLabel);
      mic.classList.add("listening");
      mic.setAttribute("aria-label", "Stop listening");
      status.textContent = "Listening…";

      try {
        const result = await window.SpeechEngine.startListening({
          lang: chooseLanguage(labels),
          onInterim: text => {
            if (text) status.textContent = `Heard: ${text}`;
          }
        });
        const transcripts = [result.transcript].concat(result.alternatives || []).filter(Boolean);
        const match = matchVoiceOption(transcripts, labels);
        if (!match) {
          status.textContent = transcripts[0]
            ? `Couldn't match “${transcripts[0]}”. Try again or tap an answer.`
            : "No speech heard. Try again or tap an answer.";
          return;
        }

        status.textContent = `Selected: ${labels[match.index]}`;
        buttons[match.index].click();
      } catch (error) {
        if (!/aborted/i.test(error && error.message || "")) {
          status.textContent = "Voice input failed. Try again or tap an answer.";
        }
      } finally {
        mic.classList.remove("listening");
        mic.setAttribute("aria-label", "Speak an answer");
      }
    });
  }

  function init() {
    TARGETS.forEach(target => {
      const container = document.getElementById(target.id);
      if (container) createToolbar(container);
    });
  }

  if (typeof window !== "undefined") {
    window.VoiceAnswers = { init, normalizeAnswer, matchVoiceOption, chooseLanguage };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
      init();
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { normalizeAnswer, matchVoiceOption, chooseLanguage, scoreCandidate };
  }
})();
