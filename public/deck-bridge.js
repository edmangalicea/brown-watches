(function () {
  const method = "v1";
  const keys = {
    shortlist: "tuns-shortlist-v1",
    brief: "tuns-v1-brief-acknowledged",
    responses: "tuns-responses-v1"
  };
  let suppressNotifyCount = 0;

  function withSuppressedNotify(applyState) {
    suppressNotifyCount += 1;
    try {
      applyState();
    } finally {
      suppressNotifyCount -= 1;
    }
  }

  function parseInitialState() {
    try {
      return window.name ? JSON.parse(window.name) : null;
    } catch {
      return null;
    }
  }

  function toResponseMap(responses) {
    return Object.fromEntries(
      (Array.isArray(responses) ? responses : []).map((item) => [
        item.strapId,
        {
          strapId: item.strapId,
          strapTitle: item.strapTitle,
          response: item.response,
          comment: item.comment ?? ""
        }
      ])
    );
  }

  function readResponseMap() {
    try {
      const parsed = JSON.parse(localStorage.getItem(keys.responses) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function applyInitialState() {
    const initialState = parseInitialState();
    const normalizedState =
      initialState && initialState.method === method
        ? initialState
        : {
            method,
            isAuthenticated: false,
            shortlist: [],
            briefAcknowledged: false,
            responses: []
          };

    withSuppressedNotify(() => {
      window.__deckBridgeState = normalizedState;
      localStorage.setItem(keys.shortlist, JSON.stringify(normalizedState.shortlist ?? []));
      localStorage.setItem(
        keys.brief,
        normalizedState.briefAcknowledged ? "true" : "false"
      );
      localStorage.setItem(
        keys.responses,
        JSON.stringify(toResponseMap(normalizedState.responses))
      );

      window.dispatchEvent(new CustomEvent("deck:bridge-state", { detail: normalizedState }));
    });
  }

  function applyHydratedState(nextState) {
    if (!nextState || nextState.method !== method) {
      return;
    }

    const currentShortlist = (() => {
      try {
        const parsed = JSON.parse(localStorage.getItem(keys.shortlist) || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();

    const currentResponses = readResponseMap();
    const currentBrief = localStorage.getItem(keys.brief) === "true";

    const shortlist =
      nextState.isAuthenticated && (!nextState.shortlist || nextState.shortlist.length === 0)
        ? currentShortlist
        : nextState.shortlist ?? [];

    const responses =
      nextState.isAuthenticated && (!nextState.responses || nextState.responses.length === 0)
        ? currentResponses
        : toResponseMap(nextState.responses);

    const briefAcknowledged =
      nextState.isAuthenticated && !nextState.briefAcknowledged
        ? currentBrief
        : Boolean(nextState.briefAcknowledged);

    const normalizedState = {
      method,
      isAuthenticated: Boolean(nextState.isAuthenticated),
      shortlist,
      briefAcknowledged,
      responses: Object.values(responses)
    };

    withSuppressedNotify(() => {
      window.__deckBridgeState = normalizedState;
      localStorage.setItem(keys.shortlist, JSON.stringify(shortlist));
      localStorage.setItem(keys.brief, briefAcknowledged ? "true" : "false");
      localStorage.setItem(keys.responses, JSON.stringify(responses));

      window.dispatchEvent(new CustomEvent("deck:bridge-state", { detail: normalizedState }));
    });
  }

  function readState() {
    let shortlist = [];

    try {
      shortlist = JSON.parse(localStorage.getItem(keys.shortlist) || "[]");
    } catch {
      shortlist = [];
    }

    return {
      type: "deck:state-change",
      method,
      isAuthenticated: window.__deckBridgeState?.isAuthenticated ?? false,
      shortlist: Array.isArray(shortlist) ? shortlist : [],
      briefAcknowledged: localStorage.getItem(keys.brief) === "true",
      responses: Object.values(readResponseMap())
    };
  }

  function notifyParent() {
    if (suppressNotifyCount > 0 || window.parent === window) {
      return;
    }

    window.parent.postMessage(readState(), window.location.origin);
  }

  applyInitialState();

  const originalSetItem = localStorage.setItem.bind(localStorage);
  const originalRemoveItem = localStorage.removeItem.bind(localStorage);

  localStorage.setItem = function (key, value) {
    originalSetItem(key, value);
    if (key === keys.shortlist || key === keys.brief || key === keys.responses) {
      notifyParent();
    }
  };

  localStorage.removeItem = function (key) {
    originalRemoveItem(key);
    if (key === keys.shortlist || key === keys.brief || key === keys.responses) {
      notifyParent();
    }
  };

  window.addEventListener("storage", notifyParent);
  window.addEventListener("DOMContentLoaded", notifyParent);
  window.addEventListener("load", notifyParent);
  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) {
      return;
    }

    if (!event.data || event.data.type !== "deck:hydrate" || event.data.method !== method) {
      return;
    }

    applyHydratedState(event.data);
  });
})();
