// Privyetik Application Controller

(function () {
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>'"]/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[character]);
  }
  window.escapeHTML = escapeHTML;

  // Override window.alert with a premium glassmorphic custom modal alert immediately
  const nativeAlert = window.alert;
  window.alert = function (message) {
    if (!document.body) {
      nativeAlert(message);
      return;
    }
    let overlay = document.getElementById("custom-alert-modal");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "custom-alert-modal";
      overlay.className = "modal-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.style.zIndex = "10000"; // Sit on top of other modals
      
      overlay.innerHTML = `
        <div class="modal-content" style="max-width: 400px; text-align: center; padding: 2rem; display: flex; flex-direction: column; align-items: center; gap: 1rem;">
          <div style="font-size: 2.5rem;" id="custom-alert-icon">🔔</div>
          <h3 style="font-family: var(--font-heading); font-size: 1.25rem; color: var(--color-text-main); margin: 0;" id="custom-alert-title">Notice</h3>
          <p style="font-family: var(--font-body); font-size: 0.95rem; color: var(--color-text-muted); line-height: 1.5; margin: 0; word-break: break-word;" id="custom-alert-message"></p>
          <button type="button" class="btn btn-primary" id="custom-alert-ok-btn" style="width: 100%; padding: 0.75rem; font-size: 1rem; margin-top: 0.5rem;">OK</button>
        </div>
      `;
      document.body.appendChild(overlay);
      
      // Bind close events
      const closeAlert = () => overlay.classList.remove("active");
      overlay.querySelector("#custom-alert-ok-btn").addEventListener("click", closeAlert);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeAlert();
      });
    }

    // Set icon/title based on message content
    const msgLower = message ? String(message).toLowerCase() : "";
    let icon = "🔔";
    let title = "Notice";

    if (msgLower.includes("success") || msgLower.includes("done") || msgLower.includes("copied") || msgLower.includes("thank")) {
      icon = "✅";
      title = "Success";
    } else if (msgLower.includes("error") || msgLower.includes("fail") || msgLower.includes("block") || msgLower.includes("warning")) {
      icon = "⚠️";
      title = "Alert";
    } else if (msgLower.includes("reset") || msgLower.includes("delete") || msgLower.includes("wipe")) {
      icon = "🗑️";
      title = "Warning";
    }

    document.getElementById("custom-alert-icon").innerText = icon;
    document.getElementById("custom-alert-title").innerText = title;
    document.getElementById("custom-alert-message").innerText = message;
    overlay.classList.add("active");
  };

  // Premium glassmorphic custom modal confirm
  window.confirmCustom = function (message) {
    return new Promise((resolve) => {
      let overlay = document.getElementById("custom-confirm-modal");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "custom-confirm-modal";
        overlay.className = "modal-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.style.zIndex = "10000"; // Sit on top of other modals
        
        overlay.innerHTML = `
          <div class="modal-content" style="max-width: 400px; text-align: center; padding: 2rem; display: flex; flex-direction: column; align-items: center; gap: 1rem;">
            <div style="font-size: 2.5rem;" id="custom-confirm-icon">❓</div>
            <h3 style="font-family: var(--font-heading); font-size: 1.25rem; color: var(--color-text-main); margin: 0;" id="custom-confirm-title">Confirm</h3>
            <p style="font-family: var(--font-body); font-size: 0.95rem; color: var(--color-text-muted); line-height: 1.5; margin: 0; word-break: break-word;" id="custom-confirm-message"></p>
            <div style="display: flex; gap: 0.5rem; width: 100%; margin-top: 0.5rem;">
              <button type="button" class="btn btn-secondary" id="custom-confirm-cancel-btn" style="flex: 1; padding: 0.75rem; font-size: 1rem;">Cancel</button>
              <button type="button" class="btn btn-primary" id="custom-confirm-ok-btn" style="flex: 1; padding: 0.75rem; font-size: 1rem;">Yes</button>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);
        
        // Add active class animation
        setTimeout(() => overlay.classList.add("active"), 10);
      } else {
        overlay.classList.add("active");
      }
      
      document.getElementById("custom-confirm-message").innerText = message;
      
      const okBtn = overlay.querySelector("#custom-confirm-ok-btn");
      const cancelBtn = overlay.querySelector("#custom-confirm-cancel-btn");
      
      const cleanListeners = () => {
        okBtn.removeEventListener("click", onOk);
        cancelBtn.removeEventListener("click", onCancel);
        overlay.removeEventListener("click", onOverlayClick);
      };
      
      const onOk = () => {
        cleanListeners();
        overlay.classList.remove("active");
        resolve(true);
      };
      
      const onCancel = () => {
        cleanListeners();
        overlay.classList.remove("active");
        resolve(false);
      };
      
      const onOverlayClick = (e) => {
        if (e.target === overlay) {
          onCancel();
        }
      };
      
      okBtn.addEventListener("click", onOk);
      cancelBtn.addEventListener("click", onCancel);
      overlay.addEventListener("click", onOverlayClick);
    });
  };

  // Dynamic translation helper with caching for multi-language dictionary and reviews
  window.translateTextWithCache = async function (cardId, textToTranslate, targetLang, sourceLang = "en") {
    if (!textToTranslate) return "";
    if (targetLang === sourceLang) return textToTranslate;

    let cache = {};
    try {
      cache = JSON.parse(localStorage.getItem("voc_translations_cache")) || {};
    } catch (e) {}

    const cacheKey = `${cardId}_${targetLang}_${textToTranslate}`;
    if (cache[cacheKey]) {
      return cache[cacheKey];
    }

    try {
      const googleTranslateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
      const res = await fetch(googleTranslateUrl);
      if (res.ok) {
        const data = await res.json();
        const translatedText = data && data[0] && data[0][0] && data[0][0][0]
          ? data[0][0][0].trim()
          : textToTranslate;
        
        cache[cacheKey] = translatedText;
        localStorage.setItem("voc_translations_cache", JSON.stringify(cache));
        return translatedText;
      }
    } catch (e) {
      console.warn("Failed to translate text asynchronously:", e);
    }
    return textToTranslate;
  };

  window.getOrTriggerTranslation = function (cardId, textToTranslate, targetLang, callback, sourceLang = "en") {
    if (!textToTranslate || targetLang === sourceLang) {
      return textToTranslate;
    }

    let cache = {};
    try {
      cache = JSON.parse(localStorage.getItem("voc_translations_cache")) || {};
    } catch (e) {}

    const cacheKey = `${cardId}_${targetLang}_${textToTranslate}`;
    if (cache[cacheKey]) {
      return cache[cacheKey];
    }

    // Call async translate and trigger callback
    window.translateTextWithCache(cardId, textToTranslate, targetLang, sourceLang).then(translated => {
      if (callback) callback(translated);
    });

    return textToTranslate;
  };

  // Canvas-based particle physics confetti engine for juicy UI feedback
  window.showConfettiBurst = function (element) {
    if (!element) return;
    if (window.SRS && !window.SRS.getSetting("animationsEnabled", true)) return;
    let canvas = document.getElementById("confetti-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "confetti-canvas";
      canvas.style.position = "fixed";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = "99999";
      document.body.appendChild(canvas);
      
      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      window.addEventListener("resize", resizeCanvas);
      resizeCanvas();
      
      canvas.particles = [];
      canvas.animationFrameId = null;
    }
    
    const rect = element.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    
    const colors = ["#ff5964", "#35a7ff", "#38b000", "#ffca3a", "#8338ec", "#ff006e", "#3a86c8", "#00f5d4"];
    
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 7;
      canvas.particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (2 + Math.random() * 3),
        size: 5 + Math.random() * 7,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        gravity: 0.18 + Math.random() * 0.1,
        decay: 0.015 + Math.random() * 0.015,
        shape: Math.random() > 0.5 ? "circle" : "rect"
      });
    }
    
    if (!canvas.animationFrameId) {
      const ctx = canvas.getContext("2d");
      
      function tick() {
        if (canvas.particles.length === 0) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          canvas.animationFrameId = null;
          return;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = canvas.particles.length - 1; i >= 0; i--) {
          const p = canvas.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.opacity -= p.decay;
          p.rotation += p.rotationSpeed;
          
          if (p.opacity <= 0) {
            canvas.particles.splice(i, 1);
            continue;
          }
          
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;
          
          if (p.shape === "circle") {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          }
          
          ctx.restore();
        }
        
        canvas.animationFrameId = requestAnimationFrame(tick);
      }
      
      canvas.animationFrameId = requestAnimationFrame(tick);
    }
  };

  // Dynamic glassmorphic custom modal for appealing AI content decisions
  window.appealCustom = function (context, aiResponse) {
    return new Promise((resolve) => {
      let overlay = document.getElementById("custom-appeal-modal");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "custom-appeal-modal";
        overlay.className = "modal-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.style.zIndex = "10000";
        
        overlay.innerHTML = `
          <div class="modal-content" style="max-width: 500px; padding: 2rem; display: flex; flex-direction: column; gap: 1rem; box-sizing: border-box;">
            <div style="font-size: 2.5rem; text-align: center;">⚠️</div>
            <h3 style="font-family: var(--font-heading); font-size: 1.25rem; color: var(--color-text-main); margin: 0; text-align: center;">Appeal AI Content</h3>
            <p style="font-family: var(--font-body); font-size: 0.9rem; color: var(--color-text-muted); line-height: 1.4; margin: 0;" id="custom-appeal-context"></p>
            
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-glass); border-radius: var(--border-radius-sm); padding: 0.75rem; max-height: 120px; overflow-y: auto; font-size: 0.85rem; color: var(--color-text-main); font-family: monospace; white-space: pre-wrap; word-break: break-all;" id="custom-appeal-response"></div>
            
            <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.35rem;">
              <label for="custom-appeal-reason" style="font-size: 0.8rem; font-weight: 600; color: var(--color-text-muted);">Why is this incorrect? (Optional)</label>
              <textarea id="custom-appeal-reason" class="json-textarea" style="min-height: 80px; font-size: 0.95rem; padding: 0.5rem 0.75rem; font-family: var(--font-body);" placeholder="Explain why the AI made a mistake..."></textarea>
            </div>
            
            <div style="display: flex; gap: 0.5rem; width: 100%; margin-top: 0.5rem;">
              <button type="button" class="btn btn-secondary" id="custom-appeal-cancel-btn" style="flex: 1; padding: 0.75rem; font-size: 1rem;">Cancel</button>
              <button type="button" class="btn btn-primary" id="custom-appeal-submit-btn" style="flex: 1; padding: 0.75rem; font-size: 1rem;">Submit Appeal</button>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);
        
        setTimeout(() => overlay.classList.add("active"), 10);
      } else {
        overlay.classList.add("active");
        overlay.querySelector("#custom-appeal-reason").value = "";
      }
      
      document.getElementById("custom-appeal-context").innerHTML = "<strong>Context:</strong> " + escapeHTML(context);
      document.getElementById("custom-appeal-response").innerText = aiResponse;
      
      const submitBtn = overlay.querySelector("#custom-appeal-submit-btn");
      const cancelBtn = overlay.querySelector("#custom-appeal-cancel-btn");
      
      const cleanListeners = () => {
        submitBtn.removeEventListener("click", onSubmit);
        cancelBtn.removeEventListener("click", onCancel);
        overlay.removeEventListener("click", onOverlayClick);
      };
      
      const onSubmit = () => {
        const reason = document.getElementById("custom-appeal-reason").value.trim();
        cleanListeners();
        overlay.classList.remove("active");
        
        let appeals = [];
        try {
          appeals = JSON.parse(localStorage.getItem("voc_russian_appeals")) || [];
        } catch (e) {}
        
        const newAppeal = {
          id: 'appeal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleString(),
          context: context,
          aiResponse: aiResponse,
          reason: reason || "No description provided",
          status: "Pending Review"
        };
        
        appeals.unshift(newAppeal);
        localStorage.setItem("voc_russian_appeals", JSON.stringify(appeals));
        
        if (window.renderAppealsList) {
          window.renderAppealsList();
        }
        
        alert("Appeal Submitted: Thank you! Your appeal has been registered locally. We will review this AI generated content.");
        resolve(true);
      };
      
      const onCancel = () => {
        cleanListeners();
        overlay.classList.remove("active");
        resolve(false);
      };
      
      const onOverlayClick = (e) => {
        if (e.target === overlay) {
          onCancel();
        }
      };
      
      submitBtn.addEventListener("click", onSubmit);
      cancelBtn.addEventListener("click", onCancel);
      overlay.addEventListener("click", onOverlayClick);
    });
  };


  // Pre-populates the "Add Custom Word" modal and fires autofill translation immediately
  window.openAddWordWithDefaults = function (wordText) {
    const modal = document.getElementById("modal-add-word");
    if (!modal) return;
    
    // Reset/Clear form fields
    const form = document.getElementById("add-word-form");
    if (form) form.reset();
    
    // Clear old status indicators
    const statusEl = document.getElementById("autofill-status");
    if (statusEl) statusEl.style.display = "none";
    const reverseStatusEl = document.getElementById("reverse-autofill-status");
    if (reverseStatusEl) reverseStatusEl.style.display = "none";
    
    // Reset input borders
    const inputs = [
      "add-word-input", "add-accented-input", "add-translation-input", "add-translit-input",
      "add-pos-input", "add-exampleru-input", "add-exampleen-input"
    ];
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.borderColor = "";
    });

    // Populate Russian word input field
    const wordInput = document.getElementById("add-word-input");
    if (wordInput) {
      wordInput.value = wordText;
    }
    
    // Open modal
    openModal("modal-add-word");
    
    // Automatically trigger Google Translate + Gemini autofill loop!
    const autofillBtn = document.getElementById("modal-add-autofill-btn");
    if (autofillBtn) {
      autofillBtn.click();
    }
  };

  window.wrapCyrillicWords = function (html) {
    if (!html) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
    const container = doc.body.firstChild;
    
    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue;
        const cyrillicRegex = /[\u0400-\u04FF\u0301]+(?:-[\u0400-\u04FF\u0301]+)*/g;
        
        if (cyrillicRegex.test(text)) {
          cyrillicRegex.lastIndex = 0;
          const parent = node.parentNode;
          if (parent && (parent.tagName === 'SPAN' && parent.classList.contains('clickable-ru-word'))) {
            return;
          }
          if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || parent.tagName === 'TEXTAREA' || parent.tagName === 'INPUT')) {
            return;
          }
          
          const fragments = [];
          let lastIdx = 0;
          let match;
          while ((match = cyrillicRegex.exec(text)) !== null) {
            const matchIndex = match.index;
            const matchText = match[0];
            
            if (matchIndex > lastIdx) {
              fragments.push(document.createTextNode(text.substring(lastIdx, matchIndex)));
            }
            
            const span = document.createElement("span");
            span.className = "clickable-ru-word";
            span.textContent = matchText;
            span.title = "Click to view translation / Add to vocabulary";
            fragments.push(span);
            
            lastIdx = cyrillicRegex.lastIndex;
          }
          
          if (lastIdx < text.length) {
            fragments.push(document.createTextNode(text.substring(lastIdx)));
          }
          
          const nextNode = node.nextSibling;
          fragments.forEach(frag => {
            if (nextNode) {
              parent.insertBefore(frag, nextNode);
            } else {
              parent.appendChild(frag);
            }
          });
          parent.removeChild(node);
        }
      } else {
        const children = Array.from(node.childNodes);
        children.forEach(walk);
      }
    }
    
    walk(container);
    return container.innerHTML;
  };

  window.showWordPreviewModal = async function (wordText) {
    const rawWord = wordText.trim();
    const cleanWord = rawWord
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'0-9a-zA-Z]/g, "")
      .trim();

    if (!cleanWord) return;

    openModal("modal-click-word-preview");

    const wordRuEl = document.getElementById("preview-word-ru");
    if (wordRuEl) wordRuEl.textContent = cleanWord;

    const ttsBtn = document.getElementById("preview-word-tts-btn");
    if (ttsBtn) {
      const newTtsBtn = ttsBtn.cloneNode(true);
      ttsBtn.parentNode.replaceChild(newTtsBtn, ttsBtn);
      newTtsBtn.addEventListener("click", () => {
        if (window.AudioEngine && typeof window.AudioEngine.speak === "function") {
          window.AudioEngine.speak(cleanWord.replace(/[́]/g, ""));
        }
      });
    }

    const existing = window.SRS ? window.SRS.getAllWords().find(w => {
      const cleanExisting = w.word.replace(/[\u0301]/g, "").trim().toLowerCase();
      const cleanClicked = cleanWord.replace(/[\u0301]/g, "").trim().toLowerCase();
      return cleanExisting === cleanClicked;
    }) : null;

    const statusEl = document.getElementById("preview-word-status");
    const statusTextEl = document.getElementById("preview-word-status-text");
    const addBtn = document.getElementById("preview-word-add-btn");
    const translationEl = document.getElementById("preview-word-translation");
    const loadingEl = document.getElementById("preview-word-loading");

    if (loadingEl) loadingEl.style.display = "flex";
    if (translationEl) translationEl.style.display = "none";

    if (addBtn) {
      const newAddBtn = addBtn.cloneNode(true);
      addBtn.parentNode.replaceChild(newAddBtn, addBtn);
      
      if (existing) {
        newAddBtn.innerHTML = "✏️ Edit in Deck";
        newAddBtn.className = "btn btn-secondary";
        newAddBtn.addEventListener("click", () => {
          closeModal("modal-click-word-preview");
          if (window.openEditWordModal) {
            window.openEditWordModal(existing.id);
          }
        });
      } else {
        newAddBtn.innerHTML = "➕ Add to Vocab";
        newAddBtn.className = "btn btn-primary";
        newAddBtn.addEventListener("click", () => {
          closeModal("modal-click-word-preview");
          if (window.openAddWordWithDefaults) {
            window.openAddWordWithDefaults(cleanWord);
          }
        });
      }
    }

    if (existing) {
      if (statusEl) statusEl.style.display = "flex";
      if (statusTextEl) statusTextEl.textContent = `Already in deck: "${existing.translation}"`;
      if (loadingEl) loadingEl.style.display = "none";
      if (translationEl) {
        translationEl.style.display = "block";
        translationEl.textContent = existing.translation;
      }
    } else {
      if (statusEl) statusEl.style.display = "none";
      try {
        const nativeLang = window.SRS ? window.SRS.getSetting("nativeLanguage", "en") : "en";
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=ru&tl=${nativeLang}&q=${encodeURIComponent(cleanWord)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Translation API error");
        const data = await response.json();
        const translation = data && data[0] && data[0][0] && data[0][0][0] ? data[0][0][0] : "Translation not found";
        
        if (loadingEl) loadingEl.style.display = "none";
        if (translationEl) {
          translationEl.style.display = "block";
          translationEl.textContent = translation;
        }
      } catch (err) {
        console.error("Google Translate API translation failed:", err);
        if (loadingEl) loadingEl.style.display = "none";
        if (translationEl) {
          translationEl.style.display = "block";
          translationEl.textContent = "Error loading translation";
        }
      }
    }
  };

  // Setup the floating selection tooltip to capture and add grammar words to decks
  function setupFloatingSelectionTooltip() {
    const tooltip = document.createElement("div");
    tooltip.id = "floating-selection-tooltip";
    tooltip.style.position = "fixed";
    tooltip.style.display = "none";
    tooltip.style.padding = "0.4rem 0.8rem";
    tooltip.style.fontSize = "0.85rem";
    tooltip.style.background = "var(--color-primary)";
    tooltip.style.color = "#ffffff";
    tooltip.style.borderRadius = "var(--border-radius-sm)";
    tooltip.style.cursor = "pointer";
    tooltip.style.zIndex = "99999";
    tooltip.style.boxShadow = "var(--shadow-main)";
    tooltip.style.fontWeight = "bold";
    tooltip.style.border = "1px solid var(--border-glass-hover)";
    tooltip.style.transition = "opacity 0.15s ease";
    tooltip.innerHTML = "➕ Add to Vocab";
    document.body.appendChild(tooltip);
    
    let activeSelectionText = "";
    
    document.addEventListener("selectionchange", () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      // Check if selection is within the AI Grammar workspace
      const isWithinGrammar = selection.anchorNode && 
        (selection.anchorNode.parentElement.closest("#view-grammar") || false);
         
      // Exclude punctuation, buttons/inputs, or long sentences (limit to 1-4 words)
      if (text && text.length > 0 && text.length < 50 && isWithinGrammar && !text.includes("\n")) {
        activeSelectionText = text;
        
        try {
          const range = selection.getRangeAt(0);
          const rects = range.getClientRects();
          if (rects.length > 0) {
            const rect = rects[0];
            tooltip.style.top = `${rect.top - 38}px`; // position slightly above the text selection
            tooltip.style.left = `${rect.left + rect.width / 2 - 50}px`; // horizontal centering
            tooltip.style.display = "block";
            tooltip.style.opacity = "1";
          }
        } catch (e) {
          tooltip.style.display = "none";
        }
      } else {
        // Selection cleared, wait for mouseup/pointerup to hide, or hide immediately if selection is completely empty
        if (!text) {
          tooltip.style.opacity = "0";
          setTimeout(() => {
            if (tooltip.style.opacity === "0") {
              tooltip.style.display = "none";
            }
          }, 150);
        }
      }
    });
    
    // Hide when clicking elsewhere
    document.addEventListener("pointerdown", (e) => {
      if (e.target !== tooltip) {
        setTimeout(() => {
          if (!window.getSelection().toString().trim()) {
            tooltip.style.opacity = "0";
            tooltip.style.display = "none";
          }
        }, 120);
      }
    });
    
    tooltip.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      tooltip.style.display = "none";
      if (activeSelectionText) {
        // Clean the Russian text: strip punctuation but keep Cyrillic letters and acute stress marks
        const cleanWord = activeSelectionText
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'0-9a-zA-Z]/g, "")
          .trim();
        
        if (cleanWord) {
          window.openAddWordWithDefaults(cleanWord);
        }
      }
      window.getSelection().removeAllRanges();
    });
  }


  // Define utility function for revealing English translations on click
  window.setRevealableText = function (elementId, text) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (!text) {
      el.innerHTML = "";
      return;
    }
    el.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; width: 100%;">
        <button type="button" class="btn btn-secondary reveal-translation-btn" style="padding: 0.4rem 0.85rem; font-size: 0.85rem; border: 1px solid var(--border-glass); background: var(--bg-input); border-radius: var(--border-radius-sm); color: var(--color-text-muted); cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem; transition: all 0.2s;">👁️ Reveal Translation</button>
        <span class="translation-text" style="display: none; font-size: 1.05rem;">${escapeHTML(text)}</span>
      </div>
    `;
    const btn = el.querySelector(".reveal-translation-btn");
    const span = el.querySelector(".translation-text");
    if (btn && span) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        btn.style.display = "none";
        span.style.display = "inline";
      });
    }
  };

  // --- STATE VARIABLES ---
  let sessionDeck = [];
  let sessionIndex = 0;
  let currentStudyMode = "flashcard"; // 'flashcard' | 'choice' | 'writing'
  let currentStudyReverse = false;    // true = Native → Russian direction
  let sessionXpGained = 0;
  let currentCard = null;
  let isCardFlipped = false;
  let studyHistory = []; // Tracks items studied in current session: { wordId, isCorrect }

  // --- SELECTORS ---
  const views = {
    dashboard: document.getElementById("view-dashboard"),
    "study-select": document.getElementById("view-study-select"),
    "study-active": document.getElementById("view-study-active"),
    dictionary: document.getElementById("view-dictionary"),
    sync: document.getElementById("view-sync"),
    settings: document.getElementById("view-settings"),
    landing: document.getElementById("view-landing"),
    grammar: document.getElementById("view-grammar"),
    stats: document.getElementById("view-stats"),
    alphabet: document.getElementById("view-alphabet")
  };

  const navItems = document.querySelectorAll(".nav-item");
  let activeViewId = "dashboard";

  function setPracticeFocusMode(enabled) {
    document.body.classList.toggle("practice-focus", Boolean(enabled));
  }
  window.setPracticeFocusMode = setPracticeFocusMode;

  // --- INITIALIZATION ---
  document.addEventListener("DOMContentLoaded", () => {
    // Initialize SRS module
    SRS.init();
    applyTheme(SRS.getSetting("theme", "privyetik"));
    
    // Initialize Supabase Sync connection
    if (window.SupabaseSync) {
      window.SupabaseSync.init();
    }
    
    // Wire UI events
    setupNavigation();
    setupDashboard();
    setupStudySelect();
    setupStudySession();
    setupDictionary();
    setupSync();
    setupModals();
    setupAutofillListeners();
    setupSettings();
    initDailyReminders();
    setupOnboarding();
    setupLandingPage();
    if (window.GrammarManager) {
      window.GrammarManager.init();
    }
    if (window.updateAIGrammarLockState) {
      window.updateAIGrammarLockState();
    }
    setupGlobalShortcuts();
    setupFloatingSelectionTooltip();

    // Setup active DB controls in DOM
    populateDecksDropdowns();
    checkSharedDeckImport();
    
    updateCategoryDropdowns();
    loadStudySessionSettings();
    setupScrollLoading();

    // Check for shared word/text query parameter (from Android Web Share Target or PROCESS_TEXT intent)
    const urlParams = new URLSearchParams(window.location.search);
    const addWord = urlParams.get('add_word') || urlParams.get('text') || urlParams.get('share_text');
    if (addWord && window.openAddWordWithDefaults) {
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
      setTimeout(() => {
        window.openAddWordWithDefaults(addWord);
      }, 500);
    }

    // Export functions to window so they can be called by placement.js
    window.renderDashboard = renderDashboard;
    window.renderDictionary = renderDictionary;
    window.updateLevelAssessmentUI = updateLevelAssessmentUI;

    // Global UI refresh callback for sync downloads
    window.refreshAppUI = function () {
      populateDecksDropdowns();
      renderDashboard();
      updateCategoryDropdowns();
      if (views.dictionary.classList.contains("active")) {
        renderDictionary();
      }
      // Refresh settings checkbox dynamically on sync
      const showTranslitCheckbox = document.getElementById("settings-show-translit");
      if (showTranslitCheckbox) {
        showTranslitCheckbox.checked = SRS.getSetting("showTranslit", true);
      }
      // Refresh theme dropdown dynamically on sync
      const themeSelect = document.getElementById("settings-theme");
      if (themeSelect) {
        const currentTheme = SRS.getSetting("theme", "midnight");
        themeSelect.value = currentTheme;
        applyTheme(currentTheme);
      }

    };

    // Default view: check local progress to decide landing or dashboard
    const statsStr = localStorage.getItem("voc_russian_stats");
    const progressStr = localStorage.getItem("voc_russian_progress");
    const customStr = localStorage.getItem("voc_russian_custom");
    
    let hasLocalProgress = false;
    if (statsStr) {
      try {
        const stats = JSON.parse(statsStr);
        if (stats && stats.xp > 0) {
          hasLocalProgress = true;
        }
      } catch (e) {}
    }
    if (progressStr && progressStr !== "{}") {
      hasLocalProgress = true;
    }
    if (customStr && customStr !== "[]") {
      hasLocalProgress = true;
    }
    
    if (hasLocalProgress || localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true") {
      onboardingRequired = false;
      switchView("dashboard", { history: "replace" });
    } else {
      onboardingRequired = true;
      switchView("landing", { history: "replace" });
    }

    window.addEventListener("popstate", (event) => {
      const target = event.state && event.state.privyetikView;
      if (target && views[target]) {
        switchView(target, { history: "none" });
      }
    });
  });


  // --- VIEW ROUTING ---
  function setupNavigation() {
    navItems.forEach(item => {
      const button = item.querySelector("button");
      button.addEventListener("click", () => {
        const target = item.getAttribute("data-target");
        switchView(target);
      });
    });

    // Logo click goes to Dashboard
    document.querySelector(".logo-container").addEventListener("click", () => {
      switchView("dashboard");
    });
  }

  window.updateAIGrammarLockState = function () {
    const grammarTab = document.querySelector('.nav-item[data-target="grammar"]');
    if (grammarTab) {
      grammarTab.classList.remove("disabled");
    }
  };

  function switchView(targetViewId, options = {}) {
    const historyMode = options.history || "push";
    // landing-mode toggling removed to keep sidebar persistent

    if (onboardingRequired && targetViewId !== "landing") {
      const onboardingModal = document.getElementById("onboarding-modal");
      if (onboardingModal && !onboardingModal.classList.contains("active")) {
        openOnboarding();
      }
      return;
    }

    if (!views[targetViewId]) return;

    const hasChangedView = activeViewId !== targetViewId;
    activeViewId = targetViewId;
    setPracticeFocusMode(targetViewId === "study-active");

    if (historyMode === "replace") {
      window.history.replaceState({ privyetikView: targetViewId }, "", window.location.href);
    } else if (historyMode === "push" && hasChangedView) {
      window.history.pushState({ privyetikView: targetViewId }, "", window.location.href);
    }


    // Un-activate all nav links
    navItems.forEach(item => {
      if (item.getAttribute("data-target") === targetViewId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Hide all sections, display the active one
    Object.keys(views).forEach(key => {
      if (key === targetViewId) {
        views[key].classList.add("active");
      } else {
        views[key].classList.remove("active");
      }
    });

    // Refresh view states
    if (targetViewId === "dashboard") {
      renderDashboard();
    } else if (targetViewId === "dictionary") {
      renderDictionary();
    } else if (targetViewId === "sync") {
      renderSyncData();
    } else if (targetViewId === "grammar") {
      if (window.GrammarManager) {
        window.GrammarManager.updateGrammarLevelUI();
      }
    } else if (targetViewId === "study-select") {
      updateSelectedCategoryMasteryUI();
    } else if (targetViewId === "stats") {
      renderStatisticsPage();
    } else if (targetViewId === "alphabet") {
      if (window.AlphabetManager) {
        window.AlphabetManager.init();
      }
    } else if (targetViewId === "settings") {
      updateSettingsBackupUI();
    }

    // Scroll the main content viewport back to top on view changes
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.scrollTop = 0;
    }

    // Google Analytics Virtual Page View Tracking
    if (typeof gtag === 'function') {
      gtag('event', 'page_view', {
        page_title: targetViewId.charAt(0).toUpperCase() + targetViewId.slice(1),
        page_path: '/' + targetViewId
      });
    }
  }

  function updateSettingsBackupUI() {
    const divider = document.getElementById("settings-restore-placement-backup-divider");
    const row = document.getElementById("settings-restore-placement-backup-row");
    if (divider && row) {
      const backup = localStorage.getItem("voc_progress_backup_before_placement");
      if (backup) {
        divider.style.display = "block";
        row.style.display = "flex";
      } else {
        divider.style.display = "none";
        row.style.display = "none";
      }
    }
  }
  window.updateSettingsBackupUI = updateSettingsBackupUI;

  // --- EXPANSION HELPERS & PAGINATION ---
  function updateCategoryDropdowns() {
    const allWords = SRS.getAllWords();
    const categories = new Set();
    allWords.forEach(w => {
      if (w.category) categories.add(w.category);
    });
    
    const sortedCategories = Array.from(categories).sort();
    
    // Populate Study Select Category filter
    const studySelect = document.getElementById("study-filter-category");
    studySelect.innerHTML = `<option value="all">All Categories</option>`;
    sortedCategories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.innerText = cat;
      studySelect.appendChild(option);
    });
    
    // Populate Dictionary Category filter
    const dictSelect = document.getElementById("dict-filter-category");
    dictSelect.innerHTML = `<option value="all">All Categories</option>`;
    sortedCategories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.innerText = cat;
      dictSelect.appendChild(option);
    });
  }

  let dictCurrentPage = 1;
  const dictPageSize = 40;
  let dictFilteredPool = [];

  function setupScrollLoading() {
    window.addEventListener("scroll", () => {
      // Check if dictionary section is active
      if (!views["dictionary"].classList.contains("active")) return;
      
      // Load next page if scrolled within 400px of bottom
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 400) {
        renderNextDictPage();
      }
    });
  }

  // --- DASHBOARD CONTROLLERS ---
  function setupDashboard() {
    const quickStudyBtn = document.getElementById("dash-quick-study-btn");
    quickStudyBtn.addEventListener("click", () => {
      // Setup study filters to defaults
      document.getElementById("study-filter-category").value = "all";
      document.getElementById("study-filter-queue").value = "due";
      
      const dueCap = SRS.getSetting("dueCap", 20);
      document.getElementById("study-deck-size").value = dueCap.toString();
      
      startStudySession("flashcard");
    });

    // Mascot click reaction
    const mascotAvatar = document.getElementById("dashboard-mascot-avatar");
    if (mascotAvatar) {
      mascotAvatar.addEventListener("click", () => {
        if (window.AudioEngine) window.AudioEngine.playFlip();
        
        mascotAvatar.className = "";
        void mascotAvatar.offsetWidth;
        mascotAvatar.className = "mascot-animation-bounce";
        
        const reactions = [
          "Привет! Let's keep learning Russian!",
          "Did you know? Cyrillic script was developed in the 9th century AD!",
          "Consistency is key. 10 minutes a day is better than 2 hours once a week!",
          "Click me again, that was fun!",
          "Let's practice the Russian alphabet, it has 33 letters!"
        ];
        const randomText = reactions[Math.floor(Math.random() * reactions.length)];
        const textBubble = document.getElementById("dashboard-mascot-text");
        if (textBubble) textBubble.textContent = randomText;
      });
    }

    // Recommendation Refresh button
    const recRefresh = document.getElementById("recommend-refresh-btn");
    if (recRefresh) {
      recRefresh.addEventListener("click", () => {
        renderVocabularyRecommendation();
      });
    }

    // Recommendation Speak button
    const recSpeak = document.getElementById("recommend-speak-btn");
    if (recSpeak) {
      recSpeak.addEventListener("click", (e) => {
        e.stopPropagation();
        if (activeRecommendationWord && window.AudioEngine) {
          window.AudioEngine.speak(activeRecommendationWord.word);
        }
      });
    }

    // Recommendation Add button
    const recAdd = document.getElementById("recommend-add-btn");
    if (recAdd) {
      recAdd.addEventListener("click", () => {
        if (activeRecommendationWord) {
          const prog = SRS.getCardProgress(activeRecommendationWord.id);
          prog.starred = true;
          prog.nextReview = Date.now();
          prog.hidden = false;
          SRS.saveToStorage(activeRecommendationWord.id, prog);
          
          alert(`"${activeRecommendationWord.word}" added to review queue and starred!`);
          renderDashboard();
        }
      });
    }

    // Tip of the Day refresh button
    const tipRefreshBtn = document.getElementById("dashboard-tip-refresh-btn");
    if (tipRefreshBtn) {
      tipRefreshBtn.addEventListener("click", () => {
        showRandomTip();
      });
    }
    // Dashboard Deck Switcher
    const dashDbSelect = document.getElementById("dashboard-filter-db");
    if (dashDbSelect) {
      dashDbSelect.addEventListener("change", (e) => {
        SRS.setActiveDb(e.target.value);
        // Sync other dropdowns
        const studyDb = document.getElementById("study-filter-db");
        if (studyDb) studyDb.value = e.target.value;
        const dictDb = document.getElementById("dict-filter-db");
        if (dictDb) dictDb.value = e.target.value;
        updateCategoryDropdowns();
        renderDashboard();
        updateSelectedCategoryMasteryUI();
      });
    }

    // Show initial tip
    showRandomTip();
  }

  function updateLevelAssessmentUI() {
    // Level assessment is removed as requested by the user.
  }

  function updateSelectedCategoryMasteryUI() {
    const activeDb = document.getElementById("study-filter-db").value;
    const category = document.getElementById("study-filter-category").value;
    const level = document.getElementById("study-filter-level").value;
    
    // Get all words matching activeDb and category
    let allWords = [];
    if (activeDb === "expanded") {
      allWords = window.expandedVocabulary || [];
    } else if (activeDb === "standard") {
      allWords = window.defaultVocabulary || [];
    } else {
      // Custom deck
      allWords = (JSON.parse(localStorage.getItem("voc_russian_custom")) || []).filter(w => (w.deckId || "custom") === activeDb);
    }

    allWords = allWords.filter(w => !SRS.getCardProgress(w.id).hidden);

    if (category && category !== "all") {
      allWords = allWords.filter(w => w.category === category);
    }

    if (level && level !== "all") {
      allWords = allWords.filter(w => SRS.getWordLevel(w) === level);
    }

    let totalWeight = 0;
    let maxWeight = allWords.length * 4;

    allWords.forEach(w => {
      const prog = SRS.getCardProgress(w.id);
      totalWeight += Math.max(0, (prog.box || 1) - 1);
    });

    const masteryPct = maxWeight > 0 ? Math.round((totalWeight / maxWeight) * 100) : 0;

    const valEl = document.getElementById("study-target-mastery-val");
    const fillEl = document.getElementById("study-target-mastery-fill");
    if (valEl) valEl.innerText = `${masteryPct}%`;
    if (fillEl) fillEl.style.width = `${masteryPct}%`;
  }

  function renderDashboard() {
    const stats = SRS.getStatsSummary();
    
    // Update global panel stats
    document.getElementById("stat-due-count").innerText = stats.dueCount;
    document.getElementById("stat-streak").innerText = stats.streak;
    document.getElementById("stat-xp").innerText = stats.xp;
    
    // Quick Study button badges
    document.getElementById("dash-due-btn-badge").innerText = stats.dueCount;
    const quickBtn = document.getElementById("dash-quick-study-btn");
    if (stats.dueCount === 0) {
      quickBtn.classList.remove("btn-primary");
      quickBtn.classList.add("btn-secondary");
      quickBtn.querySelector("span:first-child").innerText = "No Due Cards Today";
    } else {
      quickBtn.classList.add("btn-primary");
      quickBtn.classList.remove("btn-secondary");
      quickBtn.querySelector("span:first-child").innerText = "Start Due Review";
    }

    // Sidebar footer stats
    document.getElementById("sidebar-streak-val").innerText = stats.streak;
    document.getElementById("sidebar-xp-val").innerText = stats.xp;

    // Box distribution layout
    for (let box = 1; box <= 5; box++) {
      const count = stats.boxCounts[box] || 0;
      document.getElementById(`box${box}-count`).innerText = count;
      
      const fillPercent = stats.totalWords > 0 
        ? Math.round((count / stats.totalWords) * 100) 
        : 0;
      document.getElementById(`box${box}-fill`).style.width = fillPercent + "%";
    }

    // Weekly Chart Renderer
    renderWeeklyChart();

    // Proficiency Level Assessment
    updateLevelAssessmentUI();

    // Update Mascot state based on due cards
    if (window.updateMascotState) {
      if (stats.dueCount === 0) {
        window.updateMascotState("sleep");
      } else if (stats.dueCount > 15) {
        window.updateMascotState("remind");
      } else {
        window.updateMascotState("idle");
      }
    }

    // Render smart vocabulary recommendations
    renderVocabularyRecommendation();

    // Cache updated stats for notifications/service worker
    syncReminderStateToCache();
  }

  function renderWeeklyChart() {
    const weeklyData = SRS.getLast7DaysXp();
    const barsGroup = document.getElementById("chart-bars-group");
    const labelsGroup = document.getElementById("chart-labels-group");
    
    barsGroup.innerHTML = "";
    labelsGroup.innerHTML = "";
    
    const maxVal = Math.max(...weeklyData.map(d => d.xp), 50); // Minimum scale floor of 50 XP
    
    const chartHeight = 150; // Height of bars grid (from Y=20 to Y=170)
    const barWidth = 32;
    const startX = 55;
    const stepX = 46;

    weeklyData.forEach((day, index) => {
      const x = startX + index * stepX;
      
      // Calculate height relative to maxVal
      const barHeight = (day.xp / maxVal) * chartHeight;
      const y = 170 - barHeight;

      // Create SVG Rect
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", x - barWidth / 2);
      rect.setAttribute("y", y);
      rect.setAttribute("width", barWidth);
      rect.setAttribute("height", barHeight);
      rect.setAttribute("rx", 6);
      rect.setAttribute("class", "chart-bar");
      rect.innerHTML = `<title>${day.xp} XP earned on ${day.label}</title>`;
      
      barsGroup.appendChild(rect);

      // Create Value Text
      if (day.xp > 0) {
        const valText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        valText.setAttribute("x", x);
        valText.setAttribute("y", Math.min(y - 6, 160));
        valText.setAttribute("class", "chart-text");
        valText.setAttribute("style", "fill: var(--color-text-main); font-weight: 600; font-size: 9px;");
        valText.textContent = day.xp;
        barsGroup.appendChild(valText);
      }

      // Create Date label text
      const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      labelText.setAttribute("x", x);
      labelText.setAttribute("y", 188);
      labelText.setAttribute("class", "chart-text");
      labelText.textContent = day.label;
      labelsGroup.appendChild(labelText);
    });
  }

  // --- STUDY SELECTION CONTROLLERS ---
  const sessionSettingIds = [
    "study-filter-category",
    "study-filter-level",
    "study-filter-queue",
    "study-deck-size",
    "study-filter-revised",
    "study-filter-direction"
  ];

  function saveStudySessionSettings() {
    const categoryEl = document.getElementById("study-filter-category");
    const levelEl = document.getElementById("study-filter-level");
    const queueEl = document.getElementById("study-filter-queue");
    const deckSizeEl = document.getElementById("study-deck-size");
    const revisedEl = document.getElementById("study-filter-revised");
    const directionEl = document.getElementById("study-filter-direction");

    const settings = {
      category: categoryEl ? categoryEl.value : "all",
      level: levelEl ? levelEl.value : "all",
      queue: queueEl ? queueEl.value : "due",
      deckSize: deckSizeEl ? deckSizeEl.value : "20",
      revised: revisedEl ? revisedEl.checked : false,
      direction: directionEl ? directionEl.value : "standard"
    };
    localStorage.setItem("voc_russian_session_settings", JSON.stringify(settings));
  }

  function loadStudySessionSettings() {
    try {
      const saved = localStorage.getItem("voc_russian_session_settings");
      if (!saved) return;
      const settings = JSON.parse(saved);
      
      const categoryEl = document.getElementById("study-filter-category");
      const levelEl = document.getElementById("study-filter-level");
      const queueEl = document.getElementById("study-filter-queue");
      const deckSizeEl = document.getElementById("study-deck-size");
      const revisedEl = document.getElementById("study-filter-revised");
      const directionEl = document.getElementById("study-filter-direction");

      if (categoryEl && settings.category) {
        categoryEl.value = settings.category;
      }
      if (levelEl && settings.level) {
        levelEl.value = settings.level;
      }
      if (queueEl && settings.queue) {
        queueEl.value = settings.queue;
      }
      if (deckSizeEl && settings.deckSize) {
        deckSizeEl.value = settings.deckSize;
      }
      if (revisedEl && settings.revised !== undefined) {
        revisedEl.checked = settings.revised;
      }
      if (directionEl && settings.direction) {
        directionEl.value = settings.direction;
      }
      
      updateSelectedCategoryMasteryUI();
    } catch (e) {
      console.warn("Failed to load study session settings", e);
    }
  }

  // Export to window so it can be called from DOMContentLoaded
  window.loadStudySessionSettings = loadStudySessionSettings;

  function setupStudySelect() {
    // Save settings on change
    sessionSettingIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("change", saveStudySessionSettings);
        if (el.tagName === "INPUT") {
          el.addEventListener("input", saveStudySessionSettings);
        }
      }
    });

    document.getElementById("mode-select-flashcard").addEventListener("click", () => {
      startStudySession("flashcard");
    });
    document.getElementById("mode-select-choice").addEventListener("click", () => {
      startStudySession("choice");
    });
    document.getElementById("mode-select-writing").addEventListener("click", () => {
      startStudySession("writing");
    });

    // Database Deck Switcher
    document.getElementById("study-filter-db").addEventListener("change", (e) => {
      SRS.setActiveDb(e.target.value);
      // Sync other dropdowns
      document.getElementById("dict-filter-db").value = e.target.value;
      updateCategoryDropdowns();
      renderDashboard();
      updateSelectedCategoryMasteryUI();
    });

    // Category Filter Switcher
    document.getElementById("study-filter-category").addEventListener("change", () => {
      updateSelectedCategoryMasteryUI();
    });

    // Level Filter Switcher
    document.getElementById("study-filter-level").addEventListener("change", () => {
      updateSelectedCategoryMasteryUI();
    });

    // Initial load update
    updateSelectedCategoryMasteryUI();
  }

  // --- STUDY ACTIVE CONTROLLERS ---
  function setupStudySession() {
    const quitBtn = document.getElementById("study-quit-btn");
    quitBtn.addEventListener("click", async () => {
      if (await window.confirmCustom("Are you sure you want to quit this study session? Your progress on completed words is already saved.")) {
        switchView("study-select");
      }
    });

    const editBtn = document.getElementById("study-edit-word-btn");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        if (currentCard) {
          openEditWordModal(currentCard.id);
        }
      });
    }

    const formsBtn = document.getElementById("study-word-forms-btn");
    if (formsBtn) {
      formsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (currentCard) {
          openWordDetailsModal(currentCard.id);
        }
      });
    }

    // TTS speaker buttons
    const normalTtsBtn = document.getElementById("tts-normal-btn");
    const slowTtsBtn = document.getElementById("tts-slow-btn");
    if (normalTtsBtn) {
      normalTtsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (currentCard) AudioEngine.speak(currentCard.word, 1.0);
      });
    }
    if (slowTtsBtn) {
      slowTtsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (currentCard) AudioEngine.speak(currentCard.word, 0.55);

      });
    }
    // --- FLASHCARD EVENTS ---
    const flashcardClickArea = document.getElementById("flashcard-click-wrapper");
    flashcardClickArea.addEventListener("click", flipFlashcard);

    document.getElementById("fc-star-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      if (currentCard) {
        const starred = SRS.toggleStar(currentCard.id);
        const btn = document.getElementById("fc-star-btn");
        btn.classList.toggle("starred", starred);
        btn.innerText = starred ? "★" : "☆";
      }
    });

    // SRS Scores clicks
    document.getElementById("srs-score-1").addEventListener("click", () => handleSrsScore(false, "hard"));
    document.getElementById("srs-score-3").addEventListener("click", () => handleSrsScore(true, "good"));
    document.getElementById("srs-score-5").addEventListener("click", () => handleSrsScore(true, "easy"));

    // --- CHOICE MODE EVENTS ---
    document.getElementById("choice-next-btn").addEventListener("click", () => {
      showNextCard();
    });

    // --- WRITING MODE EVENTS ---
    document.getElementById("writing-check-btn").addEventListener("click", () => {
      handleWritingSubmit();
    });

    // --- COMPLETE OVERLAY EVENTS ---
    document.getElementById("complete-home-btn").addEventListener("click", () => {
      switchView("dashboard");
    });
    document.getElementById("complete-again-btn").addEventListener("click", () => {
      // Restart the same study session type instead of going to menu
      startStudySession(currentStudyMode);
    });
  }

  async function startStudySession(mode) {
    currentStudyMode = mode;
    
    // Get filter options from DOM
    const categoryFilter = document.getElementById("study-filter-category").value;
    const levelFilter = document.getElementById("study-filter-level").value;
    const deckTarget = document.getElementById("study-filter-queue").value;
    const maxDeckSize = parseInt(document.getElementById("study-deck-size").value, 10);
    const onlyRevisedEl = document.getElementById("study-filter-revised");
    const onlyRevised = onlyRevisedEl ? onlyRevisedEl.checked : false;
    const directionEl = document.getElementById("study-filter-direction");
    currentStudyReverse = directionEl ? directionEl.value === "reverse" : false;

    // Filter cards
    let pool = SRS.getAllWords().filter(w => !SRS.getCardProgress(w.id).hidden);

    // Apply "Only Revised" filter (must have been reviewed at least once)
    if (onlyRevised) {
      pool = pool.filter(w => {
        const prog = SRS.getCardProgress(w.id);
        return (prog.correctCount || 0) + (prog.wrongCount || 0) > 0;
      });
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      pool = pool.filter(w => w.category === categoryFilter);
    }

    // Apply CEFR level filter – after filtering, prioritize DUE words from that level first
    if (levelFilter !== "all") {
      pool = pool.filter(w => SRS.getWordLevel(w) === levelFilter);
    }

    // Apply queue targets
    if (deckTarget === "due") {
      const now = Date.now();
      pool = pool.filter(w => {
        const prog = SRS.getCardProgress(w.id);
        return prog.nextReview <= now;
      });
    } else if (deckTarget === "starred") {
      pool = pool.filter(w => {
        const prog = SRS.getCardProgress(w.id);
        return prog.starred;
      });
    } else if (deckTarget === "all" && levelFilter !== "all") {
      // For Endless mode with a CEFR filter: put due words first, then non-due
      const now = Date.now();
      const duePool = pool.filter(w => SRS.getCardProgress(w.id).nextReview <= now);
      const nonDuePool = pool.filter(w => SRS.getCardProgress(w.id).nextReview > now);
      duePool.sort(() => Math.random() - 0.5);
      nonDuePool.sort(() => Math.random() - 0.5);
      pool = [...duePool, ...nonDuePool];
    }

    // Check if empty deck
    if (pool.length === 0) {
      if (deckTarget === "due") {
        const renew = await window.confirmCustom("You have no due cards to review today! Would you like to renew all card schedules (make them due for review right now) so you can study them anyway?");
        if (renew) {
          try {
            const progressStr = localStorage.getItem("voc_russian_progress");
            if (progressStr) {
              const progress = JSON.parse(progressStr);
              Object.keys(progress).forEach(id => {
                progress[id].nextReview = Date.now();
                progress[id].updatedAt = Date.now();
              });
              localStorage.setItem("voc_russian_progress", JSON.stringify(progress));
            }
            if (window.SRS) window.SRS.init();
            if (window.refreshAppUI) window.refreshAppUI();
            if (window.renderDashboard) window.renderDashboard();
            
            // Re-run startStudySession with newly renewed cards
            startStudySession(mode);
          } catch (e) {
            console.error(e);
            alert("Failed to renew due cards: " + e.message);
          }
        }
      } else {
        alert("No cards match your chosen filters! Try targeting 'Entire Database', selecting a different category, or adding some custom words.");
      }
      return;
    }

    // Shuffle and slice (unless we pre-ordered for CEFR priority)
    if (!(deckTarget === "all" && levelFilter !== "all")) {
      pool.sort(() => Math.random() - 0.5);
    }
    sessionDeck = pool.slice(0, maxDeckSize);
    sessionIndex = 0;
    sessionXpGained = 0;
    studyHistory = [];

    // Set deck tag badge
    const badge = document.getElementById("study-deck-type-badge");
    if (deckTarget === "due") badge.innerText = "Due Review";
    else if (deckTarget === "starred") badge.innerText = "Starred Deck";
    else badge.innerText = "Endless Deck";

    // Switch display container
    switchView("study-active");

    // Show correct study module container
    document.getElementById("study-sub-flashcard").style.display = mode === "flashcard" ? "block" : "none";
    document.getElementById("study-sub-choice").style.display = mode === "choice" ? "block" : "none";
    document.getElementById("study-sub-writing").style.display = mode === "writing" ? "block" : "none";
    document.getElementById("study-sub-complete").style.display = "none";
    placeStudyAudioControls(mode);

    loadCardInSession();
  }

  function placeStudyAudioControls(mode) {
    const controls = document.querySelector("#view-study-active .audio-controls");
    const stage = document.getElementById(`study-sub-${mode}`);
    if (!controls || !stage) return;
    controls.classList.add("study-audio-controls");
    const anchor = mode === "flashcard"
      ? document.getElementById("fc-rating-panel")
      : mode === "choice"
        ? document.getElementById("choices-container")
        : stage.querySelector(".writing-input-wrapper");
    if (anchor && anchor.parentElement === stage) {
      stage.insertBefore(controls, anchor);
    } else {
      stage.appendChild(controls);
    }
  }
  function loadCardInSession() {
    currentCard = sessionDeck[sessionIndex];
    isCardFlipped = false;
    
    // Update progress numbers
    document.getElementById("study-index-val").innerText = sessionIndex + 1;
    document.getElementById("study-total-val").innerText = sessionDeck.length;
    
    const progressPercent = ((sessionIndex) / sessionDeck.length) * 100;
    document.getElementById("study-progress-bar").style.width = progressPercent + "%";

    // Stop speaking and audio play
    if (currentStudyMode !== "writing") {
      // Auto-pronounce Russian word on load
      setTimeout(() => {
        AudioEngine.speak(currentCard.word);
      }, 300);
    }

    // Populate mode views
    if (currentStudyMode === "flashcard") {
      setupFlashcardLayout();
    } else if (currentStudyMode === "choice") {
      setupChoiceLayout();
    } else if (currentStudyMode === "writing") {
      setupWritingLayout();
    }
  }

  // Flashcards Setup
  function setupFlashcardLayout() {
    const wrapper = document.getElementById("flashcard-click-wrapper");
    const wasFlipped = wrapper.classList.contains("flipped");
    wrapper.classList.remove("flipped");

    const updateContent = (card) => {
      const nativeLang = SRS.getSetting("nativeLanguage", "en");

      if (currentStudyReverse) {
        // REVERSE MODE: Front shows translation, Back shows Russian word
        document.getElementById("fc-category-front").innerText = card.category;
        let transForFront = card.translation;
        if (nativeLang !== "en") {
          transForFront = window.getOrTriggerTranslation(
            card.id, card.word, nativeLang,
            (val) => { document.getElementById("fc-word-front").innerText = val; },
            "ru"
          );
        }
        document.getElementById("fc-word-front").innerText = transForFront;
        document.getElementById("fc-word-translit-front").innerText = "";

        // Back: show the Russian word
        document.getElementById("fc-category-back").innerText = card.category;
        document.getElementById("fc-word-pos-back").innerText = card.pos;
        document.getElementById("fc-word-translation-back").innerText = card.accented || card.word;
        document.getElementById("fc-word-example-ru-back").innerText = card.exampleRu || "";
        window.setRevealableText("fc-word-example-en-back", "");
      } else {
        // STANDARD MODE: Front shows Russian word, Back shows translation
        document.getElementById("fc-category-front").innerText = card.category;
        document.getElementById("fc-word-front").innerText = card.accented || card.word;
        document.getElementById("fc-word-translit-front").innerText = `[${escapeHTML(card.transliteration || "")}]`;

        // Back card details
        document.getElementById("fc-category-back").innerText = card.category;
        document.getElementById("fc-word-pos-back").innerText = card.pos;
        document.getElementById("fc-word-example-ru-back").innerText = card.exampleRu || "";

        let translationText = card.translation;
        if (nativeLang !== "en") {
          translationText = window.getOrTriggerTranslation(
            card.id, card.word, nativeLang,
            (translatedVal) => {
              document.getElementById("fc-word-translation-back").innerText = translatedVal;
            },
            "ru"
          );
        } else {
          translationText = window.getOrTriggerTranslation(
            card.id, card.translation, nativeLang,
            (translatedVal) => {
              document.getElementById("fc-word-translation-back").innerText = translatedVal;
            }
          );
        }
        document.getElementById("fc-word-translation-back").innerText = translationText;

        let exampleEnText = card.exampleEn || "";
        if (card.exampleEn) {
          exampleEnText = window.getOrTriggerTranslation(
            card.id, card.exampleEn, nativeLang,
            (translatedVal) => {
              window.setRevealableText("fc-word-example-en-back", translatedVal);
            }
          );
        }
        window.setRevealableText("fc-word-example-en-back", exampleEnText);
      }

      // Star state
      const prog = SRS.getCardProgress(card.id);
      const starBtn = document.getElementById("fc-star-btn");
      starBtn.classList.toggle("starred", prog.starred);
      starBtn.innerText = prog.starred ? "★" : "☆";
    };

    if (wasFlipped) {
      // Delay updating content until the card has rotated halfway (90deg) out of view (around 250ms)
      setTimeout(() => {
        if (currentCard) {
          updateContent(currentCard);
        }
      }, 250);
    } else {
      updateContent(currentCard);
    }

    // Lock rating panel until flipped
    const ratingPanel = document.getElementById("fc-rating-panel");
    ratingPanel.style.opacity = "0.3";
    ratingPanel.style.pointerEvents = "none";
  }

  function flipFlashcard() {
    const wrapper = document.getElementById("flashcard-click-wrapper");
    wrapper.classList.toggle("flipped");
    isCardFlipped = wrapper.classList.contains("flipped");
    
    AudioEngine.playFlip();

    const ratingPanel = document.getElementById("fc-rating-panel");
    if (isCardFlipped) {
      ratingPanel.style.opacity = "1";
      ratingPanel.style.pointerEvents = "auto";
      
      // Secondary pronounce on flip to verify accent audibly
      AudioEngine.speak(currentCard.word);
    } else {
      ratingPanel.style.opacity = "0.3";
      ratingPanel.style.pointerEvents = "none";
    }
  }

  function handleSrsScore(isCorrect, rating = "good") {
    if (!isCardFlipped) return;
    isCardFlipped = false; // Immediately disable further clicks during transition

    // Log progress
    const result = SRS.scoreCard(currentCard.id, isCorrect, rating);
    sessionXpGained += result.xpGained;

    // Track review history
    studyHistory.push({ wordId: currentCard.id, isCorrect: isCorrect });

    const cardEl = document.getElementById("flashcard-click-wrapper");
    const animationsEnabled = SRS.getSetting("animationsEnabled", true);
    if (isCorrect) {
      AudioEngine.playSuccess();
      if (window.updateMascotState) window.updateMascotState("correct");
      if (cardEl && animationsEnabled) {
        cardEl.classList.add("correct-glow");
        if (window.showConfettiBurst) window.showConfettiBurst(cardEl);
      }
    } else {
      AudioEngine.playError();
      if (window.updateMascotState) window.updateMascotState("incorrect");
      if (cardEl && animationsEnabled) cardEl.classList.add("incorrect-shake");
    }

    // Delay showing next card slightly to allow animation to play
    setTimeout(() => {
      if (cardEl) {
        cardEl.classList.remove("correct-glow", "incorrect-shake");
      }
      showNextCard();
    }, animationsEnabled ? 450 : 50);
  }

  // Multiple Choice Setup
  function setupChoiceLayout() {
    const nativeLang = SRS.getSetting("nativeLanguage", "en");

    if (currentStudyReverse) {
      // REVERSE MODE: Prompt is a Russian word, user picks the translation
      document.getElementById("choice-category").innerText = currentCard.category;
      // Show translation as the prompt question
      let promptTrans = currentCard.translation;
      if (nativeLang !== "en") {
        promptTrans = window.getOrTriggerTranslation(
          currentCard.id, currentCard.word, nativeLang,
          (val) => { document.getElementById("choice-word").innerText = val; },
          "ru"
        );
      } else {
        promptTrans = window.getOrTriggerTranslation(
          currentCard.id, currentCard.translation, nativeLang,
          (val) => { document.getElementById("choice-word").innerText = val; }
        );
      }
      document.getElementById("choice-word").innerText = promptTrans;
      document.getElementById("choice-word-translit").innerText = "";
    } else {
      // STANDARD MODE: Prompt is a Russian word, user picks the translation
      document.getElementById("choice-category").innerText = currentCard.category;
      document.getElementById("choice-word").innerText = currentCard.accented || currentCard.word;
      document.getElementById("choice-word-translit").innerText = `[${currentCard.transliteration || ""}]`;
    }

    // Hide Next button
    const nextBtn = document.getElementById("choice-next-btn");
    nextBtn.style.display = "none";

    // Build distractors
    const allWords = SRS.getAllWords();
    let distractors = allWords.filter(w => w.id !== currentCard.id && w.category === currentCard.category);
    
    // Fallback if not enough category options
    if (distractors.length < 3) {
      distractors = allWords.filter(w => w.id !== currentCard.id);
    }

    // Shuffle and pick 3
    distractors.sort(() => Math.random() - 0.5);
    const selectedDistractors = distractors.slice(0, 3);

    if (currentStudyReverse) {
      // REVERSE: Options are Russian words, correct answer is the Russian word for currentCard
      const options = [currentCard, ...selectedDistractors].map(w => ({
        id: w.id,
        label: w.accented || w.word
      }));
      options.sort(() => Math.random() - 0.5);

      const container = document.getElementById("choices-container");
      container.innerHTML = "";
      options.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.dataset.wordId = opt.id;
        btn.innerHTML = `<span>${escapeHTML(opt.label)}</span><kbd style="font-size:0.65em;">${idx + 1}</kbd>`;
        btn.addEventListener("click", () => handleChoiceSelect(btn, opt.id));
        container.appendChild(btn);
      });
    } else {
      // STANDARD: Options are translations
      const options = [currentCard, ...selectedDistractors].map(w => ({
        id: w.id,
        word: w.word,
        translation: w.translation
      }));
      options.sort(() => Math.random() - 0.5);

      const container = document.getElementById("choices-container");
      container.innerHTML = "";

      options.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.dataset.wordId = opt.id;
        
        let optionText = opt.translation;
        if (nativeLang !== "en") {
          optionText = window.getOrTriggerTranslation(
            opt.id, opt.word, nativeLang,
            (translatedVal) => {
              const spanEl = btn.querySelector("span");
              if (spanEl) spanEl.innerText = translatedVal;
            },
            "ru"
          );
        } else {
          optionText = window.getOrTriggerTranslation(
            opt.id, opt.translation, nativeLang,
            (translatedVal) => {
              const spanEl = btn.querySelector("span");
              if (spanEl) spanEl.innerText = translatedVal;
            }
          );
        }

        btn.innerHTML = `<span>${escapeHTML(optionText)}</span><kbd style="font-size:0.65em;">${idx + 1}</kbd>`;
        btn.addEventListener("click", () => handleChoiceSelect(btn, opt.id));
        container.appendChild(btn);
      });
    }
  }

  function handleChoiceSelect(buttonElement, chosenWordId) {
    const isCorrect = (chosenWordId === currentCard.id);
    const container = document.getElementById("choices-container");
    const buttons = container.querySelectorAll(".choice-btn");
    
    // Disable all options
    buttons.forEach(btn => btn.classList.add("disabled"));

    // Score via SRS
    const result = SRS.scoreCard(currentCard.id, isCorrect);
    sessionXpGained += result.xpGained;

    // Track review history
    studyHistory.push({ wordId: currentCard.id, isCorrect: isCorrect });

    const animationsEnabled = SRS.getSetting("animationsEnabled", true);
    if (isCorrect) {
      buttonElement.classList.add("correct");
      if (window.updateMascotState) window.updateMascotState("correct");
      if (animationsEnabled) {
        buttonElement.classList.add("correct-glow");
        if (window.showConfettiBurst) window.showConfettiBurst(buttonElement);
      }
      AudioEngine.playSuccess();
    } else {
      buttonElement.classList.add("incorrect");
      if (window.updateMascotState) window.updateMascotState("incorrect");
      if (animationsEnabled) {
        buttonElement.classList.add("incorrect-shake");
      }
      // Find and highlight correct answer
      buttons.forEach(btn => {
        if (btn.dataset.wordId === currentCard.id.toString()) {
          btn.classList.add("correct");
        }
      });
      AudioEngine.playError();
    }

    // Reveal next button
    document.getElementById("choice-next-btn").style.display = "block";
  }

  // Writing Setup
  function setupWritingLayout() {
    document.getElementById("writing-category").innerText = currentCard.category;
    
    const nativeLang = SRS.getSetting("nativeLanguage", "en");

    let promptText = currentCard.translation;
    if (nativeLang !== "en") {
      promptText = window.getOrTriggerTranslation(
        currentCard.id,
        currentCard.word,
        nativeLang,
        (translatedVal) => {
          document.getElementById("writing-prompt-translation").innerText = translatedVal;
        },
        "ru"
      );
    } else {
      promptText = window.getOrTriggerTranslation(
        currentCard.id,
        currentCard.translation,
        nativeLang,
        (translatedVal) => {
          document.getElementById("writing-prompt-translation").innerText = translatedVal;
        }
      );
    }
    document.getElementById("writing-prompt-translation").innerText = promptText;
    
    const showTranslit = SRS.getSetting("showTranslit", true);
    const translitEl = document.getElementById("writing-prompt-translit");
    if (showTranslit) {
      translitEl.style.display = "block";
      translitEl.innerText = `[${currentCard.transliteration || ""}]`;
    } else {
      translitEl.style.display = "none";
    }

    let exampleEnRaw = currentCard.exampleEn || "";
    const exampleTextText = window.getOrTriggerTranslation(
      currentCard.id,
      exampleEnRaw,
      nativeLang,
      (translatedVal) => {
        window.setRevealableText("writing-prompt-example-en", translatedVal ? `"${translatedVal}"` : "");
      }
    );
    window.setRevealableText("writing-prompt-example-en", exampleTextText ? `"${exampleTextText}"` : "");

    const checkBtn = document.getElementById("writing-check-btn");
    checkBtn.innerText = "Submit Answer";
    checkBtn.className = "btn btn-primary";

    const input = document.getElementById("writing-user-input");
    input.value = "";
    input.disabled = false;
    input.classList.remove("incorrect-shake");
    input.focus();

    const diffContainer = document.getElementById("writing-diff-container");
    diffContainer.style.display = "none";
    diffContainer.innerHTML = "";
  }

  function handleWritingSubmit() {
    const checkBtn = document.getElementById("writing-check-btn");
    const input = document.getElementById("writing-user-input");
    const diffContainer = document.getElementById("writing-diff-container");

    // If button state is "Next Word", click goes forward
    if (checkBtn.innerText === "Next Word") {
      showNextCard();
      return;
    }

    const userVal = input.value.trim();
    if (!userVal) {
      alert("Please type a response first.");
      input.focus();
      return;
    }

    // Clean word for comparison (Cyrillic acute accent is \u0301)
    const cleanWord = currentCard.word.replace(/\u0301/g, "").toLowerCase().trim();
    const cleanUser = userVal.replace(/\u0301/g, "").toLowerCase().trim();

    const isCorrect = (cleanUser === cleanWord);
    
    // Save to SRS
    const result = SRS.scoreCard(currentCard.id, isCorrect);
    sessionXpGained += result.xpGained;

    // Track review history
    studyHistory.push({ wordId: currentCard.id, isCorrect: isCorrect });

    input.disabled = true;

    const animationsEnabled = SRS.getSetting("animationsEnabled", true);
    if (isCorrect) {
      checkBtn.innerText = "Next Word";
      checkBtn.className = animationsEnabled ? "btn btn-success correct-glow" : "btn btn-success";
      
      diffContainer.style.display = "block";
      diffContainer.innerHTML = '<span class="diff-char-correct" style="font-weight:700;">\u2713 Correct: ' + escapeHTML(currentCard.word) + "</span>";
      
      AudioEngine.playSuccess();
      if (window.updateMascotState) window.updateMascotState("correct");
      if (animationsEnabled && window.showConfettiBurst) window.showConfettiBurst(checkBtn);
    } else {
      checkBtn.innerText = "Next Word";
      checkBtn.className = "btn btn-danger";
      if (window.updateMascotState) window.updateMascotState("incorrect");
      if (animationsEnabled) {
        input.classList.add("incorrect-shake");
      }

      // Compute visual character comparison
      const diffMarkup = computeTextDiff(userVal, currentCard.word);
      diffContainer.style.display = "block";
      diffContainer.innerHTML = `<div>Expected: <strong>${escapeHTML(currentCard.word)}</strong></div>
                                 <div style="font-size:0.9em; margin-top:0.35rem; opacity:0.85;">Diff: ${diffMarkup}</div>`;
      
      AudioEngine.playError();
    }

    // Make sure we speak the correct pronunciation
    AudioEngine.speak(currentCard.word);
  }

  function computeTextDiff(userVal, correctVal) {
    const cleanCorrect = correctVal.replace(/\u0301/g, "").trim().toLowerCase();
    const cleanUser = userVal.trim().toLowerCase();
    
    let html = "";
    const maxLength = Math.max(cleanCorrect.length, cleanUser.length);
    for (let i = 0; i < maxLength; i++) {
      const uChar = cleanUser[i];
      const cChar = cleanCorrect[i];
      
      if (uChar === cChar) {
        html += `<span class="diff-char-correct">${escapeHTML(correctVal[i] || cChar)}</span>`;
      } else {
        if (cChar === undefined) {
          // Extra character
          html += `<span class="diff-char-extra" style="color:var(--color-error); text-decoration:line-through;">${escapeHTML(uChar)}</span>`;
        } else if (uChar === undefined) {
          // Missing character
          html += `<span class="diff-char-missing" style="color:var(--color-error); text-decoration:underline;">${escapeHTML(correctVal[i] || cChar)}</span>`;
        } else {
          // Mistake replacement character
          html += `<span class="diff-char-missing" style="color:var(--color-error); text-decoration:underline;">${escapeHTML(correctVal[i] || cChar)}</span><span class="diff-char-extra" style="font-size:0.8em; opacity:0.5; text-decoration:line-through; margin-left:1px;">${escapeHTML(uChar)}</span>`;
        }
      }
    }
    return html;
  }

  function showNextCard() {
    sessionIndex++;
    if (sessionIndex >= sessionDeck.length) {
      showSessionComplete();
    } else {
      loadCardInSession();
    }
  }

  function showSessionComplete() {
    // Fill full progress indicator
    document.getElementById("study-progress-bar").style.width = "100%";

    // Switch components
    document.getElementById("study-sub-flashcard").style.display = "none";
    document.getElementById("study-sub-choice").style.display = "none";
    document.getElementById("study-sub-writing").style.display = "none";
    
    document.getElementById("study-sub-complete").style.display = "block";
    
    // Compute stats
    const correctCount = studyHistory.filter(item => item.isCorrect).length;
    const accuracy = studyHistory.length > 0 ? Math.round((correctCount / studyHistory.length) * 100) : 0;
    const stats = SRS.getStatsSummary();

    // Fill stats
    document.getElementById("complete-words-count").innerText = sessionDeck.length;
    document.getElementById("complete-xp-gain").innerText = `+${sessionXpGained} XP`;
    document.getElementById("complete-accuracy").innerText = `${accuracy}%`;
    document.getElementById("complete-streak").innerText = `${stats.streak} days`;

    // Update Mascot state for completion page
    if (window.updateMascotState) {
      window.updateMascotState("sleep", `Outstanding session! You gained +${sessionXpGained} XP! Rest up or study again!`);
    }

    // Schedule next reminder offline since we completed a study session
    scheduleLocalReminder();
    
    // Auto cloud backup on session completion
    if (window.triggerAutoCloudBackup) window.triggerAutoCloudBackup();

    AudioEngine.playLevelUp();
  }

  // --- DICTIONARY EXPLORER CONTROLLERS ---
  function setupDictionary() {
    // Add custom word button
    document.getElementById("dict-add-word-btn").addEventListener("click", () => {
      const searchVal = document.getElementById("dict-search").value.trim();
      if (searchVal) {
        const isCyrillic = /[а-яА-ЯёЁ]/.test(searchVal);
        if (isCyrillic) {
          document.getElementById("add-word-input").value = searchVal;
          document.getElementById("add-translation-input").value = "";
          setTimeout(() => {
            document.getElementById("add-word-input").dispatchEvent(new Event("blur"));
          }, 100);
        } else {
          document.getElementById("add-translation-input").value = searchVal;
          document.getElementById("add-word-input").value = "";
          setTimeout(() => {
            document.getElementById("add-translation-input").dispatchEvent(new Event("blur"));
          }, 100);
        }
      } else {
        document.getElementById("add-word-input").value = "";
        document.getElementById("add-translation-input").value = "";
      }
      openModal("modal-add-word");
    });

    // Listeners for filters
    document.getElementById("dict-search").addEventListener("input", renderDictionary);
    document.getElementById("dict-filter-category").addEventListener("change", renderDictionary);
    document.getElementById("dict-filter-status").addEventListener("change", renderDictionary);
    document.getElementById("dict-filter-level").addEventListener("change", renderDictionary);

    // Database Deck Switcher
    document.getElementById("dict-filter-db").addEventListener("change", (e) => {
      SRS.setActiveDb(e.target.value);
      // Sync other dropdowns
      document.getElementById("study-filter-db").value = e.target.value;
      updateCategoryDropdowns();
      renderDashboard();
      renderDictionary();
    });
  }

  function renderDictionary() {
    const grid = document.getElementById("dict-words-grid");
    const emptyState = document.getElementById("dict-empty-state");
    
    grid.innerHTML = "";
    dictCurrentPage = 1;
    
    // Inputs
    const searchVal = document.getElementById("dict-search").value.toLowerCase().trim();
    const categoryVal = document.getElementById("dict-filter-category").value;
    const statusVal = document.getElementById("dict-filter-status").value;
    const levelVal = document.getElementById("dict-filter-level").value;

    let pool = SRS.getAllWords();
    
    // Exclude hidden cards (soft-deleted default cards)
    pool = pool.filter(w => !SRS.getCardProgress(w.id).hidden);

    // Apply search filter
    if (searchVal) {
      pool = pool.filter(w => 
        w.word.toLowerCase().includes(searchVal) || 
        w.translation.toLowerCase().includes(searchVal) || 
        (w.transliteration && w.transliteration.toLowerCase().includes(searchVal))
      );
    }

    // Apply category filter
    if (categoryVal !== "all") {
      pool = pool.filter(w => w.category === categoryVal);
    }

    // Apply CEFR level filter
    if (levelVal !== "all") {
      pool = pool.filter(w => SRS.getWordLevel(w) === levelVal);
    }

    // Apply status filter
    if (statusVal !== "all") {
      if (statusVal === "due") {
        const now = Date.now();
        pool = pool.filter(w => SRS.getCardProgress(w.id).nextReview <= now);
      } else if (statusVal === "starred") {
        pool = pool.filter(w => SRS.getCardProgress(w.id).starred);
      } else if (statusVal.startsWith("box")) {
        const targetBox = parseInt(statusVal.replace("box", ""), 10);
        pool = pool.filter(w => SRS.getCardProgress(w.id).box === targetBox);
      }
    }

    // Sorting: star status first, then alphabetical
    pool.sort((a, b) => {
      const aStarred = SRS.getCardProgress(a.id).starred ? 1 : 0;
      const bStarred = SRS.getCardProgress(b.id).starred ? 1 : 0;
      if (aStarred !== bStarred) {
        return bStarred - aStarred; // Starred first
      }
      return a.word.localeCompare(b.word);
    });

    dictFilteredPool = pool;

    if (dictFilteredPool.length === 0) {
      grid.style.display = "none";
      emptyState.style.display = "block";
      return;
    }

    grid.style.display = "grid";
    emptyState.style.display = "none";

    renderNextDictPage();
  }

  function renderNextDictPage() {
    const grid = document.getElementById("dict-words-grid");
    const start = (dictCurrentPage - 1) * dictPageSize;
    const end = Math.min(start + dictPageSize, dictFilteredPool.length);
    
    if (start >= dictFilteredPool.length) return;

    const nativeLang = SRS.getSetting("nativeLanguage", "en");

    for (let i = start; i < end; i++) {
      const card = dictFilteredPool[i];
      const prog = SRS.getCardProgress(card.id);
      
      const cardEl = document.createElement("div");
      cardEl.className = "card vocab-card";
      
      let translationText = card.translation;
      if (nativeLang !== "en") {
        translationText = window.getOrTriggerTranslation(
          card.id, 
          card.word, 
          nativeLang, 
          (translatedVal) => {
            const el = cardEl.querySelector(".vocab-card-translation");
            if (el) el.innerText = translatedVal;
          },
          "ru"
        );
      } else {
        translationText = window.getOrTriggerTranslation(
          card.id, 
          card.translation, 
          nativeLang, 
          (translatedVal) => {
            const el = cardEl.querySelector(".vocab-card-translation");
            if (el) el.innerText = translatedVal;
          }
        );
      }

      let exampleEnText = card.exampleEn || "";
      if (card.exampleEn) {
        exampleEnText = window.getOrTriggerTranslation(
          card.id, 
          card.exampleEn, 
          nativeLang, 
          (translatedVal) => {
            const el = cardEl.querySelector(".vocab-card-example-en");
            if (el) el.innerText = translatedVal;
          }
        );
      }

      const wordLevel = SRS.getWordLevel(card);
      let levelColor = "hsl(142, 76%, 40%)";
      let levelBg = "hsla(142, 76%, 40%, 0.15)";
      if (wordLevel === "B1" || wordLevel === "B2") {
        levelColor = "hsl(217, 91%, 60%)";
        levelBg = "rgba(37, 99, 235, 0.15)";
      } else if (wordLevel === "C1" || wordLevel === "C2") {
        levelColor = "hsl(350, 89%, 60%)";
        levelBg = "hsla(350, 89%, 60%, 0.15)";
      }

      cardEl.innerHTML = `
        <div class="vocab-card-header">
          <div class="vocab-word-display">
            <span style="cursor:pointer;" class="word-speak-icon" title="Listen Pronunciation">${escapeHTML(card.accented || card.word)}</span>
            <span style="font-size:0.7em; color:var(--color-text-muted); font-weight:normal;">[${escapeHTML(card.transliteration || "")}]</span>
          </div>
          
          <div class="vocab-actions">
            <button class="vocab-action-btn star-toggle ${prog.starred ? 'starred' : ''}" style="color:${prog.starred ? 'hsl(45, 100%, 50%)' : 'var(--color-text-muted)'}" title="Star Word">★</button>
            <button class="vocab-action-btn details" title="Word Inflections">ℹ️</button>
            <button class="vocab-action-btn edit" title="Edit Word">✍️</button>
            <button class="vocab-action-btn delete" title="Delete Word">🗑️</button>
          </div>
        </div>

        <div class="vocab-info-row">
          <span class="vocab-label-badge" style="text-transform: capitalize;">${escapeHTML(card.pos)}</span>
          <span class="vocab-label-badge" style="color: ${levelColor}; background-color: ${levelBg}; border-color: ${levelColor}; font-weight: bold;">${escapeHTML(wordLevel)}</span>
          <span class="vocab-label-badge">${escapeHTML(card.category)}</span>
          <select class="vocab-box-select" style="background-color: var(--color-primary-glow); color: var(--color-primary); border: 1px solid var(--border-glass); border-radius: 4px; font-size: 0.8rem; padding: 2px 4px; font-family: var(--font-body); cursor: pointer; outline: none; font-weight: bold; height: 24px;">
            <option value="1" ${prog.box === 1 ? 'selected' : ''}>Box 1</option>
            <option value="2" ${prog.box === 2 ? 'selected' : ''}>Box 2</option>
            <option value="3" ${prog.box === 3 ? 'selected' : ''}>Box 3</option>
            <option value="4" ${prog.box === 4 ? 'selected' : ''}>Box 4</option>
            <option value="5" ${prog.box === 5 ? 'selected' : ''}>Box 5</option>
          </select>
        </div>

        <div class="vocab-card-translation">${escapeHTML(translationText)}</div>
        
        ${card.exampleRu ? `
          <div class="vocab-card-example">
            <div class="vocab-card-example-ru">${escapeHTML(card.exampleRu)}</div>
            <div class="vocab-card-example-en" style="font-size:0.9em; opacity:0.8;">${escapeHTML(exampleEnText)}</div>
          </div>
        ` : ""}
      `;

      // Speak text trigger
      cardEl.querySelector(".word-speak-icon").addEventListener("click", () => {
        AudioEngine.speak(card.word);
      });

      // Toggle Star
      cardEl.querySelector(".star-toggle").addEventListener("click", () => {
        const starred = SRS.toggleStar(card.id);
        const btn = cardEl.querySelector(".star-toggle");
        btn.classList.toggle("starred", starred);
        btn.style.color = starred ? "hsl(45, 100%, 50%)" : "var(--color-text-muted)";
      });

      // Change Box manually
      cardEl.querySelector(".vocab-box-select").addEventListener("change", (e) => {
        const newBox = parseInt(e.target.value, 10);
        SRS.setCardBox(card.id, newBox);
        renderDashboard();
      });

      // View Word Inflections
      cardEl.querySelector(".details").addEventListener("click", () => {
        openWordDetailsModal(card.id);
      });

      // Edit Word
      cardEl.querySelector(".edit").addEventListener("click", () => {
        openEditWordModal(card.id);
      });

      // Delete Word
      cardEl.querySelector(".delete").addEventListener("click", async () => {
        const msg = card.id.startsWith("custom_") 
          ? "Are you sure you want to delete this custom word permanently?" 
          : "Are you sure you want to hide this default word? You can restore it later by clearing data.";
        if (await window.confirmCustom(msg)) {
          SRS.deleteWord(card.id);
          populateDecksDropdowns();
          renderDictionary();
        }
      });

      grid.appendChild(cardEl);
    }
    
    dictCurrentPage++;
  }

  // --- SYNC & BACKUP CONTROLLERS ---
  function setupSync() {
    // Local JSON export
    document.getElementById("sync-copy-btn").addEventListener("click", () => {
      const textarea = document.getElementById("sync-export-area");
      textarea.select();
      document.execCommand("copy");
      alert("Backup data copied to clipboard successfully!");
    });

    // Local JSON import
    document.getElementById("sync-import-btn").addEventListener("click", async () => {
      const jsonStr = document.getElementById("sync-import-area").value.trim();
      if (!jsonStr) {
        alert("Please paste backup text first.");
        return;
      }
      
      if (await window.confirmCustom("Importing this backup will overwrite your current progress, daily logs, and custom words. Are you sure?")) {
        const success = SRS.importJSON(jsonStr);
        if (success) {
          alert("Backup imported successfully!");
          document.getElementById("sync-import-area").value = "";
          renderSyncData();
          renderDashboard();
        } else {
          alert("Import failed. Please ensure the pasted text is a valid backup exported from this app.");
        }
      }
    });

    // Reset progress
    document.getElementById("sync-reset-btn").addEventListener("click", async () => {
      const isCloudConnected = window.SupabaseSync && window.SupabaseSync.connectionState === "connected" && window.SupabaseSync.user;
      
      let msg = "WARNING: This will delete ALL learning progress, box schedules, XP stats, streaks, and custom words. This action CANNOT be undone! Are you sure?";
      if (isCloudConnected) {
        msg = "🔥 CRITICAL WARNING: You are signed into a cloud account. This will permanently delete ALL local progress AND ALL your saved backup data from the CLOUD database! This cannot be undone. Are you sure you want to proceed?";
      }

      if (await window.confirmCustom(msg)) {
        const resetBtn = document.getElementById("sync-reset-btn");
        const origText = resetBtn.innerText;
        resetBtn.disabled = true;
        resetBtn.innerText = "Wiping progress...";

        try {
          if (isCloudConnected) {
            // Explicitly await the cloud deletion before deleting locally
            const { error: errProg } = await window.SupabaseSync.client.from("voc_progress").delete().match({ user_id: window.SupabaseSync.user.id });
            const { error: errWords } = await window.SupabaseSync.client.from("voc_words").delete().match({ user_id: window.SupabaseSync.user.id });
            const { error: errStats } = await window.SupabaseSync.client.from("voc_stats").delete().match({ user_id: window.SupabaseSync.user.id });
            const { error: errGrammar } = await window.SupabaseSync.client.from("voc_grammar_progress").delete().match({ user_id: window.SupabaseSync.user.id });
            
            const resetError = errProg || errWords || errStats || errGrammar;
            if (resetError) throw resetError;
          }
          
          SRS.resetAllData();
          if (window.GrammarManager) window.GrammarManager.loadFromStorage();
          localStorage.removeItem("voc_supabase_last_sync");
          
          if (window.SupabaseSync && typeof window.SupabaseSync.updateUI === "function") {
            window.SupabaseSync.updateUI();
          }

          alert("All local and cloud progress has been reset successfully.");
          renderDashboard();
          switchView("dashboard");
        } catch (e) {
          console.error("Cloud reset failed:", e);
          SRS.resetAllData();
          if (window.GrammarManager) window.GrammarManager.loadFromStorage();
          localStorage.removeItem("voc_supabase_last_sync");
          
          if (window.SupabaseSync && typeof window.SupabaseSync.updateUI === "function") {
            window.SupabaseSync.updateUI();
          }

          alert("Local progress was reset, but we encountered an error clearing your cloud database: " + e.message);
          renderDashboard();
          switchView("dashboard");
        } finally {
          resetBtn.disabled = false;
          resetBtn.innerText = origText;
        }
      }
    });



    // Supabase Auth Tab Switching
    const tabLogin = document.getElementById("auth-tab-login");
    const tabSignup = document.getElementById("auth-tab-signup");
    const submitBtn = document.getElementById("supabase-auth-submit-btn");

    tabLogin.addEventListener("click", () => {
      window.SupabaseSync.authMode = "login";
      tabLogin.style.color = "var(--color-primary)";
      tabLogin.style.borderBottom = "2px solid var(--color-primary)";
      tabSignup.style.color = "var(--color-text-muted)";
      tabSignup.style.borderBottom = "none";
      submitBtn.innerText = "Sign In";
      submitBtn.className = "btn btn-success";
    });

    tabSignup.addEventListener("click", () => {
      window.SupabaseSync.authMode = "signup";
      tabSignup.style.color = "var(--color-primary)";
      tabSignup.style.borderBottom = "2px solid var(--color-primary)";
      tabLogin.style.color = "var(--color-text-muted)";
      tabLogin.style.borderBottom = "none";
      submitBtn.innerText = "Register Account";
      submitBtn.className = "btn btn-primary";
    });

    // Supabase Auth Submit
    submitBtn.addEventListener("click", async () => {
      const email = document.getElementById("supabase-email").value.trim();
      const password = document.getElementById("supabase-password").value.trim();

      if (!email || !password) {
        alert("Please enter both email and password.");
        return;
      }
      if (password.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
      }

      const origBtnText = submitBtn.innerText;
      submitBtn.disabled = true;
      submitBtn.innerText = "Processing...";

      try {
        if (window.SupabaseSync.authMode === "login") {
          await window.SupabaseSync.signIn(email, password);
          alert("Signed in successfully!");
        } else {
          const res = await window.SupabaseSync.signUp(email, password);
          if (res.session) {
            alert("Registration successful and logged in!");
          } else {
            alert("Registration successful! Please check your email inbox to verify your account before logging in.");
          }
          tabLogin.click();
        }
        document.getElementById("supabase-email").value = "";
        document.getElementById("supabase-password").value = "";
      } catch (e) {
        alert("Authentication error: " + e.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = origBtnText;
      }
    });

    // Supabase Google Auth
    const googleBtn = document.getElementById("supabase-google-btn");
    if (googleBtn) {
      googleBtn.addEventListener("click", async () => {
        const origText = googleBtn.innerText;
        googleBtn.disabled = true;
        googleBtn.innerText = "Signing in with Google...";
        try {
          await window.SupabaseSync.signInWithGoogle();
        } catch (e) {
          alert("Google Sign In error: " + e.message);
          googleBtn.disabled = false;
          googleBtn.innerText = origText;
        }
      });
    }

    // Supabase Sign Out
    document.getElementById("supabase-logout-btn").addEventListener("click", async () => {
      if (await window.confirmCustom("Are you sure you want to sign out?")) {
        try {
          await window.SupabaseSync.signOut();
          alert("Signed out successfully.");
        } catch (e) {
          alert("Error signing out: " + e.message);
        }
      }
    });

    // Supabase Sync Now
    document.getElementById("supabase-sync-now-btn").addEventListener("click", async () => {
      await window.SupabaseSync.syncBoth();
    });

    // Supabase Auto-sync toggle
    const autosyncToggle = document.getElementById("supabase-autosync-toggle");
    if (autosyncToggle) {
      autosyncToggle.checked = localStorage.getItem("voc_supabase_autosync") !== "false";
      autosyncToggle.addEventListener("change", () => {
        localStorage.setItem("voc_supabase_autosync", autosyncToggle.checked);
      });
    }

    // Force clear cache and update app
    const forceUpdateBtn = document.getElementById("app-force-update-btn");
    if (forceUpdateBtn) {
      forceUpdateBtn.addEventListener("click", async () => {
        const origText = forceUpdateBtn.innerText;
        forceUpdateBtn.innerText = "⚡ Purging cache & reloading...";
        forceUpdateBtn.disabled = true;

        try {
          // 1. Unregister all Service Workers
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
            }
          }
          // 2. Delete all caches
          if ('caches' in window) {
            const keys = await caches.keys();
            for (const key of keys) {
              await caches.delete(key);
            }
          }
          // 3. Clear local storage updates timestamp to force clean state pull
          localStorage.removeItem("voc_supabase_last_sync");
          
          // 4. Force browser hard refresh bypassing cache
          window.location.reload(true);
        } catch (e) {
          console.error("Force update cache purge failed:", e);
          alert("Failed to clear cache: " + e.message);
          forceUpdateBtn.innerText = origText;
          forceUpdateBtn.disabled = false;
        }
      });
    }

    // Feedback form handler
    const feedbackForm = document.getElementById("feedback-form");
    if (feedbackForm) {
      feedbackForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const type = document.getElementById("feedback-type").value;
        const title = document.getElementById("feedback-title").value.trim();
        const description = document.getElementById("feedback-desc").value.trim();
        
        const submitBtn = document.getElementById("feedback-submit-btn");
        const origBtnText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerText = "Sending feedback...";
        
        try {
          if (!window.SupabaseSync || !window.SupabaseSync.client) {
            throw new Error("Cloud database is not connected. Please check your connection.");
          }
          await window.SupabaseSync.submitFeedback(type, title, description);
          
          alert("Thank you! Your feedback has been sent to the admin.");
          feedbackForm.reset();
          
          // If the admin themselves is submitting feedback, reload the list
          if (window.SupabaseSync.user && window.SupabaseSync.user.email === "itayuralevich@gmail.com") {
            window.renderAdminFeedback();
          }
        } catch (err) {
          console.error("Feedback submit failed:", err);
          alert("Failed to submit feedback: " + err.message);
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerText = origBtnText;
        }
      });
    }

    // Global admin feedback renderer
    window.renderAdminFeedback = async function () {
      const loader = document.getElementById("admin-feedback-loader");
      const emptyState = document.getElementById("admin-feedback-empty");
      const listContainer = document.getElementById("admin-feedback-list");
      
      if (!listContainer) return;
      
      loader.style.display = "block";
      emptyState.style.display = "none";
      listContainer.innerHTML = "";
      
      try {
        if (!window.SupabaseSync || !window.SupabaseSync.client) {
          return;
        }
        
        const reports = await window.SupabaseSync.fetchFeedback();
        loader.style.display = "none";
        
        if (!reports || reports.length === 0) {
          emptyState.style.display = "block";
          return;
        }
        
        reports.forEach(report => {
          const itemEl = document.createElement("div");
          itemEl.className = "card";
          itemEl.style.border = "1px solid var(--border-glass)";
          itemEl.style.background = "var(--bg-card)";
          itemEl.style.padding = "1rem";
          itemEl.style.marginBottom = "0.5rem";
          
          const badgeTypeBg = report.type === 'bug' ? 'rgba(220, 53, 69, 0.15)' : 'rgba(40, 167, 69, 0.15)';
          const badgeTypeColor = report.type === 'bug' ? '#dc3545' : '#28a745';
          const badgeStatusBg = report.status === 'open' ? 'var(--color-primary-glow)' : report.status === 'in_progress' ? 'rgba(255, 193, 7, 0.15)' : 'rgba(40, 167, 69, 0.15)';
          const badgeStatusColor = report.status === 'open' ? 'var(--color-primary)' : report.status === 'in_progress' ? '#ffc107' : '#28a745';
          
          itemEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="vocab-label-badge" style="font-size: 0.8rem; background: ${badgeTypeBg}; color: ${badgeTypeColor}; border-color: transparent; padding: 0.15rem 0.5rem; border-radius: 4px;">
                  ${report.type === 'bug' ? '🐛 Bug' : '💡 Feature'}
                </span>
                <span class="vocab-label-badge" style="font-size: 0.8rem; background: ${badgeStatusBg}; color: ${badgeStatusColor}; border-color: transparent; text-transform: capitalize; padding: 0.15rem 0.5rem; border-radius: 4px;">
                  ${escapeHTML(report.status)}
                </span>
              </div>
              <span style="font-size: 0.8rem; color: var(--color-text-muted);">${new Date(report.created_at).toLocaleString()}</span>
            </div>
            
            <h4 style="font-family: var(--font-heading); font-size: 1.05rem; margin-top: 0; margin-bottom: 0.25rem; color: var(--color-text-main);">${escapeHTML(report.title)}</h4>
            <p style="font-size: 0.9rem; margin-top: 0.5rem; margin-bottom: 0.75rem; color: var(--color-text-main); white-space: pre-wrap; line-height: 1.4;">${escapeHTML(report.description)}</p>
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-glass); padding-top: 0.75rem; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
              <span style="font-size: 0.8rem; color: var(--color-text-muted);">From: <strong>${escapeHTML(report.user_email)}</strong></span>
              
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <select class="admin-status-select" data-id="${escapeHTML(report.id)}" style="background: var(--bg-card); color: var(--color-text-main); border: 1px solid var(--border-glass); border-radius: 4px; font-size: 0.8rem; padding: 2px 6px; cursor: pointer; outline: none; font-family: var(--font-body);">
                  <option value="open" ${report.status === 'open' ? 'selected' : ''}>Open</option>
                  <option value="in_progress" ${report.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                  <option value="resolved" ${report.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                </select>
                <button class="btn btn-danger admin-delete-feedback-btn" data-id="${escapeHTML(report.id)}" style="padding: 2px 8px; font-size: 0.8rem; background: #dc3545; border-color: #dc3545;">
                  🗑️ Delete
                </button>
              </div>
            </div>
          `;
          
          // Wire select change listener
          itemEl.querySelector(".admin-status-select").addEventListener("change", async (e) => {
            const newStatus = e.target.value;
            try {
              await window.SupabaseSync.updateFeedbackStatus(report.id, newStatus);
              window.renderAdminFeedback();
            } catch (err) {
              console.error("Failed to update feedback status:", err);
              alert("Failed to update status: " + err.message);
            }
          });
          
          // Wire delete click listener
          itemEl.querySelector(".admin-delete-feedback-btn").addEventListener("click", async () => {
            if (await window.confirmCustom("Are you sure you want to delete this feedback report permanently?")) {
              try {
                await window.SupabaseSync.deleteFeedback(report.id);
                window.renderAdminFeedback();
              } catch (err) {
                console.error("Failed to delete feedback:", err);
                alert("Failed to delete feedback: " + err.message);
              }
            }
          });
          
          listContainer.appendChild(itemEl);
        });
      } catch (err) {
        console.error("Admin fetch feedback failed:", err);
        loader.style.display = "none";
        listContainer.innerHTML = `<div style="color: #dc3545; text-align: center; padding: 1rem;">Failed to load feedback: ${escapeHTML(err.message)}</div>`;
      }
    };
  }

  function renderSyncData() {
    const payload = SRS.exportJSON();
    document.getElementById("sync-export-area").value = payload;
    
    if (window.SupabaseSync) {
      window.SupabaseSync.updateUI();
    }
  }

  // --- SETTINGS CONTROLLERS ---
  function setupSettings() {
    const showTranslitCheckbox = document.getElementById("settings-show-translit");
    if (showTranslitCheckbox) {
      showTranslitCheckbox.checked = SRS.getSetting("showTranslit", true);
      
      showTranslitCheckbox.addEventListener("change", () => {
        SRS.setSetting("showTranslit", showTranslitCheckbox.checked);
      });
    }

    const themeSelect = document.getElementById("settings-theme");
    if (themeSelect) {
      themeSelect.value = SRS.getSetting("theme", "privyetik");
      themeSelect.addEventListener("change", () => {
        const theme = themeSelect.value;
        SRS.setSetting("theme", theme);
        applyTheme(theme);
      });
    }

    const nativeLangSelect = document.getElementById("settings-native-lang");
    if (nativeLangSelect) {
      nativeLangSelect.value = SRS.getSetting("nativeLanguage", "en");
      nativeLangSelect.addEventListener("change", () => {
        SRS.setSetting("nativeLanguage", nativeLangSelect.value);
        // Clear cached translations when target language changes
        localStorage.removeItem("voc_translations_cache");
      });
    }

    const dueCapSelect = document.getElementById("settings-due-cap");
    if (dueCapSelect) {
      dueCapSelect.value = SRS.getSetting("dueCap", 20).toString();
      dueCapSelect.addEventListener("input", () => {
        let val = parseInt(dueCapSelect.value, 10);
        if (isNaN(val) || val <= 0) val = 20;
        SRS.setSetting("dueCap", val);
        renderDashboard();
      });
    }

    const animationsEnabledCheckbox = document.getElementById("settings-animations-enabled");
    if (animationsEnabledCheckbox) {
      animationsEnabledCheckbox.checked = SRS.getSetting("animationsEnabled", true);
      animationsEnabledCheckbox.addEventListener("change", () => {
        SRS.setSetting("animationsEnabled", animationsEnabledCheckbox.checked);
      });
    }

    const mascotSelect = document.getElementById("settings-mascot");
    if (mascotSelect) {
      mascotSelect.value = SRS.getSetting("mascotCharacter", "bear");
      mascotSelect.addEventListener("change", () => {
        SRS.setSetting("mascotCharacter", mascotSelect.value);
        window.updateMascotState("idle");
      });
    }

    const viewLandingBtn = document.getElementById("settings-view-landing-btn");
    if (viewLandingBtn) {
      viewLandingBtn.addEventListener("click", () => {
        switchView("landing");
      });
    }

    const replayOnboardingBtn = document.getElementById("settings-replay-onboarding-btn");
    if (replayOnboardingBtn) {
      replayOnboardingBtn.addEventListener("click", () => {
        openOnboarding(true);
      });
    }


    // Restore Backup Button
    const restoreBackupBtn = document.getElementById("settings-restore-placement-backup-btn");
    if (restoreBackupBtn) {
      restoreBackupBtn.addEventListener("click", async () => {
        const approved = await window.confirmCustom("Are you sure you want to restore your learning progress before the last placement test? This will overwrite your current flashcard boxes, grammar lessons, and XP stats.");
        if (approved) {
          try {
            const backupStr = localStorage.getItem("voc_progress_backup_before_placement");
            if (!backupStr) {
              alert("No pre-placement backup was found.");
              return;
            }
            const backup = JSON.parse(backupStr);
            const restoredAt = Date.now();
            if (backup.progress) {
              Object.values(backup.progress).forEach(progress => { progress.updatedAt = restoredAt; });
              localStorage.setItem("voc_russian_progress", JSON.stringify(backup.progress));
            } else {
              localStorage.removeItem("voc_russian_progress");
            }
            if (backup.stats) {
              backup.stats.updatedAt = restoredAt;
              localStorage.setItem("voc_russian_stats", JSON.stringify(backup.stats));
            } else {
              localStorage.removeItem("voc_russian_stats");
            }
            if (backup.grammarProgress) {
              Object.values(backup.grammarProgress).forEach(progress => { progress.updatedAt = restoredAt; });
              localStorage.setItem("voc_russian_grammar_progress", JSON.stringify(backup.grammarProgress));
            } else {
              localStorage.removeItem("voc_russian_grammar_progress");
            }
            if (backup.placementRewardClaimed) localStorage.setItem("voc_placement_reward_claimed", "true");
            else localStorage.removeItem("voc_placement_reward_claimed");
            if (backup.placementTestTaken) localStorage.setItem("voc_placement_test_taken", "true");
            else localStorage.removeItem("voc_placement_test_taken");
            
            SRS.init();
            if (window.GrammarManager) window.GrammarManager.loadFromStorage();
            
            // Refresh
            updateSettingsBackupUI();
            if (window.refreshAppUI) window.refreshAppUI();
            if (window.updateLevelAssessmentUI) window.updateLevelAssessmentUI();
            if (window.SupabaseSync?.user) {
              if (window.SupabaseSync.isSyncing) throw new Error("A cloud sync is already running. Please retry when it finishes.");
              // A restore is intentionally authoritative. Clear learning rows first so
              // append-only event merging cannot reintroduce the placement reward.
              const userId = window.SupabaseSync.user.id;
              const client = window.SupabaseSync.client;
              const cloudDeletes = await Promise.all([
                client.from("voc_progress").delete().match({ user_id: userId }),
                client.from("voc_stats").delete().match({ user_id: userId }),
                client.from("voc_grammar_progress").delete().match({ user_id: userId })
              ]);
              const cloudDeleteError = cloudDeletes.find(result => result.error)?.error;
              if (cloudDeleteError) throw cloudDeleteError;
              const synced = await window.SupabaseSync.syncBoth();
              if (!synced) throw new Error("The restored progress could not be synchronized to the cloud.");
            }
            localStorage.removeItem("voc_progress_backup_before_placement");
            updateSettingsBackupUI();
            
            alert("Progress backup successfully restored!");
          } catch (e) {
            console.error(e);
            alert("Failed to restore backup: " + e.message);
          }
        }
      });
    }

    // Reset Leitner Boxes Button
    const resetBoxesBtn = document.getElementById("settings-reset-boxes-btn");
    if (resetBoxesBtn) {
      resetBoxesBtn.addEventListener("click", async () => {
        const approved = await window.confirmCustom("Are you sure you want to reset all vocabulary card progress back to Box 1? This will not delete your custom words but will reset your Leitner review schedules.");
        if (approved) {
          try {
            const progressStr = localStorage.getItem("voc_russian_progress");
            if (progressStr) {
              const progress = JSON.parse(progressStr);
              const resetAt = Date.now();
              Object.keys(progress).forEach(id => {
                progress[id].box = 1;
                progress[id].nextReview = resetAt;
                progress[id].updatedAt = resetAt;
              });
              localStorage.setItem("voc_russian_progress", JSON.stringify(progress));
            }
            
            // Re-init SRS and synchronize the updated schedules. Accuracy history is preserved.
            SRS.init();
            if (window.SupabaseSync?.user) {
              const synced = await window.SupabaseSync.syncBoth();
              if (!synced) throw new Error("The reset schedules could not be synchronized to the cloud.");
            }
            
            if (window.refreshAppUI) window.refreshAppUI();
            if (window.updateLevelAssessmentUI) window.updateLevelAssessmentUI();
            
            alert("All vocabulary card progress has been reset to Box 1.");
          } catch (e) {
            console.error(e);
            alert("Failed to reset card progress: " + e.message);
          }
        }
      });
    }
  }

  // --- GEMINI LLM SENTENCE GENERATION (SECURE BACKEND EDGE FUNCTION) ---
  async function generateSentenceWithGemini(word, translation, partOfSpeech = "") {
    // Only enabled if the user is signed in
    const isLoggedIn = !!(window.SupabaseSync && window.SupabaseSync.connectionState === "connected" && window.SupabaseSync.user);
    if (!isLoggedIn) {
      return null;
    }

    // Must have Supabase connected to invoke edge functions
    if (!window.SupabaseSync || !window.SupabaseSync.client) {
      console.warn("Gemini sentence generation skipped: Database is not connected.");
      return null;
    }

    const { data: sessionData } = await window.SupabaseSync.client.auth.getSession();
    const token = sessionData?.session?.access_token;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const nativeLang = SRS.getSetting("nativeLanguage", "en");
    const { data, error } = await window.SupabaseSync.client.functions.invoke("generate-sentence", {
      body: { word, translation, partOfSpeech, nativeLanguage: nativeLang },
      headers: headers
    });

    if (error) {
      throw new Error(`Edge Function generate-sentence error: ${error.message || error}`);
    }

    if (data && data.success) {
      return {
        sentenceRu: data.sentenceRu,
        sentenceEn: data.sentenceEn
      };
    }

    return null;
  }

  // --- MODAL WINDOW CONTROLLERS ---
  const modals = {
    "modal-add-word": document.getElementById("modal-add-word"),
    "modal-edit-word": document.getElementById("modal-edit-word"),
    "modal-manage-decks": document.getElementById("modal-manage-decks"),
    "modal-grammar-cta": document.getElementById("modal-grammar-cta"),
    "modal-word-details": document.getElementById("modal-word-details")
  };

  function setupModals() {
    // Add close binders
    document.getElementById("modal-add-close").addEventListener("click", () => closeModal("modal-add-word"));
    document.getElementById("modal-add-cancel").addEventListener("click", () => closeModal("modal-add-word"));
    
    document.getElementById("modal-edit-close").addEventListener("click", () => closeModal("modal-edit-word"));
    document.getElementById("modal-edit-cancel").addEventListener("click", () => closeModal("modal-edit-word"));
    
    document.getElementById("modal-decks-close").addEventListener("click", () => closeModal("modal-manage-decks"));
    document.getElementById("modal-decks-close-footer").addEventListener("click", () => closeModal("modal-manage-decks"));

    document.getElementById("modal-details-close").addEventListener("click", () => closeModal("modal-word-details"));
    document.getElementById("modal-details-close-btn").addEventListener("click", () => closeModal("modal-word-details"));

    document.getElementById("grammar-cta-close-btn").addEventListener("click", () => closeModal("modal-grammar-cta"));
    document.getElementById("grammar-cta-signin-btn").addEventListener("click", () => {
      closeModal("modal-grammar-cta");
      switchView("sync");
    });

    const modalPreviewClose = document.getElementById("modal-preview-close");
    if (modalPreviewClose) {
      modalPreviewClose.addEventListener("click", () => closeModal("modal-click-word-preview"));
    }
    const modalPreviewCancel = document.getElementById("modal-preview-cancel");
    if (modalPreviewCancel) {
      modalPreviewCancel.addEventListener("click", () => closeModal("modal-click-word-preview"));
    }

    // Click delegation for clickable Cyrillic words
    const appContainer = document.getElementById("app-container");
    if (appContainer) {
      appContainer.addEventListener("click", (e) => {
        const clickedWord = e.target.closest(".clickable-ru-word");
        if (clickedWord) {
          e.preventDefault();
          e.stopPropagation();
          const wordText = clickedWord.textContent;
          window.showWordPreviewModal(wordText);
        }
      });
    }

    // Folder button clicks to open Manage Decks
    document.getElementById("dict-manage-decks-btn").addEventListener("click", () => {
      renderDecksList();
      openModal("modal-manage-decks");
    });
    document.getElementById("study-manage-decks-btn").addEventListener("click", () => {
      renderDecksList();
      openModal("modal-manage-decks");
    });

    // Create custom deck
    document.getElementById("create-deck-btn").addEventListener("click", () => {
      const nameInput = document.getElementById("create-deck-name-input");
      const name = nameInput.value.trim();
      if (!name) {
        alert("Please enter a deck name.");
        return;
      }
      SRS.createCustomDeck(name);
      nameInput.value = "";
      populateDecksDropdowns();
      renderDecksList();
    });

    // Import custom deck from paste box
    document.getElementById("import-deck-btn").addEventListener("click", () => {
      const codeInput = document.getElementById("import-deck-code-input");
      const code = codeInput.value.trim();
      if (!code) {
        alert("Please paste a deck link or code first.");
        return;
      }
      handleImportDeck(code);
      codeInput.value = "";
    });
  }

  async function previewWordWithGemini(wordOrTranslation, isReverse = false) {
    const nativeLang = SRS.getSetting("nativeLanguage", "en");
    // Determine auth token if logged in
    let token = null;
    if (window.SupabaseSync && window.SupabaseSync.connectionState === "connected" && window.SupabaseSync.user) {
      try {
        const { data: sessionData } = await window.SupabaseSync.client.auth.getSession();
        token = sessionData?.session?.access_token;
      } catch (e) {
        console.warn("Failed to get Supabase session token:", e);
      }
    }
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    // Attempt Supabase Edge Function (Gemini) preview if client exists
    if (window.SupabaseSync && window.SupabaseSync.client) {
      try {
        const { data, error } = await window.SupabaseSync.client.functions.invoke("add-word", {
          body: { word: wordOrTranslation, nativeLanguage: nativeLang, preview: true },
          headers: headers
        });
        if (!error && data && data.success) {
          // Edge may return full object or just a word string
          if (typeof data.word === "object" && data.word !== null) {
            return data.word;
          }
          if (typeof data.word === "string") {
            // Use Google Translate to get translation for missing fields
            const sl = isReverse ? nativeLang : "ru";
            const tl = isReverse ? "ru" : nativeLang;
            const gtUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(data.word)}`;
            const gtRes = await fetch(gtUrl);
            const gtJson = await gtRes.json();
            const translation = gtJson && gtJson[0] && gtJson[0][0] && gtJson[0][0][0] ? gtJson[0][0][0].trim() : "";
            return {
              word: data.word,
              accented: data.word,
              translation: translation,
              transliteration: "",
              pos: "noun",
              level: "A1",
              category: "Custom",
              exampleRu: "",
              exampleEn: ""
            };
          }
        }
      } catch (e) {
        console.warn("Edge function preview failed, will fallback:", e);
      }
    }
    // Fallback: Google Translate directly
    const sl = isReverse ? nativeLang : "ru";
    const tl = isReverse ? "ru" : nativeLang;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(wordOrTranslation)}`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      const translation = json && json[0] && json[0][0] && json[0][0][0] ? json[0][0][0].trim() : "";
      if (!translation) throw new Error("No translation returned");
      return {
        word: isReverse ? translation : wordOrTranslation,
        accented: isReverse ? translation : wordOrTranslation,
        translation: isReverse ? wordOrTranslation : translation,
        transliteration: "",
        pos: "noun",
        level: "A1",
        category: "Custom",
        exampleRu: "",
        exampleEn: ""
      };
    } catch (e) {
      console.error("Fallback translation failed:", e);
      return null;
    }
  }

  // Setup the modal event listeners for auto-filling from AI / Google Translate
  function setupAutofillListeners() {
    // Autofill trigger from Google Translate & AI
    document.getElementById("modal-add-autofill-btn").addEventListener("click", async () => {
      const wordInput = document.getElementById("add-word-input");
      const word = wordInput.value.trim();
      if (!word) {
        alert("Please enter a Russian word first.");
        wordInput.focus();
        return;
      }

      const statusEl = document.getElementById("autofill-status");
      const autofillBtn = document.getElementById("modal-add-autofill-btn");
      
      autofillBtn.disabled = true;
      statusEl.style.display = "inline-flex";

      try {
        const isLoggedIn = !!(window.SupabaseSync && window.SupabaseSync.connectionState === "connected" && window.SupabaseSync.user);

        if (isLoggedIn) {
          const spinnerStatusText = statusEl.querySelector("span:last-child");
          if (spinnerStatusText) {
            spinnerStatusText.innerText = "Querying AI translation & details...";
          }
          const aiWord = await previewWordWithGemini(word, false);
          if (aiWord) {
            document.getElementById("add-accented-input").value = aiWord.accented || aiWord.word;
            document.getElementById("add-translation-input").value = aiWord.translation;
            document.getElementById("add-translit-input").value = aiWord.transliteration || "";
            
            const posSelect = document.getElementById("add-pos-input");
            const posVal = (aiWord.pos || "noun").toLowerCase();
            let posOptionExists = Array.from(posSelect.options).some(opt => opt.value === posVal);
            if (posOptionExists) {
              posSelect.value = posVal;
            } else {
              posSelect.value = "noun";
            }

            const catSelect = document.getElementById("add-category-input");
            const catVal = aiWord.category || "Custom";
            let catOptionExists = Array.from(catSelect.options).some(opt => opt.value === catVal);
            if (!catOptionExists) {
              const newOpt = document.createElement("option");
              newOpt.value = catVal;
              newOpt.text = catVal;
              catSelect.add(newOpt);
            }
            catSelect.value = catVal;

            const levelSelect = document.getElementById("add-level-input");
            levelSelect.value = aiWord.level || "A1";

            document.getElementById("add-exampleru-input").value = aiWord.exampleRu || "";
            document.getElementById("add-exampleen-input").value = aiWord.exampleEn || "";
          } else {
            throw new Error("Failed to receive preview word details from AI.");
          }
        } else {
          // Fallback to simple Google Translate logic if not signed in
          const nativeLang = SRS.getSetting("nativeLanguage", "en");
          const googleTranslateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ru&tl=${nativeLang}&dt=t&q=${encodeURIComponent(word)}`;
          const gtRes = await fetch(googleTranslateUrl);
          if (!gtRes.ok) {
            throw new Error("Failed to contact translation service.");
          }
          const gtData = await gtRes.json();
          const translation = gtData && gtData[0] && gtData[0][0] && gtData[0][0][0] 
            ? gtData[0][0][0].trim() 
            : "";
            
          if (!translation) {
            throw new Error("Could not find a translation for this word.");
          }

          document.getElementById("add-accented-input").value = word;
          document.getElementById("add-translation-input").value = translation;
          document.getElementById("add-translit-input").value = transliterateWord(word);
          document.getElementById("add-pos-input").value = "noun";
          document.getElementById("add-exampleru-input").value = "";
          document.getElementById("add-exampleen-input").value = "";
          document.getElementById("add-level-input").value = "A1";
        }

        // Visual success pulse
        const inputs = [
          "add-accented-input", "add-translation-input", "add-translit-input",
          "add-pos-input", "add-category-input", "add-level-input", "add-exampleru-input", "add-exampleen-input"
        ];
        inputs.forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            el.style.borderColor = "var(--color-success)";
            setTimeout(() => el.style.borderColor = "", 1000);
          }
        });

      } catch (err) {
        alert(`Auto-fill Error: ${err.message || "Failed to translate word. Please fill details manually."}`);
      } finally {
        autofillBtn.disabled = false;
        statusEl.style.display = "none";
      }
    });

    // Reverse Autofill trigger (English to Russian)
    document.getElementById("modal-add-reverse-autofill-btn").addEventListener("click", async () => {
      const translationInput = document.getElementById("add-translation-input");
      const englishText = translationInput.value.trim();
      if (!englishText) {
        alert("Please enter a translation first.");
        translationInput.focus();
        return;
      }

      const statusEl = document.getElementById("reverse-autofill-status");
      const reverseAutofillBtn = document.getElementById("modal-add-reverse-autofill-btn");
      
      reverseAutofillBtn.disabled = true;
      statusEl.style.display = "inline-flex";

      try {
        const isLoggedIn = !!(window.SupabaseSync && window.SupabaseSync.connectionState === "connected" && window.SupabaseSync.user);

        if (isLoggedIn) {
          const spinnerStatusText = statusEl.querySelector("span:last-child");
          if (spinnerStatusText) {
            spinnerStatusText.innerText = "Querying AI translation & details...";
          }
          const aiWord = await previewWordWithGemini(englishText, true);
          if (aiWord) {
            document.getElementById("add-word-input").value = aiWord.word;
            document.getElementById("add-accented-input").value = aiWord.accented || aiWord.word;
            document.getElementById("add-translation-input").value = aiWord.translation;
            document.getElementById("add-translit-input").value = aiWord.transliteration || "";
            
            const posSelect = document.getElementById("add-pos-input");
            const posVal = (aiWord.pos || "noun").toLowerCase();
            let posOptionExists = Array.from(posSelect.options).some(opt => opt.value === posVal);
            if (posOptionExists) {
              posSelect.value = posVal;
            } else {
              posSelect.value = "noun";
            }

            const catSelect = document.getElementById("add-category-input");
            const catVal = aiWord.category || "Custom";
            let catOptionExists = Array.from(catSelect.options).some(opt => opt.value === catVal);
            if (!catOptionExists) {
              const newOpt = document.createElement("option");
              newOpt.value = catVal;
              newOpt.text = catVal;
              catSelect.add(newOpt);
            }
            catSelect.value = catVal;

            const levelSelect = document.getElementById("add-level-input");
            levelSelect.value = aiWord.level || "A1";

            document.getElementById("add-exampleru-input").value = aiWord.exampleRu || "";
            document.getElementById("add-exampleen-input").value = aiWord.exampleEn || "";
          } else {
            throw new Error("Failed to receive preview word details from AI.");
          }
        } else {
          // Fallback to simple Google Translate logic if not signed in
          const nativeLang = SRS.getSetting("nativeLanguage", "en");
          const googleTranslateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${nativeLang}&tl=ru&dt=t&q=${encodeURIComponent(englishText)}`;
          const gtRes = await fetch(googleTranslateUrl);
          if (!gtRes.ok) {
            throw new Error("Failed to contact translation service.");
          }
          const gtData = await gtRes.json();
          let russianWord = gtData && gtData[0] && gtData[0][0] && gtData[0][0][0] 
            ? gtData[0][0][0].trim() 
            : "";
            
          if (!russianWord) {
            throw new Error("Could not find a Russian translation for this word.");
          }

          russianWord = russianWord.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim().toLowerCase();
          if (!russianWord) {
            throw new Error("Invalid Russian translation returned.");
          }

          const capitalizedRu = russianWord.charAt(0).toUpperCase() + russianWord.slice(1);

          document.getElementById("add-word-input").value = capitalizedRu;
          document.getElementById("add-accented-input").value = capitalizedRu;
          document.getElementById("add-translit-input").value = transliterateWord(russianWord);
          document.getElementById("add-pos-input").value = "noun";
          document.getElementById("add-exampleru-input").value = "";
          document.getElementById("add-exampleen-input").value = "";
          document.getElementById("add-level-input").value = "A1";
        }

        // Visual success pulse
        const inputs = [
          "add-word-input", "add-accented-input", "add-translation-input", "add-translit-input",
          "add-pos-input", "add-category-input", "add-level-input", "add-exampleru-input", "add-exampleen-input"
        ];
        inputs.forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            el.style.borderColor = "var(--color-success)";
            setTimeout(() => el.style.borderColor = "", 1000);
          }
        });

      } catch (err) {
        alert(`Reverse Auto-fill Error: ${err.message || "Failed to translate word. Please fill details manually."}`);
      } finally {
        reverseAutofillBtn.disabled = false;
        statusEl.style.display = "none";
      }
    });

    // Automatic blur triggers for dynamic autofill
    document.getElementById("add-word-input").addEventListener("blur", () => {
      const word = document.getElementById("add-word-input").value.trim();
      const translation = document.getElementById("add-translation-input").value.trim();
      const autofillBtn = document.getElementById("modal-add-autofill-btn");
      if (word && !translation && !autofillBtn.disabled) {
        autofillBtn.click();
      }
    });

    document.getElementById("add-translation-input").addEventListener("blur", () => {
      const word = document.getElementById("add-word-input").value.trim();
      const translation = document.getElementById("add-translation-input").value.trim();
      const reverseAutofillBtn = document.getElementById("modal-add-reverse-autofill-btn");
      if (translation && !word && !reverseAutofillBtn.disabled) {
        reverseAutofillBtn.click();
      }
    });

    // Edit Word Autofill trigger
    document.getElementById("modal-edit-autofill-btn").addEventListener("click", async () => {
      const wordInput = document.getElementById("edit-word-input");
      const word = wordInput.value.trim();
      if (!word) {
        alert("Please enter a Russian word first.");
        wordInput.focus();
        return;
      }

      const statusEl = document.getElementById("edit-autofill-status");
      const autofillBtn = document.getElementById("modal-edit-autofill-btn");
      
      autofillBtn.disabled = true;
      statusEl.style.display = "inline-flex";

      try {
        const isLoggedIn = !!(window.SupabaseSync && window.SupabaseSync.connectionState === "connected" && window.SupabaseSync.user);

        if (isLoggedIn) {
          const spinnerStatusText = statusEl.querySelector("span:last-child");
          if (spinnerStatusText) {
            spinnerStatusText.innerText = "Querying AI translation & details...";
          }
          const aiWord = await previewWordWithGemini(word, false);
          if (aiWord) {
            document.getElementById("edit-accented-input").value = aiWord.accented || aiWord.word;
            document.getElementById("edit-translation-input").value = aiWord.translation;
            document.getElementById("edit-translit-input").value = aiWord.transliteration || "";
            
            const posSelect = document.getElementById("edit-pos-input");
            const posVal = (aiWord.pos || "noun").toLowerCase();
            let posOptionExists = Array.from(posSelect.options).some(opt => opt.value === posVal);
            if (posOptionExists) {
              posSelect.value = posVal;
            } else {
              posSelect.value = "noun";
            }

            const catSelect = document.getElementById("edit-category-input");
            const catVal = aiWord.category || "Essentials";
            let catOptionExists = Array.from(catSelect.options).some(opt => opt.value === catVal);
            if (!catOptionExists) {
              const newOpt = document.createElement("option");
              newOpt.value = catVal;
              newOpt.text = catVal;
              catSelect.add(newOpt);
            }
            catSelect.value = catVal;

            const levelSelect = document.getElementById("edit-level-input");
            levelSelect.value = aiWord.level || "A1";

            document.getElementById("edit-exampleru-input").value = aiWord.exampleRu || "";
            document.getElementById("edit-exampleen-input").value = aiWord.exampleEn || "";
          } else {
            throw new Error("Failed to receive preview word details from AI.");
          }
        } else {
          // Fallback to simple Google Translate logic if not signed in
          const nativeLang = SRS.getSetting("nativeLanguage", "en");
          const googleTranslateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ru&tl=${nativeLang}&dt=t&q=${encodeURIComponent(word)}`;
          const gtRes = await fetch(googleTranslateUrl);
          if (!gtRes.ok) {
            throw new Error("Failed to contact translation service.");
          }
          const gtData = await gtRes.json();
          const translation = gtData && gtData[0] && gtData[0][0] && gtData[0][0][0] 
            ? gtData[0][0][0].trim() 
            : "";
            
          if (!translation) {
            throw new Error("Could not find a translation for this word.");
          }

          document.getElementById("edit-accented-input").value = word;
          document.getElementById("edit-translation-input").value = translation;
          document.getElementById("edit-translit-input").value = transliterateWord(word);
          document.getElementById("edit-pos-input").value = "noun";
          document.getElementById("edit-exampleru-input").value = "";
          document.getElementById("edit-exampleen-input").value = "";
          document.getElementById("edit-level-input").value = "A1";
        }

        // Visual success pulse
        const inputs = [
          "edit-accented-input", "edit-translation-input", "edit-translit-input",
          "edit-pos-input", "edit-category-input", "edit-level-input", "edit-exampleru-input", "edit-exampleen-input"
        ];
        inputs.forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            el.style.borderColor = "var(--color-success)";
            setTimeout(() => el.style.borderColor = "", 1000);
          }
        });

      } catch (err) {
        alert(`Auto-fill Error: ${err.message || "Failed to translate word. Please fill details manually."}`);
      } finally {
        autofillBtn.disabled = false;
        statusEl.style.display = "none";
      }
    });

    // Edit Word Reverse Autofill trigger
    document.getElementById("modal-edit-reverse-autofill-btn").addEventListener("click", async () => {
      const translationInput = document.getElementById("edit-translation-input");
      const englishText = translationInput.value.trim();
      if (!englishText) {
        alert("Please enter a translation first.");
        translationInput.focus();
        return;
      }

      const statusEl = document.getElementById("edit-reverse-autofill-status");
      const reverseAutofillBtn = document.getElementById("modal-edit-reverse-autofill-btn");
      
      reverseAutofillBtn.disabled = true;
      statusEl.style.display = "inline-flex";

      try {
        const isLoggedIn = !!(window.SupabaseSync && window.SupabaseSync.connectionState === "connected" && window.SupabaseSync.user);

        if (isLoggedIn) {
          const spinnerStatusText = statusEl.querySelector("span:last-child");
          if (spinnerStatusText) {
            spinnerStatusText.innerText = "Querying AI translation & details...";
          }
          const aiWord = await previewWordWithGemini(englishText, true);
          if (aiWord) {
            document.getElementById("edit-word-input").value = aiWord.word;
            document.getElementById("edit-accented-input").value = aiWord.accented || aiWord.word;
            document.getElementById("edit-translation-input").value = aiWord.translation;
            document.getElementById("edit-translit-input").value = aiWord.transliteration || "";
            
            const posSelect = document.getElementById("edit-pos-input");
            const posVal = (aiWord.pos || "noun").toLowerCase();
            let posOptionExists = Array.from(posSelect.options).some(opt => opt.value === posVal);
            if (posOptionExists) {
              posSelect.value = posVal;
            } else {
              posSelect.value = "noun";
            }

            const catSelect = document.getElementById("edit-category-input");
            const catVal = aiWord.category || "Essentials";
            let catOptionExists = Array.from(catSelect.options).some(opt => opt.value === catVal);
            if (!catOptionExists) {
              const newOpt = document.createElement("option");
              newOpt.value = catVal;
              newOpt.text = catVal;
              catSelect.add(newOpt);
            }
            catSelect.value = catVal;

            const levelSelect = document.getElementById("edit-level-input");
            levelSelect.value = aiWord.level || "A1";

            document.getElementById("edit-exampleru-input").value = aiWord.exampleRu || "";
            document.getElementById("edit-exampleen-input").value = aiWord.exampleEn || "";
          } else {
            throw new Error("Failed to receive preview word details from AI.");
          }
        } else {
          // Fallback to simple Google Translate logic if not signed in
          const nativeLang = SRS.getSetting("nativeLanguage", "en");
          const googleTranslateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${nativeLang}&tl=ru&dt=t&q=${encodeURIComponent(englishText)}`;
          const gtRes = await fetch(googleTranslateUrl);
          if (!gtRes.ok) {
            throw new Error("Failed to contact translation service.");
          }
          const gtData = await gtRes.json();
          let russianWord = gtData && gtData[0] && gtData[0][0] && gtData[0][0][0] 
            ? gtData[0][0][0].trim() 
            : "";
            
          if (!russianWord) {
            throw new Error("Could not find a Russian translation for this word.");
          }

          russianWord = russianWord.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim().toLowerCase();
          if (!russianWord) {
            throw new Error("Invalid Russian translation returned.");
          }

          const capitalizedRu = russianWord.charAt(0).toUpperCase() + russianWord.slice(1);

          document.getElementById("edit-word-input").value = capitalizedRu;
          document.getElementById("edit-accented-input").value = capitalizedRu;
          document.getElementById("edit-translit-input").value = transliterateWord(russianWord);
          document.getElementById("edit-pos-input").value = "noun";
          document.getElementById("edit-exampleru-input").value = "";
          document.getElementById("edit-exampleen-input").value = "";
          document.getElementById("edit-level-input").value = "A1";
        }

        // Visual success pulse
        const inputs = [
          "edit-word-input", "edit-accented-input", "edit-translation-input", "edit-translit-input",
          "edit-pos-input", "edit-category-input", "edit-level-input", "edit-exampleru-input", "edit-exampleen-input"
        ];
        inputs.forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            el.style.borderColor = "var(--color-success)";
            setTimeout(() => el.style.borderColor = "", 1000);
          }
        });

      } catch (err) {
        alert(`Reverse Auto-fill Error: ${err.message || "Failed to translate word. Please fill details manually."}`);
      } finally {
        reverseAutofillBtn.disabled = false;
        statusEl.style.display = "none";
      }
    });

    // Edit Modal dynamic blur triggers
    document.getElementById("edit-word-input").addEventListener("blur", () => {
      const word = document.getElementById("edit-word-input").value.trim();
      const translation = document.getElementById("edit-translation-input").value.trim();
      const autofillBtn = document.getElementById("modal-edit-autofill-btn");
      if (word && !translation && !autofillBtn.disabled) {
        autofillBtn.click();
      }
    });

    document.getElementById("edit-translation-input").addEventListener("blur", () => {
      const word = document.getElementById("edit-word-input").value.trim();
      const translation = document.getElementById("edit-translation-input").value.trim();
      const reverseAutofillBtn = document.getElementById("modal-edit-reverse-autofill-btn");
      if (translation && !word && !reverseAutofillBtn.disabled) {
        reverseAutofillBtn.click();
      }
    });

    // Add Form Submit
    document.getElementById("add-word-form").addEventListener("submit", () => {
      const word = document.getElementById("add-word-input").value;
      const accented = document.getElementById("add-accented-input").value;
      const translation = document.getElementById("add-translation-input").value;
      const translit = document.getElementById("add-translit-input").value;
      const pos = document.getElementById("add-pos-input").value;
      const category = document.getElementById("add-category-input").value;
      const level = document.getElementById("add-level-input").value;
      const exampleRu = document.getElementById("add-exampleru-input").value;
      const exampleEn = document.getElementById("add-exampleen-input").value;

      const added = SRS.addCustomWord({
        word, accented, translation, transliteration: translit, pos, category, level, exampleRu, exampleEn
      });

      if (added) {
        closeModal("modal-add-word");
        // Reset form
        document.getElementById("add-word-form").reset();
        populateDecksDropdowns();
        renderDictionary();
      }
    });

    // Edit Form Submit
    document.getElementById("edit-word-form").addEventListener("submit", () => {
      const id = document.getElementById("edit-word-id").value;
      const word = document.getElementById("edit-word-input").value;
      const accented = document.getElementById("edit-accented-input").value;
      const translation = document.getElementById("edit-translation-input").value;
      const translit = document.getElementById("edit-translit-input").value;
      const pos = document.getElementById("edit-pos-input").value;
      const category = document.getElementById("edit-category-input").value;
      const level = document.getElementById("edit-level-input").value;
      const exampleRu = document.getElementById("edit-exampleru-input").value;
      const exampleEn = document.getElementById("edit-exampleen-input").value;

      const updated = SRS.editWord(id, {
        word, accented, translation, transliteration: translit, pos, category, level, exampleRu, exampleEn
      });

      if (updated) {
        closeModal("modal-edit-word");
        renderDictionary();

        // If we are currently studying, update the active card details in real time
        if (views["study-active"].classList.contains("active") && currentCard && currentCard.id === id) {
          const newCardData = SRS.getWord(id);
          if (newCardData) {
            sessionDeck[sessionIndex] = newCardData;
            currentCard = newCardData;

            // Re-render the active view mode
            if (currentStudyMode === "flashcard") {
              setupFlashcardLayout();
            } else if (currentStudyMode === "choice") {
              setupChoiceLayout();
            } else if (currentStudyMode === "writing") {
              setupWritingLayout();
            }
          }
        }
      }
    });
  }

  const modalPreviousFocus = new Map();

  function openModal(id) {
    const modal = modals[id] || document.getElementById(id);
    if (!modal) return;
    modalPreviousFocus.set(id, document.activeElement);
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    setTimeout(() => {
      const focusTarget = modal.querySelector(".modal-close-btn, button, input, select, textarea, [tabindex]:not([tabindex='-1'])");
      if (focusTarget) focusTarget.focus();
    }, 0);
  }

  function closeModal(id) {
    const modal = modals[id] || document.getElementById(id);
    if (!modal) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    const previousFocus = modalPreviousFocus.get(id);
    if (previousFocus && document.contains(previousFocus)) previousFocus.focus();
    modalPreviousFocus.delete(id);
  }

  window.openModal = openModal;
  window.closeModal = closeModal;

  function openEditWordModal(id) {
    const card = SRS.getWord(id);
    if (!card) return;

    document.getElementById("edit-word-id").value = card.id;
    document.getElementById("edit-word-input").value = card.word;
    document.getElementById("edit-accented-input").value = card.accented || card.word;
    document.getElementById("edit-translation-input").value = card.translation;
    document.getElementById("edit-translit-input").value = card.transliteration || "";
    document.getElementById("edit-pos-input").value = card.pos || "noun";
    document.getElementById("edit-category-input").value = card.category || "Custom";
    document.getElementById("edit-level-input").value = SRS.getWordLevel(card);
    document.getElementById("edit-exampleru-input").value = card.exampleRu || card.example_ru || "";
    document.getElementById("edit-exampleen-input").value = card.exampleEn || card.example_en || "";

    openModal("modal-edit-word");
  }

  async function openWordDetailsModal(cardId) {
    // Check if user is logged in first
    if (!window.SupabaseSync || window.SupabaseSync.connectionState !== "connected" || !window.SupabaseSync.user) {
      openModal("modal-grammar-cta");
      return;
    }

    const card = SRS.getWord(cardId);
    if (!card) return;

    openModal("modal-word-details");

    const loadingEl = document.getElementById("details-loading");
    const contentEl = document.getElementById("details-content");
    const titleEl = document.getElementById("details-modal-title");
    const ruWordEl = document.getElementById("details-ru-word");
    const posBadgeEl = document.getElementById("details-pos-badge");
    const translationTextEl = document.getElementById("details-translation-text");
    const ttsBtn = document.getElementById("details-tts-btn");
    const tablesContainer = document.getElementById("details-tables-container");

    loadingEl.style.display = "flex";
    contentEl.style.display = "none";
    tablesContainer.innerHTML = "";

    titleEl.innerText = `Inflections: ${card.word}`;
    ruWordEl.innerText = card.accented || card.word;
    posBadgeEl.innerText = card.pos || "Noun";
    translationTextEl.innerText = `Translation: ${card.translation}`;

    // Speak button
    ttsBtn.onclick = () => {
      AudioEngine.speak(card.word);
    };

    // Cache key
    const cacheKey = "voc_word_inflections_cache";
    let inflectionsCache = {};
    try {
      inflectionsCache = JSON.parse(localStorage.getItem(cacheKey)) || {};
    } catch (e) {
      console.warn("Failed to parse inflections cache", e);
    }

    const wordKey = `${card.word.toLowerCase()}_${(card.pos || "noun").toLowerCase()}`;

    if (inflectionsCache[wordKey]) {
      renderInflections(inflectionsCache[wordKey]);
      return;
    }

    try {
      const client = window.SupabaseSync.client;
      if (!client) throw new Error("Database client not available.");
      
      const { data: sessionData } = await client.auth.getSession();
      const token = sessionData?.session?.access_token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const nativeLang = SRS.getSetting("nativeLanguage", "en") || "en";
      const { data, error } = await client.functions.invoke("ai-grammar", {
        body: { action: "inflections", word: card.word, pos: card.pos || "noun", nativeLanguage: nativeLang },
        headers: headers
      });

      if (error) throw new Error(error.message || error);
      if (!data || !data.success || !data.data) throw new Error("Invalid response payload from inflections engine.");

      const result = data.data;
      
      // Save cache
      try {
        inflectionsCache[wordKey] = result;
        localStorage.setItem(cacheKey, JSON.stringify(inflectionsCache));
      } catch (cacheErr) {
        console.warn("Failed to write to inflections cache:", cacheErr);
      }

      renderInflections(result);

    } catch (err) {
      loadingEl.style.display = "none";
      console.error("Failed to load inflections:", err);
      tablesContainer.innerHTML = `<div style="color:var(--color-error); padding: 1.5rem 0; text-align: center;">Error loading inflections: ${escapeHTML(err.message || err)}</div>`;
      contentEl.style.display = "flex";
    }

    function renderInflections(data) {
      loadingEl.style.display = "none";
      contentEl.style.display = "flex";
      tablesContainer.innerHTML = "";

      if (data.type === "not_applicable") {
        tablesContainer.innerHTML = `<div class="inflection-not-applicable">${escapeHTML(data.message || "This word does not undergo declension or conjugation.")}</div>`;
        return;
      }

      if (data.type === "conjugation" && data.forms) {
        // Render present/future tense table
        if (Array.isArray(data.forms.presentFuture) && data.forms.presentFuture.length > 0) {
          const pfTitle = document.createElement("div");
          pfTitle.className = "inflection-table-title";
          pfTitle.innerText = "Present / Future Tense Conjugation";
          tablesContainer.appendChild(pfTitle);

          const pfWrapper = document.createElement("div");
          pfWrapper.className = "inflection-table-wrapper";
          pfWrapper.innerHTML = `
            <table class="inflection-table">
              <thead>
                <tr>
                  <th style="width: 30%;">Pronoun</th>
                  <th style="width: 40%;">Conjugated Form</th>
                  <th style="width: 30%;">Translation</th>
                </tr>
              </thead>
              <tbody>
                ${data.forms.presentFuture.map(f => `
                  <tr>
                    <td><strong>${escapeHTML(f.pronoun)}</strong></td>
                    <td class="clickable-ru-word-wrap">${escapeHTML(f.form)}</td>
                    <td>${escapeHTML(f.english)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          `;
          tablesContainer.appendChild(pfWrapper);
        }

        // Render past tense table
        if (Array.isArray(data.forms.past) && data.forms.past.length > 0) {
          const pastTitle = document.createElement("div");
          pastTitle.className = "inflection-table-title";
          pastTitle.innerText = "Past Tense Forms";
          tablesContainer.appendChild(pastTitle);

          const pastWrapper = document.createElement("div");
          pastWrapper.className = "inflection-table-wrapper";
          pastWrapper.innerHTML = `
            <table class="inflection-table">
              <thead>
                <tr>
                  <th style="width: 30%;">Gender/Number</th>
                  <th style="width: 40%;">Form</th>
                  <th style="width: 30%;">Translation</th>
                </tr>
              </thead>
              <tbody>
                ${data.forms.past.map(f => `
                  <tr>
                    <td><strong>${escapeHTML(f.gender)}</strong></td>
                    <td class="clickable-ru-word-wrap">${escapeHTML(f.form)}</td>
                    <td>${escapeHTML(f.english)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          `;
          tablesContainer.appendChild(pastWrapper);
        }

        // Render imperative table
        if (Array.isArray(data.forms.imperative) && data.forms.imperative.length > 0) {
          const impTitle = document.createElement("div");
          impTitle.className = "inflection-table-title";
          impTitle.innerText = "Imperative Mood";
          tablesContainer.appendChild(impTitle);

          const impWrapper = document.createElement("div");
          impWrapper.className = "inflection-table-wrapper";
          impWrapper.innerHTML = `
            <table class="inflection-table">
              <thead>
                <tr>
                  <th style="width: 30%;">Type</th>
                  <th style="width: 40%;">Form</th>
                  <th style="width: 30%;">Translation</th>
                </tr>
              </thead>
              <tbody>
                ${data.forms.imperative.map(f => `
                  <tr>
                    <td><strong>${escapeHTML(f.type)}</strong></td>
                    <td class="clickable-ru-word-wrap">${escapeHTML(f.form)}</td>
                    <td>${escapeHTML(f.english)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          `;
          tablesContainer.appendChild(impWrapper);
        }
      }

      if (data.type === "declension" && data.forms && Array.isArray(data.forms.declensions)) {
        const decTitle = document.createElement("div");
        decTitle.className = "inflection-table-title";
        decTitle.innerText = "Case Declensions";
        tablesContainer.appendChild(decTitle);

        const decWrapper = document.createElement("div");
        decWrapper.className = "inflection-table-wrapper";
        decWrapper.innerHTML = `
          <table class="inflection-table">
            <thead>
              <tr>
                <th style="width: 40%;">Case</th>
                <th style="width: 30%;">Singular</th>
                <th style="width: 30%;">Plural</th>
              </tr>
            </thead>
            <tbody>
              ${data.forms.declensions.map(f => `
                <tr>
                  <td><strong>${escapeHTML(f.case)}</strong></td>
                  <td class="clickable-ru-word-wrap">${escapeHTML(f.singular)}</td>
                  <td class="clickable-ru-word-wrap">${escapeHTML(f.plural)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
        tablesContainer.appendChild(decWrapper);
      }

      // Wrap Cyrillic words in inflections tables for clickable audio and translation tooltips
      tablesContainer.querySelectorAll(".clickable-ru-word-wrap").forEach(td => {
        const text = td.innerText.trim();
        if (text && text !== "-" && text !== "N/A" && text !== "none" && text !== "—") {
          td.innerHTML = window.wrapCyrillicWords ? window.wrapCyrillicWords(text) : `<span class="clickable-ru-word">${text}</span>`;
        }
      });
    }
  }

  // --- KEYBOARD SHORTCUTS ENGINE ---
  function setupGlobalShortcuts() {
    window.addEventListener("keydown", (e) => {
      // Avoid firing hotkeys when user is writing in inputs, selects, textareas
      const activeEl = document.activeElement;
      if (activeEl && (
          activeEl.tagName === "INPUT" || 
          activeEl.tagName === "SELECT" || 
          activeEl.tagName === "TEXTAREA"
      )) {
        // Exception: Enter on writing mode text input runs check
        if (e.key === "Enter" && activeEl.id === "writing-user-input") {
          e.preventDefault();
          handleWritingSubmit();
        }
        return;
      }

      // Check if Study section is currently active
      if (!views["study-active"].classList.contains("active")) {
        return;
      }

      // 1. FLASHCARD SHORTCUTS
      if (currentStudyMode === "flashcard" && document.getElementById("study-sub-flashcard").style.display !== "none") {
        if (e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          flipFlashcard();
        }
        else if (isCardFlipped) {
          if (e.key === "1") {
            e.preventDefault();
            handleSrsScore(false, "hard");
          } else if (e.key === "2") {
            e.preventDefault();
            handleSrsScore(true, "good"); // good review
          } else if (e.key === "3") {
            e.preventDefault();
            handleSrsScore(true, "easy"); // easy review
          }
        }
      }

      // 2. MULTIPLE CHOICE SHORTCUTS
      else if (currentStudyMode === "choice" && document.getElementById("study-sub-choice").style.display !== "none") {
        const nextBtn = document.getElementById("choice-next-btn");
        if (nextBtn.style.display === "block") {
          if (e.key === " " || e.key === "Spacebar" || e.key === "Enter") {
            e.preventDefault();
            showNextCard();
          }
        } else {
          // Choice select via keys 1-4
          if (["1", "2", "3", "4"].includes(e.key)) {
            const index = parseInt(e.key, 10) - 1;
            const container = document.getElementById("choices-container");
            const buttons = container.querySelectorAll(".choice-btn");
            if (buttons[index] && !buttons[index].classList.contains("disabled")) {
              e.preventDefault();
              buttons[index].click();
            }
          }
        }
      }

      // 3. WRITING SHORTCUTS (when focus is outside input)
      else if (currentStudyMode === "writing" && document.getElementById("study-sub-writing").style.display !== "none") {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleWritingSubmit();
        }
      }
    });
  }
  // Cyrillic to Latin Transliteration helper for autofill
  const translitMap = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z',
    'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
    'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ъ': '', 'ы': 'y', 'ь': "'", 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };
  function transliterateWord(text) {
    return text.toLowerCase().split('').map(char => {
      if (char === '\u0301') return '';
      return translitMap[char] !== undefined ? translitMap[char] : char;
    }).join('');
  }

  // --- FIRST-RUN ONBOARDING CONTROLLER ---
  const ONBOARDING_STORAGE_KEY = "voc_onboarding_completed_v1";
  const ONBOARDING_PENDING_TARGET_KEY = "voc_onboarding_pending_target";
  const ONBOARDING_DESTINATIONS = {
    alphabet: "Your first stop: Cyrillic alphabet",
    assessment: "Your first stop: CEFR level assessment",
    "study-select": "Your first stop: vocabulary practice"
  };
  let onboardingStep = 0;
  let onboardingStartTarget = "alphabet";

  let onboardingAuthMode = "signup";
  let onboardingReplayMode = false;
  let onboardingRequired = false;
  function setupOnboarding() {
    const modal = document.getElementById("onboarding-modal");
    const nextBtn = document.getElementById("onboarding-next-btn");
    const backBtn = document.getElementById("onboarding-back-btn");
    const skipBtn = document.getElementById("onboarding-skip-btn");
    const authForm = document.getElementById("onboarding-auth-form");
    const authModeToggle = document.getElementById("onboarding-auth-mode-toggle");
    const googleBtn = document.getElementById("onboarding-google-btn");
    if (!modal || !nextBtn || !backBtn || !skipBtn || !authForm) return;

    nextBtn.addEventListener("click", async () => {
      if (onboardingStep < 2) {
        onboardingStep += 1;
        renderOnboardingStep();
      } else if (onboardingStep === 2) {
        if (onboardingReplayMode || window.SupabaseSync?.user) {
          completeOnboarding(onboardingStartTarget);
        } else {
          showOnboardingAuth("signup");
        }
      } else {
        await submitOnboardingAuth();
      }
    });

    backBtn.addEventListener("click", () => {
      if (onboardingStep > 0) {
        onboardingStep -= 1;
        renderOnboardingStep();
      } else {
        dismissOnboarding();
      }
    });

    skipBtn.addEventListener("click", () => {
      if (onboardingReplayMode) {
        completeOnboarding("dashboard");
      } else {
        showOnboardingAuth(onboardingStep === 3 && onboardingAuthMode === "login" ? "signup" : "login");
      }
    });

    authForm.addEventListener("submit", async event => {
      event.preventDefault();
      await submitOnboardingAuth();
    });

    authModeToggle?.addEventListener("click", () => {
      setOnboardingAuthMode(onboardingAuthMode === "signup" ? "login" : "signup");
      document.getElementById("onboarding-email")?.focus();
    });

    googleBtn?.addEventListener("click", async () => {
      const errorEl = document.getElementById("onboarding-auth-error");
      if (errorEl) errorEl.textContent = "";
      localStorage.setItem(ONBOARDING_PENDING_TARGET_KEY, onboardingStartTarget);
      googleBtn.disabled = true;
      googleBtn.textContent = "Opening Google sign-in...";
      try {
        await window.SupabaseSync.signInWithGoogle();
      } catch (error) {
        localStorage.removeItem(ONBOARDING_PENDING_TARGET_KEY);
        if (errorEl) errorEl.textContent = error.message || "Google sign-in could not be started.";
        googleBtn.disabled = false;
        googleBtn.textContent = "Continue with Google";
      }
    });

    modal.querySelectorAll(".onboarding-path").forEach(path => {
      path.addEventListener("click", () => {
        onboardingStartTarget = path.dataset.startTarget || "alphabet";
        modal.querySelectorAll(".onboarding-path").forEach(option => {
          const selected = option === path;
          option.classList.toggle("active", selected);
          option.setAttribute("aria-checked", selected ? "true" : "false");
        });
        updateOnboardingDestination();
      });
    });

    document.addEventListener("keydown", event => {
      if (!modal.classList.contains("active")) return;
      if (event.key === "Escape" && onboardingReplayMode) {
        dismissOnboarding();
      } else if (event.key === "Escape" && onboardingStep > 0) {
        onboardingStep -= 1;
        renderOnboardingStep();
      } else if (event.key === "Escape") {
        dismissOnboarding();
      } else if (event.key === "ArrowLeft" && onboardingStep > 0) {
        onboardingStep -= 1;
        renderOnboardingStep();
      } else if (event.key === "ArrowRight" && onboardingStep < 2) {
        onboardingStep += 1;
        renderOnboardingStep();
      }
    });
  }

  function openOnboarding(isReplay = false) {
    const modal = document.getElementById("onboarding-modal");
    if (!modal) return;
    if (!isReplay && localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true") {
      switchView("dashboard");
      return;
    }

    onboardingReplayMode = isReplay;
    onboardingStep = 0;
    onboardingStartTarget = "alphabet";
    onboardingAuthMode = "signup";
    const emailInput = document.getElementById("onboarding-email");
    const passwordInput = document.getElementById("onboarding-password");
    const errorEl = document.getElementById("onboarding-auth-error");
    if (emailInput) emailInput.value = "";
    if (passwordInput) passwordInput.value = "";
    if (errorEl) errorEl.textContent = "";
    modal.querySelectorAll(".onboarding-path").forEach((option, index) => {
      option.classList.toggle("active", index === 0);
      option.setAttribute("aria-checked", index === 0 ? "true" : "false");
    });
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("onboarding-open");
    renderOnboardingStep();
    setTimeout(() => document.getElementById("onboarding-next-btn")?.focus(), 0);
  }

  function renderOnboardingStep() {
    const modal = document.getElementById("onboarding-modal");
    if (!modal) return;
    modal.querySelectorAll("[data-onboarding-step]").forEach((step, index) => {
      step.classList.toggle("active", index === onboardingStep);
    });
    modal.querySelectorAll("[data-onboarding-progress]").forEach((bar, index) => {
      bar.classList.toggle("active", index <= onboardingStep);
    });

    const backBtn = document.getElementById("onboarding-back-btn");
    const nextBtn = document.getElementById("onboarding-next-btn");
    const skipBtn = document.getElementById("onboarding-skip-btn");
    nextBtn.textContent = onboardingStep === 0
      ? "Show me how it works"
      : onboardingStep === 1
        ? "Build my learning path"
        : onboardingStep === 2
          ? (onboardingReplayMode || window.SupabaseSync?.user ? "Start learning Russian" : "Save my learning path")
          : (onboardingAuthMode === "signup" ? "Create free account" : "Sign in and continue");
    skipBtn.textContent = onboardingReplayMode
      ? "Close tour"
      : (onboardingStep === 3 && onboardingAuthMode === "login" ? "Create an account" : "Already have an account?");
    updateOnboardingDestination();
  }

  function updateOnboardingDestination() {
    const destination = document.getElementById("onboarding-destination");
    if (destination) {
      destination.textContent = ONBOARDING_DESTINATIONS[onboardingStartTarget];
    }
  }

  function showOnboardingAuth(mode) {
    onboardingStep = 3;
    setOnboardingAuthMode(mode);
    renderOnboardingStep();
    setTimeout(() => document.getElementById("onboarding-email")?.focus(), 0);
  }

  function setOnboardingAuthMode(mode) {
    onboardingAuthMode = mode === "login" ? "login" : "signup";
    const title = document.getElementById("onboarding-account-title");
    const copy = document.getElementById("onboarding-account-copy");
    const password = document.getElementById("onboarding-password");
    const toggle = document.getElementById("onboarding-auth-mode-toggle");
    const error = document.getElementById("onboarding-auth-error");

    if (title) title.textContent = onboardingAuthMode === "signup" ? "Create your free account." : "Welcome back.";
    if (copy) {
      copy.textContent = onboardingAuthMode === "signup"
        ? "Keep your Russian progress safe and continue learning across all your devices."
        : "Sign in to restore your progress and continue with your selected learning path.";
    }
    if (password) password.autocomplete = onboardingAuthMode === "signup" ? "new-password" : "current-password";
    if (toggle) toggle.textContent = onboardingAuthMode === "signup" ? "Already registered? Sign in" : "New to Privyetik? Create an account";
    if (error) error.textContent = "";
    renderOnboardingStep();
  }

  async function submitOnboardingAuth() {
    const emailInput = document.getElementById("onboarding-email");
    const passwordInput = document.getElementById("onboarding-password");
    const errorEl = document.getElementById("onboarding-auth-error");
    const nextBtn = document.getElementById("onboarding-next-btn");
    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value || "";

    if (!email || !emailInput.validity.valid) {
      errorEl.textContent = "Enter a valid email address.";
      emailInput?.focus();
      return;
    }
    if (password.length < 6) {
      errorEl.textContent = "Password must be at least 6 characters long.";
      passwordInput?.focus();
      return;
    }
    if (!window.SupabaseSync?.client) {
      errorEl.textContent = "Account services are still connecting. Please try again in a moment.";
      return;
    }

    errorEl.textContent = "";
    nextBtn.disabled = true;
    nextBtn.textContent = onboardingAuthMode === "signup" ? "Creating account..." : "Signing in...";

    try {
      if (onboardingAuthMode === "signup") {
        const result = await window.SupabaseSync.signUp(email, password);
        completeOnboarding(onboardingStartTarget);
        if (!result.session) {
          alert("Account created! Check your email to verify your address, then sign in to enable cloud sync.");
        }
      } else {
        await window.SupabaseSync.signIn(email, password);
        completeOnboarding(onboardingStartTarget);
      }
    } catch (error) {
      errorEl.textContent = error.message || "We could not create your account. Please try again.";
    } finally {
      nextBtn.disabled = false;
      if (document.getElementById("onboarding-modal")?.classList.contains("active")) {
        renderOnboardingStep();
      }
    }
  }

  window.completePendingOnboardingSignup = function () {
    const pendingTarget = localStorage.getItem(ONBOARDING_PENDING_TARGET_KEY);
    if (!pendingTarget) return;
    completeOnboarding(pendingTarget);
  };

  function dismissOnboarding() {
    const modal = document.getElementById("onboarding-modal");
    if (modal) {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("onboarding-open");

    const returnView = onboardingReplayMode ? "settings" : "landing";
    switchView(returnView);
    setTimeout(() => {
      const focusTarget = onboardingReplayMode
        ? document.getElementById("settings-replay-onboarding-btn")
        : document.getElementById("landing-cta-start");
      focusTarget?.focus({ preventScroll: true });
    }, 0);
  }

  function completeOnboarding(targetViewId) {
    const modal = document.getElementById("onboarding-modal");
    onboardingRequired = false;
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    localStorage.removeItem(ONBOARDING_PENDING_TARGET_KEY);
    if (modal) {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("onboarding-open");

    if (targetViewId === "assessment") {
      switchView("dashboard");
      setTimeout(() => {
        document.getElementById("placement-banner-start-btn")?.click();
        document.getElementById("placement-start-test-btn")?.focus();
      }, 0);
    } else {
      const destinationView = targetViewId || "dashboard";
      switchView(destinationView);
      setTimeout(() => {
        const heading = views[destinationView]?.querySelector(".page-title, h1");
        if (heading) {
          heading.setAttribute("tabindex", "-1");
          heading.focus({ preventScroll: true });
        }
      }, 0);
    }
  }

  // --- LANDING PAGE CONTROLLER ---

  // Hardcoded fallback words shown before the deck is loaded
  const _demoFallback = [
    { word: "Здравствуйте!", pos: "phrase",  translation: "Hello / How do you do",  translit: "[zdrav-stvuy-te]",   exampleRu: "Здравствуйте, как ваши дела?",  exampleEn: "Hello, how are you doing?" },
    { word: "Спасибо",       pos: "noun",    translation: "Thank you",               translit: "[spa-see-ba]",       exampleRu: "Большое спасибо за помощь!",   exampleEn: "Thank you very much for your help!" },
    { word: "Пожалуйста",    pos: "adverb",  translation: "Please / You're welcome", translit: "[pa-zhal-oo-ysta]", exampleRu: "Дайте, пожалуйста, воды.",      exampleEn: "Please give me some water." },
    { word: "Друг",          pos: "noun",    translation: "Friend",                  translit: "[droog]",            exampleRu: "Он мой лучший друг.",           exampleEn: "He is my best friend." },
    { word: "Любовь",        pos: "noun",    translation: "Love",                    translit: "[lyu-bof']",         exampleRu: "Любовь спасёт мир.",            exampleEn: "Love will save the world." }
  ];

  // Returns a shuffled pool of up to 10 words from the live deck, or the fallback set
  function buildDemoWords() {
    const all = (typeof SRS !== "undefined" && SRS.getAllWords) ? SRS.getAllWords() : [];
    if (!all || all.length === 0) return _demoFallback;
    const pool = all.slice().sort(() => Math.random() - 0.5);
    return pool.map(w => ({
      word:        w.word            || "",
      pos:         w.pos             || "word",
      translation: w.translation     || "",
      translit:    w.transliteration || "",
      exampleRu:   w.exampleRu       || "",
      exampleEn:   w.exampleEn       || ""
    }));
  }

  let demoWords = _demoFallback;
  let demoIndex = 0;


  function setupLandingPage() {
    // Refresh demo word pool from live deck on every landing page visit
    demoWords = buildDemoWords();
    demoIndex = 0;
    loadDemoWord(demoWords[0]);

    const ctaStart = document.getElementById("landing-cta-start");

    if (ctaStart) {
      ctaStart.addEventListener("click", () => {
        if (localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true") {
          switchView("dashboard");
        } else {
          openOnboarding();
        }
      });
    }

    const demoCard = document.getElementById("landing-demo-card");
    if (demoCard) {
      demoCard.addEventListener("click", (e) => {
        // Prevent flipping if clicking audio button
        if (e.target.closest("#demo-audio-btn")) return;
        demoCard.classList.toggle("flipped");
      });
    }

    const demoAudioBtn = document.getElementById("demo-audio-btn");
    if (demoAudioBtn) {
      demoAudioBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Stop card flip trigger
        const word = demoWords[demoIndex].word;
        if (window.AudioEngine) {
          AudioEngine.speak(word);
        }
      });
    }

    const ratingButtons = document.querySelectorAll(".demo-rating-btn");
    ratingButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const rating = btn.getAttribute("data-rating");
        handleDemoRating(rating);
      });
    });

    const welcomeAddBtn = document.getElementById("welcome-add-to-deck-btn");
    if (welcomeAddBtn) {
      welcomeAddBtn.addEventListener("click", () => {
        const demoWord = demoWords[demoIndex];
        const cleanWord = demoWord.word.replace(/[!?,.]/g, '').trim().toLowerCase();
        const dictWord = SRS.getAllWords().find(w => w.word.replace(/[!?,.]/g, '').trim().toLowerCase() === cleanWord);
        
        if (dictWord) {
          const prog = SRS.getCardProgress(dictWord.id);
          prog.starred = true;
          prog.nextReview = Date.now();
          prog.hidden = false;
          SRS.saveToStorage(dictWord.id, prog);
          alert(`"${dictWord.word}" added to review queue and starred!`);
        } else {
          // If not in database, add as custom word
          const added = SRS.addCustomWord({
            word: demoWord.word,
            translation: demoWord.translation,
            transliteration: demoWord.translit ? demoWord.translit.replace(/[\[\]]/g, '') : "",
            pos: demoWord.pos,
            category: "Greetings",
            exampleRu: demoWord.exampleRu,
            exampleEn: demoWord.exampleEn
          });
          alert(`"${added.word}" added to review queue as custom word!`);
        }
        
        const container = document.getElementById("demo-xp-container");
        if (container) {
          const toast = document.createElement("div");
          toast.className = "xp-toast";
          toast.innerText = "Added! ✨";
          container.appendChild(toast);
          setTimeout(() => toast.remove(), 1200);
        }
        
        renderDashboard();
      });
    }
  }

  function handleDemoRating(rating) {
    const demoCard = document.getElementById("landing-demo-card");
    const container = document.getElementById("demo-xp-container");
    if (!demoCard || !container) return;

    // 1. Show XP Toast
    const toast = document.createElement("div");
    toast.className = "xp-toast";
    toast.innerText = "+10 XP";
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 1200);

    // 2. Cycle word
    demoIndex = (demoIndex + 1) % demoWords.length;
    const nextWord = demoWords[demoIndex];
    
    if (demoCard.classList.contains("flipped")) {
      // Unflip card
      demoCard.classList.remove("flipped");
      // Wait for card to face forward before changing content
      setTimeout(() => {
        loadDemoWord(nextWord);
      }, 250);
    } else {
      loadDemoWord(nextWord);
    }
  }

  function loadDemoWord(w) {
    const pos = document.getElementById("demo-card-pos");
    const word = document.getElementById("demo-card-word");
    const translit = document.getElementById("demo-card-translit");
    const wordBack = document.getElementById("demo-card-word-back");
    const translation = document.getElementById("demo-card-translation");
    const exampleRu = document.getElementById("demo-card-example-ru");
    const exampleEn = document.getElementById("demo-card-example-en");

    if (pos) pos.innerText = w.pos;
    if (word) word.innerText = w.word;
    if (translit) translit.innerText = w.translit;
    if (wordBack) wordBack.innerText = w.word;
    if (translation) translation.innerText = w.translation;
    if (exampleRu) exampleRu.innerText = w.exampleRu;
    if (exampleEn) exampleEn.innerText = w.exampleEn;
  }

  function applyTheme(theme) {
    // Clear existing theme classes
    document.body.classList.remove("theme-midnight", "theme-emerald", "theme-cyberpunk", "theme-light", "theme-privyetik");
    // Add selected theme class
    // privyetik is the CSS base — no class needed; all other themes need a class
    if (theme !== "privyetik") {
      document.body.classList.add(`theme-${theme}`);
    }
  }

  // --- DAILY REMINDERS CONTROLLER ---
  async function initDailyReminders() {
    const remindersToggle = document.getElementById("settings-reminders-enabled");
    const reminderTimeInput = document.getElementById("settings-reminder-time");

    if (!remindersToggle || !reminderTimeInput) return;

    // Load saved settings
    const remindersEnabled = SRS.getSetting("dailyReminders", true);
    const reminderTime = SRS.getSetting("reminderTime", "19:00");

    remindersToggle.checked = remindersEnabled && Notification.permission === "granted";
    reminderTimeInput.value = reminderTime;

    // Update status text based on permission
    updateReminderStatusText();

    // Show/hide dashboard notification opt-in banner
    const notificationBanner = document.getElementById("dashboard-notification-banner");
    const bannerEnableBtn = document.getElementById("notification-banner-enable-btn");
    const bannerDismissBtn = document.getElementById("notification-banner-dismiss-btn");

    if (notificationBanner) {
      const bannerDismissed = localStorage.getItem("voc_notification_banner_dismissed") === "true";
      if ("Notification" in window && Notification.permission === "default" && remindersEnabled && !bannerDismissed) {
        notificationBanner.style.display = "flex";
      } else {
        notificationBanner.style.display = "none";
      }

      if (bannerEnableBtn) {
        bannerEnableBtn.addEventListener("click", async () => {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            SRS.setSetting("dailyReminders", true);
            remindersToggle.checked = true;
            updateReminderStatusText();
            await syncReminderStateToCache();

            // Test notification
            try {
              new Notification("🔔 Daily Reminders Active!", {
                body: `We'll remind you daily at ${reminderTimeInput.value} to practice your Russian words!`,
                icon: "./logo.jpeg"
              });
            } catch (e) {
              console.warn("Failed to trigger test notification:", e);
            }

            // Sync push subscription with Supabase cloud
            await window.syncPushSubscriptionWithCloud();

            // Register background periodic sync
            registerPeriodicSync();
          } else {
            remindersToggle.checked = false;
            SRS.setSetting("dailyReminders", false);
            updateReminderStatusText();
            if (permission === "denied") {
              alert("Notification permission was denied. If you want to receive study reminders, please enable notifications in your browser settings.");
            }
          }
          notificationBanner.style.display = "none";
        });
      }

      if (bannerDismissBtn) {
        bannerDismissBtn.addEventListener("click", () => {
          localStorage.setItem("voc_notification_banner_dismissed", "true");
          notificationBanner.style.display = "none";
        });
      }
    }

    // Show/hide dashboard notification opt-in popup
    const notificationPopup = document.getElementById("modal-notification-prompt");
    const popupEnableBtn = document.getElementById("notification-prompt-enable-btn");
    const popupCloseBtn = document.getElementById("notification-prompt-close-btn");
    const popupReminderTimeInput = document.getElementById("popup-reminder-time");

    if (notificationPopup) {
      const popupDismissed = localStorage.getItem("voc_notification_popup_dismissed") === "true";
      
      if ("Notification" in window && Notification.permission === "default" && !popupDismissed) {
        setTimeout(() => {
          const currentView = document.querySelector(".view-section.active")?.id;
          if (currentView === "view-dashboard" || currentView === "view-landing") {
            notificationPopup.classList.add("active");
          }
        }, 1500);
      }

      if (popupEnableBtn) {
        popupEnableBtn.addEventListener("click", async () => {
          const selectedTime = popupReminderTimeInput ? popupReminderTimeInput.value : "19:00";
          const permission = await Notification.requestPermission();
          
          if (permission === "granted") {
            SRS.setSetting("dailyReminders", true);
            SRS.setSetting("reminderTime", selectedTime);
            
            remindersToggle.checked = true;
            reminderTimeInput.value = selectedTime;
            updateReminderStatusText();
            await syncReminderStateToCache();

            try {
              new Notification("🔔 Daily Reminders Active!", {
                body: `We'll remind you daily at ${selectedTime} to practice your Russian words!`,
                icon: "./logo.jpeg"
              });
            } catch (e) {
              console.warn("Failed to trigger test notification:", e);
            }

            await window.syncPushSubscriptionWithCloud();
            registerPeriodicSync();
          } else {
            remindersToggle.checked = false;
            SRS.setSetting("dailyReminders", false);
            updateReminderStatusText();
            if (permission === "denied") {
              alert("Notification permission was denied. If you want to receive study reminders, please enable notifications in your browser settings.");
            }
          }
          
          notificationPopup.classList.remove("active");
          localStorage.setItem("voc_notification_popup_dismissed", "true");
        });
      }

      if (popupCloseBtn) {
        popupCloseBtn.addEventListener("click", () => {
          notificationPopup.classList.remove("active");
          localStorage.setItem("voc_notification_popup_dismissed", "true");
        });
      }
    }

    // Set up settings change listeners
    remindersToggle.addEventListener("change", async () => {
      const enabled = remindersToggle.checked;
      if (enabled) {
        // Request Notification permission
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          SRS.setSetting("dailyReminders", true);
          updateReminderStatusText();
          await syncReminderStateToCache();
          
          // Test notification
          try {
            new Notification("🔔 Daily Reminders Active!", {
              body: `We'll remind you daily at ${reminderTimeInput.value} to practice your Russian words!`,
              icon: "./logo.jpeg"
            });
          } catch (e) {
            console.warn("Failed to trigger test notification:", e);
          }
          
          // Sync push subscription with Supabase cloud
          await window.syncPushSubscriptionWithCloud();

          // Register background periodic sync
          registerPeriodicSync();
        } else {
          remindersToggle.checked = false;
          SRS.setSetting("dailyReminders", false);
          updateReminderStatusText();
          alert("Notification permission is blocked. Please enable notifications in your browser settings to use daily reminders.");
        }
      } else {
        SRS.setSetting("dailyReminders", false);
        updateReminderStatusText();
        await syncReminderStateToCache();
        
        // Clean up cloud push registration on disable
        try {
          if ('serviceWorker' in navigator && window.SupabaseSync) {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
              await window.SupabaseSync.unregisterPushSubscription(sub.endpoint);
              await sub.unsubscribe();
            }
          }
        } catch (e) {
          console.warn("Failed to clean up push subscription on disable:", e);
        }

        // Unregister periodic sync
        unregisterPeriodicSync();
      }
    });

    reminderTimeInput.addEventListener("change", async () => {
      SRS.setSetting("reminderTime", reminderTimeInput.value);
      await syncReminderStateToCache();
      registerPeriodicSync(); // re-register with updated schedule if periodicSync is active
    });

    // Run a foreground check for active reminders
    startForegroundReminderScheduler();

    // Cache current state for Service Worker use
    await syncReminderStateToCache();

    // Try synchronizing push subscription if already enabled
    await window.syncPushSubscriptionWithCloud();
  }

  function updateReminderStatusText() {
    const statusText = document.getElementById("settings-reminders-status");
    if (!statusText) return;

    const enabled = SRS.getSetting("dailyReminders", true);
    if (!enabled) {
      statusText.innerHTML = "Receive daily notifications on this device to practice and maintain your streak.";
      statusText.style.color = "var(--color-text-muted)";
      return;
    }

    if (Notification.permission === "granted") {
      statusText.innerHTML = "🟢 Daily reminders are active on this device.";
      statusText.style.color = "#28a745";
    } else if (Notification.permission === "denied") {
      statusText.innerHTML = "🔴 Notifications are blocked by your browser settings.";
      statusText.style.color = "#dc3545";
    } else {
      statusText.innerHTML = "🟡 Enable notifications to schedule daily reminders.";
      statusText.style.color = "var(--color-warning, #ffc107)";
    }
  }

  async function syncReminderStateToCache() {
    if (!('caches' in window)) return;
    try {
      const stats = SRS.getGlobalStats();
      const lastActiveDate = stats.lastActiveDate || "";
      const streak = stats.streak || 0;
      const enabled = SRS.getSetting("dailyReminders", true);
      const reminderTime = SRS.getSetting("reminderTime", "19:00");

      const data = {
        lastActiveDate,
        streak,
        enabled,
        reminderTime,
        lastNotifiedDate: localStorage.getItem("voc_russian_last_notified_date") || ""
      };

      const cache = await caches.open("voc-russian-user-data");
      await cache.put(
        new Request("/user-streak-status"),
        new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json" }
        })
      );

      // Trigger reminder updates offline
      scheduleLocalReminder();

      // Sync native Android alarm
      if (/android/i.test(navigator.userAgent)) {
        try {
          const iframe = document.createElement("iframe");
          iframe.style.display = "none";
          iframe.src = `vocrussian://settings?enabled=${enabled}&time=${reminderTime}`;
          document.body.appendChild(iframe);
          setTimeout(() => iframe.remove(), 1000);
        } catch (err) {
          console.warn("Failed to trigger native Android alarm sync:", err);
        }
      }
    } catch (e) {
      console.warn("Failed to sync reminder state to cache:", e);
    }
  }

  async function registerPeriodicSync() {
    if (!('serviceWorker' in navigator) || !('periodicSync' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const enabled = SRS.getSetting("dailyReminders", true);
      if (!enabled) return;

      // Register periodic sync for daily reminder
      await registration.periodicSync.register("daily-reminder", {
        minInterval: 12 * 60 * 60 * 1000 
      });
      console.log("Periodic Background Sync registered successfully.");
    } catch (e) {
      console.warn("Periodic Sync registration failed (expected if not installed/supported):", e);
    }
  }

  async function unregisterPeriodicSync() {
    if (!('serviceWorker' in navigator) || !('periodicSync' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.periodicSync.unregister("daily-reminder");
      console.log("Periodic Background Sync unregistered.");
    } catch (e) {
      console.warn("Periodic Sync unregistration failed:", e);
    }
  }

  let foregroundReminderInterval = null;

  function startForegroundReminderScheduler() {
    if (foregroundReminderInterval) clearInterval(foregroundReminderInterval);

    // Check every 60 seconds
    foregroundReminderInterval = setInterval(checkAndTriggerForegroundReminder, 60000);

    // Also check on page load and visibility change
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        checkAndTriggerForegroundReminder();
      }
    });

    // Run once immediately
    setTimeout(checkAndTriggerForegroundReminder, 5000);
  }

  function checkAndTriggerForegroundReminder() {
    const enabled = SRS.getSetting("dailyReminders", true);
    if (!enabled || Notification.permission !== "granted") return;

    const stats = SRS.getGlobalStats();
    const lastActiveDate = stats.lastActiveDate || "";
    
    // Get current local date formatted as YYYY-MM-DD
    const today = getTodayDateString();
    
    // If they have already studied today, do not remind them
    if (lastActiveDate === today) return;

    // Check if the current hour matches or exceeds the preferred reminder time
    const reminderTime = SRS.getSetting("reminderTime", "19:00");
    const [targetHour, targetMinute] = reminderTime.split(":").map(Number);
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Is it time?
    if (currentHour > targetHour || (currentHour === targetHour && currentMinute >= targetMinute)) {
      // Check if we already notified today
      const lastNotified = localStorage.getItem("voc_russian_last_notified_date");
      if (lastNotified === today) return;

      // Show notification!
      try {
        new Notification("Keep your streak active! 🇷🇺", {
          body: `Keep your ${stats.streak || 0}-day streak alive! Take a few minutes to review your Russian vocabulary today.`,
          icon: "./logo.jpeg",
          tag: "daily-reminder-fg",
          requireInteraction: true
        });

        // Mark as notified today
        localStorage.setItem("voc_russian_last_notified_date", today);
        syncReminderStateToCache();
      } catch (e) {
        console.warn("Failed to trigger foreground Notification:", e);
      }
    }
  }

  function getTodayDateString() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${date}`;
  }

  // Helper to convert VAPID public key string to Uint8Array
  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Globally expose push synchronization handler
  window.syncPushSubscriptionWithCloud = async function () {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    
    // Only register if notifications are granted and daily reminders are enabled
    const remindersEnabled = SRS.getSetting("dailyReminders", true);
    if (Notification.permission !== "granted" || !remindersEnabled) return;

    // Only register if user is logged into Supabase
    if (!window.SupabaseSync || window.SupabaseSync.connectionState !== "connected" || !window.SupabaseSync.user) {
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();
      
      const publicVapidKey = "BAqMWdlYByp62_O4sbmCP2QAIemdBADjVUkEZ9uTk55vnzKsbLvYwYDOuXVfpd-lvgnyrXWbvCgX7xjonPkxJbI";
      
      // Check if existing subscription has valid VAPID keys
      if (subscription) {
        const subJSON = subscription.toJSON();
        if (!subJSON.keys || !subJSON.keys.p256dh || !subJSON.keys.auth) {
          console.log("[PushSync] Existing subscription missing VAPID keys, re-subscribing...");
          try {
            await subscription.unsubscribe();
          } catch (unsubErr) {
            console.warn("[PushSync] Failed to unsubscribe invalid push token:", unsubErr);
          }
          subscription = null;
        }
      }

      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
      }
      
      if (subscription) {
        await window.SupabaseSync.registerPushSubscription(subscription);
      }
    } catch (e) {
      console.warn("Failed to synchronize push subscription with cloud:", e);
    }
  };

  // --- DECKS MANAGEMENT UTILS & HANDLERS ---

  // UTF-8 base64 encoding/decoding to support Cyrillic unicode characters safely
  function utf8ToBase64(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  }

  function base64ToUtf8(str) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }

  function populateDecksDropdowns() {
    const studyDbSelect = document.getElementById("study-filter-db");
    const dictDbSelect = document.getElementById("dict-filter-db");
    const dashDbSelect = document.getElementById("dashboard-filter-db");
    
    if (!studyDbSelect || !dictDbSelect) return;
    
    const activeDb = SRS.getActiveDb();
    const allCustomWords = SRS.getCustomWordsList();
    const defaultCustomCount = allCustomWords.filter(w => (w.deckId || "custom") === "custom").length;
    
    const customDecks = SRS.getCustomDecks();
    
    let html = `
      <option value="standard">Standard Deck (120 words)</option>
      <option value="expanded">Expanded Deck (3,376 words)</option>
      <option value="custom">Personal Custom Deck (${defaultCustomCount} words)</option>
    `;
    
    customDecks.forEach(deck => {
      const count = allCustomWords.filter(w => w.deckId === deck.id).length;
      html += `<option value="${escapeHTML(deck.id)}">${escapeHTML(deck.name)} (${count} words)</option>`;
    });
    
    studyDbSelect.innerHTML = html;
    dictDbSelect.innerHTML = html;
    if (dashDbSelect) {
      dashDbSelect.innerHTML = html;
      dashDbSelect.value = activeDb;
    }
    
    studyDbSelect.value = activeDb;
    dictDbSelect.value = activeDb;
    
    if (studyDbSelect.value !== activeDb) {
      SRS.setActiveDb(studyDbSelect.value);
    }
  }

  function renderDecksList() {
    const container = document.getElementById("decks-list-container");
    if (!container) return;
    container.innerHTML = "";

    const builtInDecks = [
      { id: "standard", name: "Standard Deck", isBuiltIn: true, count: 120 },
      { id: "expanded", name: "Expanded Deck", isBuiltIn: true, count: 3376 },
      { id: "custom", name: "Personal Custom Deck", isBuiltIn: true }
    ];

    const allCustomWords = SRS.getCustomWordsList();
    builtInDecks[2].count = allCustomWords.filter(w => (w.deckId || "custom") === "custom").length;

    const customDecks = SRS.getCustomDecks();

    const allDecks = [...builtInDecks, ...customDecks.map(d => {
      return {
        id: d.id,
        name: d.name,
        isBuiltIn: false,
        count: allCustomWords.filter(w => w.deckId === d.id).length
      };
    })];

    allDecks.forEach(deck => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.justifyContent = "space-between";
      row.style.padding = "0.75rem";
      row.style.background = "var(--bg-card)";
      row.style.border = "1px solid var(--border-glass)";
      row.style.borderRadius = "var(--border-radius-sm)";
      row.style.gap = "0.5rem";

      const info = document.createElement("div");
      info.style.display = "flex";
      info.style.flexDirection = "column";
      info.style.gap = "0.15rem";
      info.innerHTML = `
        <span style="font-weight: 600; font-size: 0.9rem; color: var(--color-text-main);">${escapeHTML(deck.name)}</span>
        <span style="font-size: 0.75rem; color: var(--color-text-muted);">${deck.count} words</span>
      `;
      row.appendChild(info);

      const actions = document.createElement("div");
      actions.style.display = "flex";
      actions.style.gap = "0.35rem";

      if (deck.id === "custom" || !deck.isBuiltIn) {
        const shareBtn = document.createElement("button");
        shareBtn.type = "button";
        shareBtn.className = "btn btn-secondary";
        shareBtn.style.padding = "0.35rem 0.6rem";
        shareBtn.style.fontSize = "0.75rem";
        shareBtn.innerText = "🔗 Share";
        shareBtn.addEventListener("click", () => shareDeck(deck.id, deck.name));
        actions.appendChild(shareBtn);
      }

      if (!deck.isBuiltIn) {
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn btn-secondary";
        deleteBtn.style.padding = "0.35rem 0.6rem";
        deleteBtn.style.fontSize = "0.75rem";
        deleteBtn.style.color = "var(--color-primary)";
        deleteBtn.innerText = "🗑️";
        deleteBtn.addEventListener("click", () => {
          if (confirm(`Are you sure you want to delete the deck "${deck.name}"? This will delete all words inside this deck.`)) {
            SRS.deleteCustomDeck(deck.id);
            populateDecksDropdowns();
            renderDecksList();
            renderDictionary();
          }
        });
        actions.appendChild(deleteBtn);
      }

      row.appendChild(actions);
      container.appendChild(row);
    });
  }

  function shareDeck(deckId, deckName) {
    const allCustomWords = SRS.getCustomWordsList();
    const deckWords = allCustomWords.filter(w => {
      const wDeckId = w.deckId || "custom";
      return wDeckId === deckId;
    });

    if (deckWords.length === 0) {
      alert("Cannot share an empty deck. Please add some words first!");
      return;
    }

    const payload = {
      name: deckName,
      words: deckWords.map(w => ({
        word: w.word,
        accented: w.accented,
        translation: w.translation,
        transliteration: w.transliteration || "",
        pos: w.pos || "noun",
        category: w.category || "Custom",
        exampleRu: w.exampleRu || "",
        exampleEn: w.exampleEn || ""
      }))
    };

    try {
      const jsonStr = JSON.stringify(payload);
      const base64 = utf8ToBase64(jsonStr);
      const shareUrl = `${window.location.origin}${window.location.pathname}?import-deck=${base64}`;

      navigator.clipboard.writeText(shareUrl).then(() => {
        alert(`Shareable link copied to clipboard!\n\nLink: ${shareUrl.substring(0, 50)}...`);
      }).catch(err => {
        prompt("Copy this shareable link manually:", shareUrl);
      });
    } catch (e) {
      console.error("Failed to generate share link:", e);
      alert("Failed to share deck: Error encoding data.");
    }
  }

  function handleImportDeck(rawInput) {
    let base64Data = rawInput.trim();
    if (base64Data.startsWith("http")) {
      try {
        const url = new URL(base64Data);
        base64Data = url.searchParams.get("import-deck") || base64Data;
      } catch (e) {
        // use raw input
      }
    }

    try {
      const decodedStr = base64ToUtf8(base64Data);
      const deckData = JSON.parse(decodedStr);
      if (deckData && deckData.name && Array.isArray(deckData.words)) {
        const newDeckId = SRS.importCustomDeck(deckData.name, deckData.words);
        SRS.setActiveDb(newDeckId);
        populateDecksDropdowns();
        renderDecksList();
        renderDictionary();
        closeModal("modal-manage-decks");
        alert(`Successfully imported deck "${deckData.name}" with ${deckData.words.length} words!`);
      } else {
        alert("Failed to import deck: Invalid deck structure.");
      }
    } catch (e) {
      console.error("Failed to import shared deck:", e);
      alert("Failed to import deck: Invalid or corrupted code/link.");
    }
  }

  function checkSharedDeckImport() {
    const urlParams = new URLSearchParams(window.location.search);
    const importData = urlParams.get("import-deck");
    if (importData) {
      try {
        const decodedStr = base64ToUtf8(importData);
        const deckData = JSON.parse(decodedStr);
        if (deckData && deckData.name && Array.isArray(deckData.words)) {
          window.history.replaceState({}, document.title, window.location.pathname);
          
          setTimeout(() => {
            if (confirm(`Do you want to import the shared deck "${deckData.name}" containing ${deckData.words.length} words?`)) {
              const newDeckId = SRS.importCustomDeck(deckData.name, deckData.words);
              SRS.setActiveDb(newDeckId);
              populateDecksDropdowns();
              renderDictionary();
              alert(`Successfully imported deck "${deckData.name}"!`);
            }
          }, 500);
        }
      } catch (e) {
        console.error("Failed to import shared deck on load:", e);
        alert("Failed to import deck: Invalid or corrupted share link.");
      }
    }
  }

  // --- MASCOT REACTIVITY & SPEECH SYSTEM ---
  window.updateMascotState = function (stateType, optionalText = "") {
    const mascotCharacter = SRS.getSetting("mascotCharacter", "bear");
    
    const mascotEmojis = {
      robot: {
        idle: "🤖",
        correct: "🤖🎉",
        incorrect: "🤖🔧",
        remind: "🤖📢",
        sleep: "🤖💤"
      },
      owl: {
        idle: "🦉",
        correct: "🦉✨",
        incorrect: "🦉🧐",
        remind: "🦉⏰",
        sleep: "🦉💤"
      },
      bear: {
        idle: "🐻",
        correct: "🐻🎉",
        incorrect: "🐻🧸",
        remind: "🐻🍯",
        sleep: "🐻💤"
      }
    };

    const mascotTexts = {
      robot: {
        idle: "Привет! Ready to upgrade your vocabulary circuits today?",
        correct: "Affirmative! Your accuracy is within optimal parameters!",
        incorrect: "Correction detected. Learning is an iterative process. Try again!",
        remind: "Alert! Due review stack exceeds threshold. Initiate study protocol!",
        sleep: "All reviews complete. Standby mode activated... 💤"
      },
      owl: {
        idle: "Привет! A wise learner studies every single day. Shall we?",
        correct: "Spot on! Excellent choice, keep it up!",
        incorrect: "A small slip! Mistakes are the best study books. Try again!",
        remind: "Time flies! Your review cards are waiting. Let's study!",
        sleep: "Quiet night. All tasks complete. Rest well... 💤"
      },
      bear: {
        idle: "Привет! Let's crush today's Russian review session!",
        correct: "Awesome! That's exactly right!",
        incorrect: "Not quite! But don't worry, you'll nail it next time!",
        remind: "Hey there! Don't let your cards pile up. Time for a quick review!",
        sleep: "Mmm... Full belly of words. Hibernating till tomorrow... 💤"
      }
    };

    const emoji = mascotEmojis[mascotCharacter]?.[stateType] || mascotEmojis.bear.idle;
    const defaultText = mascotTexts[mascotCharacter]?.[stateType] || mascotTexts.bear.idle;
    const speechText = optionalText || defaultText;

    const dashAvatar = document.getElementById("dashboard-mascot-avatar");
    const dashText = document.getElementById("dashboard-mascot-text");
    if (dashAvatar && dashText) {
      dashAvatar.textContent = emoji;
      dashText.textContent = speechText;
      
      dashAvatar.className = ""; 
      void dashAvatar.offsetWidth; 
      if (stateType === "correct") {
        dashAvatar.className = "mascot-animation-bounce";
      } else if (stateType === "incorrect") {
        dashAvatar.className = "mascot-animation-shake";
      } else if (stateType === "sleep") {
        dashAvatar.className = "mascot-animation-pulse";
      } else {
        dashAvatar.className = "mascot-animation-idle";
      }
    }

    const completeAvatar = document.getElementById("complete-mascot-avatar");
    const completeText = document.getElementById("complete-mascot-text");
    if (completeAvatar && completeText) {
      completeAvatar.textContent = emoji;
      completeText.textContent = speechText;
    }
  };

  // --- SMART VOCABULARY RECOMMENDATION CARD ---
  let activeRecommendationWord = null;

  function renderVocabularyRecommendation() {
    const recCard = document.getElementById("dashboard-recommendation-card");
    if (!recCard) return;

    const allWords = SRS.getAllWords();
    if (allWords.length === 0) {
      recCard.style.display = "none";
      return;
    }

    // Determine user's estimated vocab level
    const allActiveWords = allWords.filter(w => !SRS.getCardProgress(w.id).hidden);
    let totalWeight = 0;
    allActiveWords.forEach(w => {
      const prog = SRS.getCardProgress(w.id);
      totalWeight += Math.max(0, (prog.box || 1) - 1);
    });
    const maxWeight = allActiveWords.length * 4;
    const vocabPct = maxWeight > 0 ? Math.round((totalWeight / maxWeight) * 100) : 0;
    
    let vocabLevel = "A1";
    if (vocabPct >= 25 && vocabPct < 50) vocabLevel = "A2";
    else if (vocabPct >= 50 && vocabPct < 75) vocabLevel = "B1";
    else if (vocabPct >= 75) vocabLevel = "B2";

    const levelCategories = {
      A1: ["Essentials", "Pronouns & Questions"],
      A2: ["Nouns", "Verbs", "Adjectives"],
      B1: ["Travel & Dining", "Time & Weather", "Shopping"],
      B2: []
    };

    // Calculate category weaknesses (lowest average box level)
    const categoryBoxAvg = {};
    const categoryCount = {};
    allWords.forEach(w => {
      const prog = SRS.getCardProgress(w.id);
      const studied = (prog.correctCount > 0 || prog.wrongCount > 0);
      if (!categoryBoxAvg[w.category]) {
        categoryBoxAvg[w.category] = 0;
        categoryCount[w.category] = 0;
      }
      if (studied) {
        categoryBoxAvg[w.category] += (prog.box || 1);
        categoryCount[w.category]++;
      }
    });

    const categoryStrengths = {};
    Object.keys(categoryBoxAvg).forEach(cat => {
      const count = categoryCount[cat] || 0;
      categoryStrengths[cat] = count > 0 ? (categoryBoxAvg[cat] / count) : 1; 
    });

    // Find candidates: unstudied words
    const progressMap = SRS.getCardProgressMap() || {};
    let candidates = allWords.filter(w => {
      const prog = progressMap[w.id];
      if (!prog) return true;
      return prog.correctCount === 0 && prog.wrongCount === 0;
    });

    if (candidates.length === 0) {
      recCard.style.display = "none";
      return;
    }

    // Filter candidates matching user level
    const targetCats = levelCategories[vocabLevel] || [];
    let levelCandidates = candidates.filter(w => targetCats.includes(w.category));
    if (levelCandidates.length === 0) {
      levelCandidates = candidates;
    }

    // Sort by category weakness (lower average box first)
    levelCandidates.sort((a, b) => {
      const strengthA = categoryStrengths[a.category] || 1;
      const strengthB = categoryStrengths[b.category] || 1;
      return strengthA - strengthB;
    });

    const recommended = levelCandidates[Math.floor(Math.random() * Math.min(5, levelCandidates.length))];
    activeRecommendationWord = recommended;

    document.getElementById("recommend-reason-badge").textContent = `Suggested for ${vocabLevel} - ${recommended.category}`;
    document.getElementById("recommend-word-ru").textContent = recommended.word;
    document.getElementById("recommend-word-translit").textContent = recommended.transliteration ? `[${recommended.transliteration}]` : "";
    
    const nativeLang = SRS.getSetting("nativeLanguage", "en");
    if (nativeLang !== "en" && window.getOrTriggerTranslation) {
      document.getElementById("recommend-word-translation").textContent = "Loading translation...";
      window.getOrTriggerTranslation(recommended.id, recommended.word, nativeLang, (translated) => {
        if (activeRecommendationWord && activeRecommendationWord.id === recommended.id) {
          document.getElementById("recommend-word-translation").textContent = translated;
        }
      }, "ru");
    } else {
      document.getElementById("recommend-word-translation").textContent = recommended.translation;
    }

    recCard.style.display = "block";
  }

  // --- DEDICATED STATISTICS PAGE ---
  // --- XP RANKS SYSTEM ---
  const XP_RANKS = [
    { title: "Новичок",       emoji: "🌱", minXp: 0 },
    { title: "Студент",       emoji: "📚", minXp: 100 },
    { title: "Ученик",        emoji: "✏️", minXp: 300 },
    { title: "Знаток",        emoji: "🔎", minXp: 700 },
    { title: "Практик",       emoji: "🧪", minXp: 1500 },
    { title: "Умелый",        emoji: "🗣️", minXp: 3000 },
    { title: "Эксперт",       emoji: "🏅", minXp: 6000 },
    { title: "Мастер",        emoji: "🏆", minXp: 12000 },
    { title: "Легенда",       emoji: "⭐", minXp: 25000 }
  ];

  function getXpRank(xp) {
    let current = XP_RANKS[0];
    let next = XP_RANKS[1];
    for (let i = 0; i < XP_RANKS.length; i++) {
      if (xp >= XP_RANKS[i].minXp) {
        current = XP_RANKS[i];
        next = XP_RANKS[i + 1] || null;
      }
    }
    return { current, next };
  }

  function updateSidebarXpRank() {
    const stats = SRS.getGlobalStats();
    const xp = stats.xp || 0;
    const { current } = getXpRank(xp);
    const sidebarXpVal = document.getElementById("sidebar-xp-val");
    if (sidebarXpVal) {
      sidebarXpVal.textContent = xp;
    }
    const sidebarRankTitle = document.getElementById("sidebar-rank-title");
    if (sidebarRankTitle) {
      sidebarRankTitle.textContent = `${current.emoji} ${current.title}`;
    }
  }

  // --- ACHIEVEMENTS SYSTEM ---
  function computeAchievements(stats) {
    const allWords = SRS.getAllWords().filter(w => !SRS.getCardProgress(w.id).hidden);
    const xp = stats.xp || 0;
    const streak = stats.streak || 0;
    const maxStreak = stats.settings?.maxStreak || 0;
    const totalReviewed = allWords.filter(w => {
      const p = SRS.getCardProgress(w.id);
      return (p.correctCount || 0) + (p.wrongCount || 0) > 0;
    }).length;
    const box5Words = allWords.filter(w => SRS.getCardProgress(w.id).box === 5).length;
    const alphabetDone = localStorage.getItem("voc_alphabet_game_completed") === "true";
    const placementDone = localStorage.getItem("voc_placement_test_taken") === "true";

    return [
      { id: "first_review",    emoji: "🎴", title: "First Steps",         desc: "Review your first word",               unlocked: totalReviewed >= 1 },
      { id: "review_10",       emoji: "📖", title: "Eager Learner",        desc: "Review 10 different words",             unlocked: totalReviewed >= 10 },
      { id: "review_50",       emoji: "📚", title: "Bookworm",             desc: "Review 50 different words",             unlocked: totalReviewed >= 50 },
      { id: "review_200",      emoji: "🧠", title: "Brain Power",          desc: "Review 200 different words",            unlocked: totalReviewed >= 200 },
      { id: "review_500",      emoji: "🎓", title: "Scholar",              desc: "Review 500 different words",            unlocked: totalReviewed >= 500 },
      { id: "streak_3",        emoji: "🔥", title: "On Fire",              desc: "Maintain a 3-day streak",               unlocked: maxStreak >= 3 },
      { id: "streak_7",        emoji: "🌟", title: "Week Warrior",         desc: "Maintain a 7-day streak",               unlocked: maxStreak >= 7 },
      { id: "streak_30",       emoji: "🏅", title: "Dedicated",            desc: "Maintain a 30-day streak",              unlocked: maxStreak >= 30 },
      { id: "xp_500",          emoji: "✨", title: "XP Collector",         desc: "Earn 500 total XP",                     unlocked: xp >= 500 },
      { id: "xp_5000",         emoji: "💎", title: "XP Champion",          desc: "Earn 5,000 total XP",                   unlocked: xp >= 5000 },
      { id: "mastered_word",   emoji: "🏆", title: "Master",               desc: "Promote a word to Box 5",               unlocked: box5Words >= 1 },
      { id: "mastered_20",     emoji: "👑", title: "Grand Master",         desc: "Promote 20 words to Box 5",             unlocked: box5Words >= 20 },
      { id: "alphabet_done",   emoji: "🔤", title: "Alphabet Master",      desc: "Complete the Alphabet Quiz game",        unlocked: alphabetDone },
      { id: "placement_done",  emoji: "🎓", title: "Level Assessed",       desc: "Complete the Assessment Test",           unlocked: placementDone }
    ];
  }

  // --- TIPS SYSTEM ---
  const TIPS_LIST = [
    "💡 Tip: Tap any Russian word in the Grammar section to instantly add it to your vocabulary deck!",
    "💡 Tip: Use the 'Slow' 🐢 button to hear words at half speed for clearer pronunciation.",
    "💡 Tip: Starred words (⭐) can be filtered to create focused study sessions.",
    "💡 Tip: Try Reverse Mode in study settings to practice recalling Russian words from their English translations!",
    "💡 Tip: The Expanded Deck has 3,376 words — including stress marks to help you learn correct pronunciation!",
    "💡 Tip: Cloud sync keeps your progress safe across all your devices. Sign in from the Sync tab!",
    "💡 Tip: Writing Practice is the hardest mode — it forces you to type words from memory. Great for spelling!",
    "💡 Tip: CEFR levels (A1–C2) let you filter words by difficulty and build vocabulary step by step.",
    "💡 Tip: Daily streaks are built by earning at least 20 XP per day. Even 5 minutes counts!",
    "💡 Tip: The Assessment Test places your current knowledge on the CEFR scale — take it to find your level!",
    "💡 Tip: Each word has example sentences. Look at them on the back of the flashcard for context!",
    "💡 Tip: Box 5 words are 'mastered' — they'll only appear every 14 days to refresh your memory.",
    "💡 Tip: Use the 'Only Revised Words' option to drill words you've already seen at least once.",
    "💡 Tip: The Alphabet page teaches you all 33 Cyrillic letters and includes a practice game!",
    "💡 Tip: You can edit any word (including built-in ones) to add your own notes or example sentences."
  ];

  let lastTipIndex = -1;

  function showRandomTip() {
    let idx;
    do {
      idx = Math.floor(Math.random() * TIPS_LIST.length);
    } while (idx === lastTipIndex && TIPS_LIST.length > 1);
    lastTipIndex = idx;
    const tipEl = document.getElementById("dashboard-tip-text");
    if (tipEl) tipEl.textContent = TIPS_LIST[idx];
  }

  function renderStatisticsPage() {
    const stats = SRS.getGlobalStats();
    
    const currentStreak = stats.streak || 0;
    const maxStreak = Math.max(currentStreak, stats.settings?.maxStreak || 0);

    const streakVal = document.getElementById("stats-streak-value");
    if (streakVal) streakVal.textContent = currentStreak;
    const streakMax = document.getElementById("stats-streak-max");
    if (streakMax) streakMax.textContent = `${maxStreak} days`;

    const circle = document.getElementById("stats-streak-circle");
    if (circle) {
      const radius = 16;
      const circumference = 2 * Math.PI * radius;
      const target = 7;
      const pct = Math.min(currentStreak / target, 1.0);
      const strokeDashoffset = circumference - pct * circumference;
      circle.style.strokeDasharray = `${circumference} ${circumference}`;
      circle.style.strokeDashoffset = strokeDashoffset;
    }

    const leitnerContainer = document.getElementById("stats-leitner-container");
    if (leitnerContainer) {
      const allWords = SRS.getAllWords().filter(w => !SRS.getCardProgress(w.id).hidden);
      const counts = [0, 0, 0, 0, 0];
      allWords.forEach(w => {
        const prog = SRS.getCardProgress(w.id);
        const box = Math.max(1, Math.min(5, prog.box || 1));
        counts[box - 1]++;
      });

      const maxCount = Math.max(...counts, 1);
      const boxesInfo = [
        { name: "Box 1: New / Difficult", interval: "Review daily" },
        { name: "Box 2: Familiar", interval: "Review every 2d" },
        { name: "Box 3: Moderate", interval: "Review every 4d" },
        { name: "Box 4: Advanced", interval: "Review every 7d" },
        { name: "Box 5: Mastered", interval: "Review every 14d" }
      ];

      let html = "";
      boxesInfo.forEach((box, i) => {
        const count = counts[i];
        const pct = Math.round((count / maxCount) * 100);
        html += `
          <div class="box-item">
            <div class="box-label-row" style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.15rem;">
              <span class="box-title" style="font-weight: 600; color: var(--color-text-main);">${box.name}</span>
              <span class="box-interval" style="font-size: 0.75rem; color: var(--color-text-muted); margin-left: auto; margin-right: 10px;">${box.interval}</span>
              <span class="box-count" style="font-weight: 700; color: var(--color-primary-hover);">${count}</span>
            </div>
            <div class="progress-track-bar" style="height: 6px; background: var(--bg-input); border-radius: var(--border-radius-pill); overflow: hidden; border: 1px solid var(--border-glass); margin-bottom: 0.5rem;">
              <div style="width: ${pct}%; height: 100%; background: var(--color-primary); border-radius: var(--border-radius-pill);"></div>
            </div>
          </div>
        `;
      });
      leitnerContainer.innerHTML = html;
    }

    const weeklyData = SRS.getLast7DaysXp();
    const barsGroup = document.getElementById("stats-chart-bars-group");
    const labelsGroup = document.getElementById("stats-chart-labels-group");
    if (barsGroup && labelsGroup) {
      barsGroup.innerHTML = "";
      labelsGroup.innerHTML = "";
      const maxVal = Math.max(...weeklyData.map(d => d.xp), 50);
      const chartHeight = 150;
      const barWidth = 32;
      const startX = 55;
      const stepX = 46;

      weeklyData.forEach((day, index) => {
        const x = startX + index * stepX;
        const barHeight = (day.xp / maxVal) * chartHeight;
        const y = 170 - barHeight;

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x - barWidth / 2);
        rect.setAttribute("y", y);
        rect.setAttribute("width", barWidth);
        rect.setAttribute("height", barHeight);
        rect.setAttribute("rx", 6);
        rect.setAttribute("class", "chart-bar");
        rect.innerHTML = `<title>${day.xp} XP earned on ${day.label}</title>`;
        barsGroup.appendChild(rect);

        if (day.xp > 0) {
          const valText = document.createElementNS("http://www.w3.org/2000/svg", "text");
          valText.setAttribute("x", x);
          valText.setAttribute("y", Math.min(y - 6, 160));
          valText.setAttribute("class", "chart-text");
          valText.setAttribute("style", "fill: var(--color-text-main); font-weight: 600; font-size: 9px;");
          valText.textContent = day.xp;
          barsGroup.appendChild(valText);
        }

        const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        labelText.setAttribute("x", x);
        labelText.setAttribute("y", 188);
        labelText.setAttribute("class", "chart-text");
        labelText.textContent = day.label;
        labelsGroup.appendChild(labelText);
      });
    }

    const masteryGrid = document.getElementById("stats-grammar-mastery-grid");
    if (masteryGrid) {
      const progressMap = window.GrammarManager ? window.GrammarManager.getGrammarProgressMap() : {};
      const TOPICS_MAP = {
        nominative_case: "Nominative Case",
        accusative_case: "Accusative Case",
        genitive_case: "Genitive Case",
        dative_case: "Dative Case",
        instrumental_case: "Instrumental Case",
        prepositional_case: "Prepositional Case",
        verb_aspects: "Verb Aspects",
        verbs_of_motion: "Verbs of Motion",
        verb_conjugations: "Verb Conjugations",
        past_tense: "Past Tense",
        future_tense: "Future Tense",
        adjectives_declension: "Adjectives Declension",
        pronouns_declension: "Pronouns Declension",
        noun_plurals: "Noun Plurals"
      };

      let html = "";
      Object.entries(TOPICS_MAP).forEach(([id, name]) => {
        const progress = progressMap[id] || {};
        const lessonCompleted = (progress.lessonsCompleted || 0) > 0;
        const levelRecords = Object.values(progressMap).filter(p => p.topicId && p.topicId.startsWith(`${id}_`) && (p.quizzesTaken || 0) > 0);
        const quizzesTaken = levelRecords.reduce((sum, p) => sum + (p.quizzesTaken || 0), 0);
        const questionsAnswered = levelRecords.reduce((sum, p) => sum + (p.totalQuestions || 0), 0);
        const topicMastery = window.GrammarManager ? window.GrammarManager.getTopicMastery(id) : 0;

        html += `
          <div class="card stat-card" style="padding: 1rem; border: 1px solid var(--border-glass); background: var(--bg-input); display: flex; flex-direction: column; justify-content: space-between; gap: 0.5rem; border-radius: var(--border-radius-md);">
            <div style="font-weight: 700; font-size: 0.95rem; color: var(--color-text-main); font-family: var(--font-heading);">${name}</div>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; color: var(--color-text-muted);">
              <span>Mastery:</span>
              <strong style="color: var(--color-primary-hover); font-size: 0.9rem;">${topicMastery}%</strong>
            </div>
            <div class="progress-track-bar" style="height: 6px; background: rgba(255,255,255,0.05); border-radius: var(--border-radius-pill); overflow: hidden; border: 1px solid var(--border-glass);">
              <div style="width: ${topicMastery}%; height: 100%; background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover)); border-radius: var(--border-radius-pill);"></div>
            </div>
            <div style="display: flex; gap: 0.5rem; justify-content: space-between; font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.25rem;">
              <span>📖 Lesson: ${lessonCompleted ? "✓" : "✗"}</span>
              <span title="${quizzesTaken} completed quizzes">📝 Evidence: ${questionsAnswered} answers</span>
            </div>
          </div>
        `;
      });
      masteryGrid.innerHTML = html;
    }

    // --- RENDER XP RANK PROGRESSION ---
    const rankCard = document.getElementById("stats-rank-card");
    if (rankCard) {
      const xp = stats.xp || 0;
      const { current, next } = getXpRank(xp);
      const pct = next ? Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100) : 100;
      rankCard.innerHTML = `
        <h3 style="font-family: var(--font-heading); margin-bottom: 0.5rem;">🏅 XP Rank</h3>
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
          <div style="font-size: 3rem; line-height: 1;">${current.emoji}</div>
          <div>
            <div style="font-size: 1.35rem; font-weight: 800; font-family: var(--font-heading); color: var(--color-text-main);">${current.title}</div>
            <div style="font-size: 0.85rem; color: var(--color-text-muted);">${xp.toLocaleString()} XP earned</div>
          </div>
        </div>
        ${next ? `
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 0.4rem;">
            <span>Progress to ${next.emoji} ${next.title}</span>
            <span>${pct}%</span>
          </div>
          <div class="level-progress-track" style="height: 0.6rem; background: var(--bg-input); border-radius: var(--border-radius-pill); overflow: hidden; border: 1px solid var(--border-glass);">
            <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover)); border-radius: var(--border-radius-pill);"></div>
          </div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.35rem;">${(next.minXp - xp).toLocaleString()} XP to next rank</div>
        ` : `<div style="font-size:0.9rem; color: var(--color-primary-hover); font-weight: bold;">🎉 Maximum Rank Achieved!</div>`}
      `;
    }

    // --- RENDER ACHIEVEMENTS ---
    const achievGrid = document.getElementById("stats-achievements-grid");
    if (achievGrid) {
      const achievements = computeAchievements(stats);
      achievGrid.innerHTML = achievements.map(a => `
        <div class="card stat-card" style="padding: 1rem; border: 1px solid ${a.unlocked ? 'var(--color-primary)' : 'var(--border-glass)'}; background: ${a.unlocked ? 'var(--color-primary-glow)' : 'var(--bg-input)'}; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.5rem; border-radius: var(--border-radius-md); ${a.unlocked ? '' : 'opacity: 0.55;'}" title="${a.desc}">
          <div style="font-size: 2rem;"${a.unlocked ? '' : ' style="filter: grayscale(1)"'}>${a.emoji}</div>
          <div style="font-weight: 700; font-size: 0.9rem; color: ${a.unlocked ? 'var(--color-text-main)' : 'var(--color-text-muted)'}; font-family: var(--font-heading);">${a.title}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); line-height: 1.3;">${a.desc}</div>
          ${a.unlocked ? '<div style="font-size: 0.7rem; color: var(--color-primary-hover); font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">✅ Unlocked</div>' : '<div style="font-size: 0.7rem; color: var(--color-text-muted);">🔒 Locked</div>'}
        </div>
      `).join("");
    }

    // Update sidebar rank
    updateSidebarXpRank();
  }

  // --- OFFLINE NOTIFICATION REMINDER TRIGGER SCHEDULER ---
  async function scheduleLocalReminder() {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      if (!registration.showNotification) return;

      const enabled = SRS.getSetting("dailyReminders", true);
      
      if ('getNotifications' in registration) {
        const activeNotifications = await registration.getNotifications({ tag: "daily-reminder-local", includeTriggered: true });
        for (const n of activeNotifications) {
          n.close();
        }
      }

      if (!enabled || Notification.permission !== "granted") {
        return;
      }

      if (typeof TimestampTrigger === 'undefined') {
        console.warn("TimestampTrigger is not supported in this browser.");
        return;
      }

      const reminderTime = SRS.getSetting("reminderTime", "19:00");
      const [hour, minute] = reminderTime.split(":").map(Number);
      
      const now = new Date();
      const triggerTime = new Date();
      triggerTime.setHours(hour, minute, 0, 0);

      const stats = SRS.getGlobalStats();
      const todayStr = getTodayDateString();
      if (triggerTime <= now || stats.lastActiveDate === todayStr) {
        triggerTime.setDate(triggerTime.getDate() + 1);
      }

      await registration.showNotification("Keep your streak active! 🇷🇺", {
        body: `Keep your ${stats.streak || 0}-day streak alive! Take a few minutes to review your Russian vocabulary today.`,
        icon: "./logo.jpeg",
        tag: "daily-reminder-local",
        showTrigger: new TimestampTrigger(triggerTime.getTime()),
        requireInteraction: true
      });
      console.log("Local reminder scheduled offline via TimestampTrigger for:", triggerTime);
    } catch (e) {
      console.warn("Failed to register TimestampTrigger notification:", e);
    }
  }
  window.scheduleLocalReminder = scheduleLocalReminder;
})();
