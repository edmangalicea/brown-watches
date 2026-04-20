(function () {
  const method = window.location.pathname.includes("method-2") ? "v2" : "v1";
  const responseKey = `tuns-responses-${method}`;
  const responseTimers = new Map();

  function isSignedIn() {
    return Boolean(window.__deckBridgeState?.isAuthenticated);
  }

  const style = document.createElement("style");
  style.textContent = `
    .response-panel,
    .lightbox-response-panel {
      margin-top: 14px;
      padding: 14px;
      border-radius: 16px;
      border: 1px solid rgba(49, 44, 38, 0.08);
      background: rgba(255,255,255,0.72);
      display: grid;
      gap: 10px;
    }

    .response-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .response-label {
      color: #1e1b18;
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      font-size: 11px;
      letter-spacing: 0.11em;
      text-transform: uppercase;
    }

    .response-status {
      color: #5f584f;
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      font-size: 0.74rem;
      letter-spacing: 0.03em;
    }

    .response-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .response-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 38px;
      padding: 9px 12px;
      border-radius: 999px;
      border: 1px solid rgba(49, 44, 38, 0.1);
      background: rgba(255,255,255,0.92);
      color: #5f584f;
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      font-size: 0.78rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      cursor: pointer;
      transition: transform 140ms ease, background 140ms ease, border-color 140ms ease;
    }

    .response-chip:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    .response-chip:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    .response-chip.active-like {
      background: rgba(62, 122, 85, 0.13);
      border-color: rgba(62, 122, 85, 0.32);
      color: #29553a;
    }

    .response-chip.active-dislike {
      background: rgba(151, 88, 88, 0.13);
      border-color: rgba(151, 88, 88, 0.32);
      color: #7b3838;
    }

    .response-comment {
      width: 100%;
      min-height: 82px;
      resize: vertical;
      padding: 12px 13px;
      border-radius: 14px;
      border: 1px solid rgba(49, 44, 38, 0.1);
      background: rgba(255,255,255,0.96);
      color: #1e1b18;
      font: inherit;
      line-height: 1.45;
    }

    .response-comment:disabled {
      cursor: not-allowed;
      opacity: 0.78;
      background: rgba(246, 243, 237, 0.9);
    }

    .response-note {
      color: #5f584f;
      font-size: 0.86rem;
      line-height: 1.45;
    }

    .response-note a {
      color: #2d3e53;
      text-decoration: underline;
    }

    .response-panel.response-like,
    .lightbox-response-panel.response-like {
      box-shadow: inset 0 0 0 1px rgba(62, 122, 85, 0.08);
    }

    .response-panel.response-dislike,
    .lightbox-response-panel.response-dislike {
      box-shadow: inset 0 0 0 1px rgba(151, 88, 88, 0.08);
    }
  `;
  document.head.appendChild(style);

  function readResponseMap() {
    try {
      const parsed = JSON.parse(localStorage.getItem(responseKey) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeResponseMap(map) {
    localStorage.setItem(responseKey, JSON.stringify(map));
  }

  function getResponse(strapId) {
    return readResponseMap()[strapId];
  }

  function upsertResponse(strapId, strapTitle, next) {
    const map = readResponseMap();
    map[strapId] = {
      strapId,
      strapTitle,
      response: next.response,
      comment: next.comment ?? ""
    };
    writeResponseMap(map);
  }

  function scheduleCommentSave(strapId, strapTitle, response, comment) {
    const existingTimer = responseTimers.get(strapId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = window.setTimeout(() => {
      upsertResponse(strapId, strapTitle, { response, comment });
      responseTimers.delete(strapId);
      syncAllPanels();
    }, 450);

    responseTimers.set(strapId, timer);
  }

  function signedOutNote() {
    return `Sign in to save an opinion and comment. <a href="/sign-in" target="_top" rel="noreferrer">Open sign in</a>`;
  }

  function commentPlaceholder(entry) {
    if (!isSignedIn()) {
      return "Sign in to leave feedback.";
    }

    if (!entry?.response) {
      return "Choose like or dislike first, then add a comment.";
    }

    return "Optional note about why you feel this way.";
  }

  function setPanelState(panel, strapId, strapTitle) {
    const signedIn = isSignedIn();
    const entry = getResponse(strapId);
    const likeBtn = panel.querySelector('[data-opinion="like"]');
    const dislikeBtn = panel.querySelector('[data-opinion="dislike"]');
    const textarea = panel.querySelector(".response-comment");
    const status = panel.querySelector(".response-status");
    const note = panel.querySelector(".response-note");

    panel.classList.toggle("response-like", entry?.response === "like");
    panel.classList.toggle("response-dislike", entry?.response === "dislike");

    likeBtn.classList.toggle("active-like", entry?.response === "like");
    dislikeBtn.classList.toggle("active-dislike", entry?.response === "dislike");
    likeBtn.disabled = !signedIn;
    dislikeBtn.disabled = !signedIn;

    textarea.disabled = !signedIn || !entry?.response;
    textarea.placeholder = commentPlaceholder(entry);

    if (document.activeElement !== textarea) {
      textarea.value = entry?.comment ?? "";
    }

    if (!signedIn) {
      status.textContent = "Sign in required";
      note.innerHTML = signedOutNote();
    } else if (entry?.response) {
      status.textContent = entry.comment?.trim().length ? "Opinion + comment saved" : "Opinion saved";
      note.textContent =
        entry.response === "like"
          ? "Marked as a positive reaction for this method."
          : "Marked as a negative reaction for this method.";
    } else {
      status.textContent = "No opinion saved";
      note.textContent = "Choose like or dislike to record a response for this strap.";
    }

    likeBtn.onclick = () => {
      if (!signedIn) {
        return;
      }
      upsertResponse(strapId, strapTitle, {
        response: "like",
        comment: entry?.comment ?? ""
      });
      syncAllPanels();
    };

    dislikeBtn.onclick = () => {
      if (!signedIn) {
        return;
      }
      upsertResponse(strapId, strapTitle, {
        response: "dislike",
        comment: entry?.comment ?? ""
      });
      syncAllPanels();
    };

    textarea.oninput = (event) => {
      const current = getResponse(strapId);
      if (!signedIn || !current?.response) {
        return;
      }
      scheduleCommentSave(
        strapId,
        strapTitle,
        current.response,
        event.target.value
      );
      status.textContent = "Saving comment…";
    };
  }

  function buildPanel(strapId, strapTitle, isLightbox) {
    const panel = document.createElement("div");
    panel.className = isLightbox ? "lightbox-response-panel" : "response-panel";
    panel.dataset.strapId = strapId;
    panel.dataset.strapTitle = strapTitle;
    panel.innerHTML = `
      <div class="response-header">
        <span class="response-label">Opinion</span>
        <span class="response-status">No opinion saved</span>
      </div>
      <div class="response-buttons">
        <button class="response-chip" data-opinion="like" type="button">Like</button>
        <button class="response-chip" data-opinion="dislike" type="button">Dislike</button>
      </div>
      <textarea class="response-comment"></textarea>
      <div class="response-note"></div>
    `;
    setPanelState(panel, strapId, strapTitle);
    return panel;
  }

  function ensureCardPanels() {
    document.querySelectorAll(".strap-card").forEach((card) => {
      const strapId = card.dataset.id;
      const strapTitle = card.querySelector(".strap-title")?.textContent?.trim() ?? strapId;

      if (!card.querySelector(".response-panel")) {
        const panel = buildPanel(strapId, strapTitle, false);
        const actionRow = card.querySelector(".strap-actions");
        actionRow?.before(panel);
      } else {
        setPanelState(card.querySelector(".response-panel"), strapId, strapTitle);
      }
    });
  }

  function currentLightboxStrap() {
    const link = document.querySelector("#lightbox-caption a");
    if (!link) {
      return null;
    }

    const matchingCard = [...document.querySelectorAll(".strap-card")].find((card) => card.dataset.id === link.href);
    if (!matchingCard) {
      return null;
    }

    return {
      strapId: matchingCard.dataset.id,
      strapTitle: matchingCard.querySelector(".strap-title")?.textContent?.trim() ?? matchingCard.dataset.id
    };
  }

  function ensureLightboxPanel() {
    const caption = document.getElementById("lightbox-caption");
    if (!caption) {
      return;
    }

    const strap = currentLightboxStrap();
    const existing = caption.querySelector(".lightbox-response-panel");

    if (!strap) {
      existing?.remove();
      return;
    }

    if (!existing) {
      caption.appendChild(buildPanel(strap.strapId, strap.strapTitle, true));
      return;
    }

    existing.dataset.strapId = strap.strapId;
    existing.dataset.strapTitle = strap.strapTitle;
    setPanelState(existing, strap.strapId, strap.strapTitle);
  }

  function syncAllPanels() {
    document.querySelectorAll(".response-panel").forEach((panel) => {
      setPanelState(panel, panel.dataset.strapId, panel.dataset.strapTitle);
    });
    const lightboxPanel = document.querySelector(".lightbox-response-panel");
    if (lightboxPanel) {
      setPanelState(lightboxPanel, lightboxPanel.dataset.strapId, lightboxPanel.dataset.strapTitle);
    }
  }

  ensureCardPanels();
  ensureLightboxPanel();

  const lightboxCounter = document.getElementById("lightbox-counter");
  if (lightboxCounter) {
    const observer = new MutationObserver(() => {
      ensureLightboxPanel();
    });
    observer.observe(lightboxCounter, { childList: true, subtree: true, characterData: true });
  }

  window.addEventListener("storage", syncAllPanels);
  window.addEventListener("deck:bridge-state", syncAllPanels);
  window.addEventListener("load", () => {
    ensureCardPanels();
    ensureLightboxPanel();
  });
})();
