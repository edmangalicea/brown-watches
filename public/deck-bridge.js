(function () {
  const method = document.documentElement.dataset.deckMethod || window.__deckMethod || "v1";
  const keys = {
    shortlist: `tuns-shortlist-${method}`,
    brief: `tuns-${method}-brief-acknowledged`,
    responses: `tuns-responses-${method}`,
    responsesOwner: `tuns-responses-${method}-owner`,
    hidden: `tuns-hidden-straps-${method}`
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

  function toStringArray(value) {
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  }

  function hiddenSetFromList(list) {
    return new Set(toStringArray(list));
  }

  function toResponseMap(responses, hiddenStrapIds = []) {
    const hidden = hiddenSetFromList(hiddenStrapIds);

    return Object.fromEntries(
      (Array.isArray(responses) ? responses : [])
        .filter((item) => item?.strapId && !hidden.has(item.strapId))
        .map((item) => [
          item.strapId,
          {
            strapId: item.strapId,
            strapTitle: item.strapTitle,
            response: item.response,
            comment: item.comment ?? "",
            updatedAt: item.updatedAt,
            baseUpdatedAt: item.baseUpdatedAt ?? item.updatedAt,
            clientUpdatedAt: item.clientUpdatedAt,
            baseClientUpdatedAt: item.baseClientUpdatedAt ?? item.clientUpdatedAt
          }
        ])
    );
  }

  function filterVisibleList(list, hiddenStrapIds) {
    const hidden = hiddenSetFromList(hiddenStrapIds);
    return toStringArray(list).filter((id) => !hidden.has(id));
  }

  function readResponseMap() {
    try {
      const parsed = JSON.parse(localStorage.getItem(keys.responses) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function readHiddenStrapIds() {
    try {
      return toStringArray(JSON.parse(localStorage.getItem(keys.hidden) || "[]"));
    } catch {
      return [];
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
            preferencesUpdatedAt: undefined,
            userKey: undefined,
            hiddenStrapIds: [],
            responses: []
          };

    withSuppressedNotify(() => {
      const hiddenStrapIds = toStringArray(normalizedState.hiddenStrapIds);
      const shortlist = filterVisibleList(normalizedState.shortlist, hiddenStrapIds);
      const briefAcknowledged = Boolean(normalizedState.briefAcknowledged);
      window.__deckBridgeState = {
        ...normalizedState,
        shortlist,
        briefAcknowledged,
        baseShortlist: shortlist,
        baseBriefAcknowledged: briefAcknowledged,
        basePreferencesUpdatedAt: normalizedState.preferencesUpdatedAt,
        hiddenStrapIds
      };
      localStorage.setItem(keys.shortlist, JSON.stringify(shortlist));
      localStorage.setItem(keys.hidden, JSON.stringify(hiddenStrapIds));
      localStorage.setItem(
        keys.brief,
        briefAcknowledged ? "true" : "false"
      );
      localStorage.setItem(
        keys.responses,
        JSON.stringify(toResponseMap(normalizedState.responses, hiddenStrapIds))
      );
      if (normalizedState.userKey) {
        localStorage.setItem(keys.responsesOwner, normalizedState.userKey);
      } else {
        localStorage.removeItem(keys.responsesOwner);
      }

      window.dispatchEvent(
        new CustomEvent("deck:bridge-state", { detail: window.__deckBridgeState })
      );
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
    const localResponsesOwner = localStorage.getItem(keys.responsesOwner) || "";
    const nextResponsesOwner = nextState.userKey || "";
    const hiddenStrapIds = toStringArray(nextState.hiddenStrapIds);
    const canReuseLocalResponses =
      Boolean(nextState.isAuthenticated && nextResponsesOwner) &&
      localResponsesOwner === nextResponsesOwner;
    const currentBrief = localStorage.getItem(keys.brief) === "true";

    const shortlist =
      nextState.isAuthenticated && (!nextState.shortlist || nextState.shortlist.length === 0)
        ? filterVisibleList(currentShortlist, hiddenStrapIds)
        : filterVisibleList(nextState.shortlist, hiddenStrapIds);

    const responses =
      canReuseLocalResponses && (!nextState.responses || nextState.responses.length === 0)
        ? toResponseMap(Object.values(currentResponses), hiddenStrapIds)
        : toResponseMap(nextState.responses, hiddenStrapIds);

    const briefAcknowledged =
      nextState.isAuthenticated && !nextState.briefAcknowledged
        ? currentBrief
        : Boolean(nextState.briefAcknowledged);

    const normalizedState = {
      method,
      isAuthenticated: Boolean(nextState.isAuthenticated),
      userKey: nextState.userKey,
      shortlist,
      briefAcknowledged,
      preferencesUpdatedAt: nextState.preferencesUpdatedAt,
      basePreferencesUpdatedAt: nextState.preferencesUpdatedAt,
      baseShortlist: shortlist,
      baseBriefAcknowledged: briefAcknowledged,
      hiddenStrapIds,
      responses: Object.values(responses)
    };

    withSuppressedNotify(() => {
      window.__deckBridgeState = normalizedState;
      localStorage.setItem(keys.shortlist, JSON.stringify(shortlist));
      localStorage.setItem(keys.hidden, JSON.stringify(hiddenStrapIds));
      localStorage.setItem(keys.brief, briefAcknowledged ? "true" : "false");
      localStorage.setItem(keys.responses, JSON.stringify(responses));
      if (nextResponsesOwner) {
        localStorage.setItem(keys.responsesOwner, nextResponsesOwner);
      } else {
        localStorage.removeItem(keys.responsesOwner);
      }

      window.dispatchEvent(new CustomEvent("deck:bridge-state", { detail: normalizedState }));
    });
  }

  function readState() {
    let shortlist = [];
    const hiddenStrapIds = readHiddenStrapIds();

    try {
      shortlist = JSON.parse(localStorage.getItem(keys.shortlist) || "[]");
    } catch {
      shortlist = [];
    }

    return {
      type: "deck:state-change",
      method,
      isAuthenticated: window.__deckBridgeState?.isAuthenticated ?? false,
      shortlist: filterVisibleList(shortlist, hiddenStrapIds),
      briefAcknowledged: localStorage.getItem(keys.brief) === "true",
      preferencesUpdatedAt: window.__deckBridgeState?.preferencesUpdatedAt,
      basePreferencesUpdatedAt: window.__deckBridgeState?.basePreferencesUpdatedAt,
      baseShortlist: filterVisibleList(window.__deckBridgeState?.baseShortlist ?? [], hiddenStrapIds),
      baseBriefAcknowledged: window.__deckBridgeState?.baseBriefAcknowledged ?? false,
      hiddenStrapIds,
      responses: Object.values(toResponseMap(Object.values(readResponseMap()), hiddenStrapIds))
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
    if (key === keys.shortlist || key === keys.brief || key === keys.responses || key === keys.hidden) {
      notifyParent();
    }
  };

  localStorage.removeItem = function (key) {
    originalRemoveItem(key);
    if (key === keys.shortlist || key === keys.brief || key === keys.responses || key === keys.hidden) {
      notifyParent();
    }
  };

  window.addEventListener("storage", notifyParent);
  window.addEventListener("deck:responses-change", notifyParent);
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
