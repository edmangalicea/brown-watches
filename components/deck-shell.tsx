"use client";

import Link from "next/link";
import {
  UserButton,
  useUser
} from "@clerk/nextjs";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject
} from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { DeckMethod } from "@/lib/strap-catalog";

type StrapOpinion = "like" | "dislike";

type DeckShellProps = {
  method: DeckMethod;
  title: string;
  description?: string;
  iframeSrc: string;
};

type DeckFrameProps = {
  iframeRef?: MutableRefObject<HTMLIFrameElement | null>;
  name?: string;
  onLoad?: () => void;
  src: string;
  title: string;
};

type DeckResponse = {
  strapId: string;
  strapTitle: string;
  response: StrapOpinion;
  comment?: string;
  updatedAt?: number;
  baseUpdatedAt?: number;
  clientUpdatedAt?: number;
  baseClientUpdatedAt?: number;
};

type DeckStateMessage = {
  type: "deck:state-change";
  method: DeckMethod;
  isAuthenticated?: boolean;
  shortlist: string[];
  briefAcknowledged: boolean;
  preferencesUpdatedAt?: number;
  basePreferencesUpdatedAt?: number;
  baseShortlist?: string[];
  baseBriefAcknowledged?: boolean;
  hiddenStrapIds: string[];
  responses: DeckResponse[];
};

type DeckHydrateMessage = {
  type: "deck:hydrate";
  method: DeckMethod;
  isAuthenticated: boolean;
  userKey?: string;
  shortlist: string[];
  briefAcknowledged: boolean;
  preferencesUpdatedAt?: number;
  basePreferencesUpdatedAt?: number;
  baseShortlist?: string[];
  baseBriefAcknowledged?: boolean;
  hiddenStrapIds: string[];
  responses: DeckResponse[];
};

type DeckStateSnapshot = Omit<DeckHydrateMessage, "type" | "isAuthenticated">;

function normalizeEmail(email: string | undefined) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function normalizeResponses(responses: DeckResponse[]) {
  return responses.map((item) => ({
    strapId: item.strapId,
    strapTitle: item.strapTitle,
    response: item.response,
    comment: item.comment ?? "",
    updatedAt: item.updatedAt,
    baseUpdatedAt: item.baseUpdatedAt,
    clientUpdatedAt: item.clientUpdatedAt,
    baseClientUpdatedAt: item.baseClientUpdatedAt
  }));
}

function serializeDeckState(state: DeckStateSnapshot) {
  const hiddenStrapIds = new Set(state.hiddenStrapIds);

  return JSON.stringify({
    shortlist: state.shortlist.filter((id) => !hiddenStrapIds.has(id)).sort(),
    briefAcknowledged: state.briefAcknowledged,
    responses: normalizeResponses(state.responses)
      .filter((item) => !hiddenStrapIds.has(item.strapId))
      .map((item) => ({
        strapId: item.strapId,
        strapTitle: item.strapTitle,
        response: item.response,
        comment: item.comment ?? "",
        clientUpdatedAt: item.clientUpdatedAt
      }))
      .sort((a, b) => a.strapId.localeCompare(b.strapId))
  });
}

const ADMIN_EMAIL = normalizeEmail(
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "edmangalicea@gmail.com"
);

const METHOD_ROUTES: Array<{ method: DeckMethod; label: string; href: string }> = [
  { method: "v1", label: "Method 1", href: "/method-1" },
  { method: "v2", label: "Method 2", href: "/method-2" }
];

function routeForMethod(method: DeckMethod) {
  return METHOD_ROUTES.find((route) => route.method === method)?.href ?? "/method-1";
}

function MethodNav({ activeMethod }: { activeMethod: DeckMethod }) {
  return (
    <nav className="method-switch" aria-label="Rating methods">
      {METHOD_ROUTES.map((route) => (
        <Link
          key={route.method}
          className={`method-link${route.method === activeMethod ? " active" : ""}`}
          href={route.href}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}

function DeckFrame({
  iframeRef,
  name,
  onLoad,
  src,
  title
}: DeckFrameProps) {
  const localIframeRef = useRef<HTMLIFrameElement | null>(null);

  const setIframeRef = useCallback(
    (node: HTMLIFrameElement | null) => {
      localIframeRef.current = node;
      if (iframeRef) {
        iframeRef.current = node;
      }
    },
    [iframeRef]
  );

  useEffect(() => {
    const iframe = localIframeRef.current;
    if (!iframe) {
      return;
    }

    let cleanupFrame = () => {};
    let resizeFrame = 0;

    const measure = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        try {
          const doc = iframe.contentDocument;
          const body = doc?.body;
          const root = doc?.documentElement;
          if (!doc || !body || !root) {
            return;
          }

          const nextHeight = Math.max(
            body.scrollHeight,
            body.offsetHeight,
            root.clientHeight,
            root.scrollHeight,
            root.offsetHeight,
            window.innerHeight - 96
          );

          iframe.style.height = `${Math.ceil(nextHeight)}px`;
        } catch {
          iframe.style.height = "";
        }
      });
    };

    const connectToFrame = () => {
      cleanupFrame();

      try {
        const doc = iframe.contentDocument;
        const frameWindow = iframe.contentWindow;
        if (!doc || !frameWindow) {
          measure();
          return;
        }

        const resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(doc.documentElement);
        if (doc.body) {
          resizeObserver.observe(doc.body);
        }

        const mutationObserver = new MutationObserver(measure);
        mutationObserver.observe(doc.documentElement, {
          attributes: true,
          characterData: true,
          childList: true,
          subtree: true
        });

        doc.addEventListener("load", measure, true);
        doc.addEventListener("toggle", measure, true);
        frameWindow.addEventListener("resize", measure);

        cleanupFrame = () => {
          resizeObserver.disconnect();
          mutationObserver.disconnect();
          doc.removeEventListener("load", measure, true);
          doc.removeEventListener("toggle", measure, true);
          frameWindow.removeEventListener("resize", measure);
        };

        measure();
        window.setTimeout(measure, 250);
      } catch {
        measure();
      }
    };

    iframe.addEventListener("load", connectToFrame);
    window.addEventListener("resize", measure);
    connectToFrame();

    return () => {
      iframe.removeEventListener("load", connectToFrame);
      window.removeEventListener("resize", measure);
      cleanupFrame();
      window.cancelAnimationFrame(resizeFrame);
    };
  }, [src]);

  return (
    <section className="deck-frame">
      <iframe
        ref={setIframeRef}
        name={name}
        onLoad={onLoad}
        scrolling="auto"
        src={src}
        style={{
          border: 0,
          display: "block",
          minHeight: "100vh",
          overflow: "auto",
          width: "100%"
        }}
        title={title}
      />
    </section>
  );
}

export function DeckShell({
  method,
  title,
  description,
  iframeSrc
}: DeckShellProps) {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const hasConvex = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

  if (!hasClerk || !hasConvex) {
    return (
      <main className="app-shell">
        <header className="app-header">
          <div className="app-brand">
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
          <div className="app-actions">
            <MethodNav activeMethod={method} />
            <span className="sync-chip">Auth/env setup pending</span>
          </div>
        </header>
        <DeckFrame src={iframeSrc} title={title} />
      </main>
    );
  }

  return (
    <AuthenticatedDeckShell
      method={method}
      title={title}
      description={description}
      iframeSrc={iframeSrc}
    />
  );
}

function AuthenticatedDeckShell({
  method,
  title,
  description,
  iframeSrc
}: DeckShellProps) {
  const { isLoaded: isUserLoaded, isSignedIn, user } = useUser();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const prefs = useQuery(
    api.preferences.getForCurrentUser,
    isAuthenticated ? { method } : "skip"
  );
  const responses = useQuery(
    api.responses.getForCurrentUser,
    isAuthenticated ? { method } : "skip"
  );
  const hiddenStrapIds = useQuery(api.responses.getHiddenStrapIds, { method });
  const savePreferences = useMutation(api.preferences.saveForCurrentUser);
  const saveResponses = useMutation(api.responses.upsertManyForCurrentUser);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [optimisticState, setOptimisticState] = useState<DeckStateSnapshot | null>(null);
  const queuedPayloadRef = useRef<string>("");
  const savedPayloadRef = useRef<string>("");
  const optimisticPayloadRef = useRef<string>("");
  const pendingStateRef = useRef<DeckStateMessage | null>(null);
  const flushTimerRef = useRef<number | null>(null);
  const saveInFlightRef = useRef(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const userEmail = normalizeEmail(user?.primaryEmailAddress?.emailAddress);
  const hasSignedInUser = Boolean(isSignedIn && userEmail);
  const canSyncFeedback = hasSignedInUser && isAuthenticated;
  const isAdmin = userEmail === ADMIN_EMAIL;

  const serverState = useMemo<DeckStateSnapshot>(() => {
    const hiddenIds = hiddenStrapIds ?? [];
    const hiddenIdSet = new Set(hiddenIds);

    return {
      method,
      shortlist: (prefs?.shortlist ?? []).filter((id) => !hiddenIdSet.has(id)),
      briefAcknowledged: prefs?.briefAcknowledged ?? false,
      preferencesUpdatedAt: prefs?.updatedAt,
      basePreferencesUpdatedAt: prefs?.updatedAt,
      baseShortlist: (prefs?.shortlist ?? []).filter((id) => !hiddenIdSet.has(id)),
      baseBriefAcknowledged: prefs?.briefAcknowledged ?? false,
      hiddenStrapIds: hiddenIds,
      responses:
        responses
          ?.filter((item) => !hiddenIdSet.has(item.strapId))
          .map((item): DeckResponse => ({
            strapId: item.strapId,
            strapTitle: item.strapTitle,
            response: item.response,
            comment: item.comment ?? "",
            updatedAt: item.updatedAt,
            baseUpdatedAt: item.updatedAt,
            clientUpdatedAt: item.clientUpdatedAt,
            baseClientUpdatedAt: item.clientUpdatedAt
          })) ?? []
    };
  }, [
    method,
    hiddenStrapIds,
    prefs?.briefAcknowledged,
    prefs?.shortlist,
    responses
  ]);

  const serverPayload = useMemo(() => serializeDeckState(serverState), [serverState]);
  const activeState = optimisticState
    ? {
        ...optimisticState,
        hiddenStrapIds: hiddenStrapIds ?? optimisticState.hiddenStrapIds
      }
    : serverState;
  const iframeState = useMemo<DeckHydrateMessage>(() => ({
    type: "deck:hydrate",
    isAuthenticated: canSyncFeedback,
    userKey: canSyncFeedback ? userEmail : undefined,
    ...activeState
  }), [activeState, canSyncFeedback, userEmail]);

  const iframeName = JSON.stringify(iframeState);
  const iframeKey = `${method}:${canSyncFeedback ? userEmail : "guest"}`;

  useEffect(() => {
    setOptimisticState(null);
    optimisticPayloadRef.current = "";
    queuedPayloadRef.current = "";
    savedPayloadRef.current = "";
    pendingStateRef.current = null;
  }, [method, userEmail]);

  useEffect(() => {
    if (!canSyncFeedback || prefs === undefined || responses === undefined || hiddenStrapIds === undefined) {
      return;
    }

    if (optimisticPayloadRef.current === serverPayload) {
      optimisticPayloadRef.current = "";
      setOptimisticState(null);
    }

    if (!optimisticPayloadRef.current) {
      savedPayloadRef.current = serverPayload;
    }
  }, [canSyncFeedback, hiddenStrapIds, prefs, responses, serverPayload]);

  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) {
      return;
    }

    win.postMessage(iframeState, window.location.origin);
  }, [iframeState]);

  function hydrateIframe() {
    const win = iframeRef.current?.contentWindow;
    if (!win) {
      return;
    }

    win.postMessage(iframeState, window.location.origin);
  }

  useEffect(() => {
    if (!isAuthenticated) {
      queuedPayloadRef.current = "";
      savedPayloadRef.current = "";
      pendingStateRef.current = null;
      saveInFlightRef.current = false;
      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      setSaveState("idle");
      return;
    }

    const scheduleFlush = () => {
      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
      }

      flushTimerRef.current = window.setTimeout(() => {
        void flushQueuedState();
      }, 250);
    };

    const flushQueuedState = async () => {
      if (saveInFlightRef.current || !pendingStateRef.current) {
        return;
      }

      const nextState = pendingStateRef.current;
      const payload = queuedPayloadRef.current;
      pendingStateRef.current = null;
      flushTimerRef.current = null;
      saveInFlightRef.current = true;

      let didSucceed = false;

      try {
        const responseResult = await saveResponses({
          method,
          responses: nextState.responses.map((item) => ({
            strapId: item.strapId,
            strapTitle: item.strapTitle,
            response: item.response,
            comment: item.comment?.trim() ? item.comment : undefined,
            updatedAt: item.updatedAt,
            baseUpdatedAt: item.baseUpdatedAt,
            clientUpdatedAt: item.clientUpdatedAt,
            baseClientUpdatedAt: item.baseClientUpdatedAt
          }))
        });
        const preferenceResult = await savePreferences({
          method,
          shortlist: nextState.shortlist,
          briefAcknowledged: nextState.briefAcknowledged,
          baseShortlist: nextState.baseShortlist,
          baseBriefAcknowledged: nextState.baseBriefAcknowledged,
          baseUpdatedAt: nextState.basePreferencesUpdatedAt
        });

        if (preferenceResult.conflict || responseResult.conflicts.length > 0) {
          const resolvedState: DeckStateSnapshot = {
            method,
            shortlist: preferenceResult.shortlist,
            briefAcknowledged: preferenceResult.briefAcknowledged,
            preferencesUpdatedAt: preferenceResult.updatedAt,
            basePreferencesUpdatedAt: preferenceResult.updatedAt,
            baseShortlist: preferenceResult.shortlist,
            baseBriefAcknowledged: preferenceResult.briefAcknowledged,
            hiddenStrapIds: nextState.hiddenStrapIds,
            responses: responseResult.responses.map((item) => ({
              strapId: item.strapId,
              strapTitle: item.strapTitle,
              response: item.response,
              comment: item.comment ?? "",
              updatedAt: item.updatedAt,
              baseUpdatedAt: item.updatedAt,
              clientUpdatedAt: item.clientUpdatedAt,
              baseClientUpdatedAt: item.clientUpdatedAt
            }))
          };
          const resolvedPayload = serializeDeckState(resolvedState);
          optimisticPayloadRef.current = resolvedPayload;
          setOptimisticState(resolvedState);
          savedPayloadRef.current = resolvedPayload;
        } else {
          savedPayloadRef.current = payload;
        }
        didSucceed = true;
      } catch (error) {
        queuedPayloadRef.current = "";
        console.error("Failed to save deck state", error);
      } finally {
        saveInFlightRef.current = false;

        if (pendingStateRef.current) {
          setSaveState("saving");
          scheduleFlush();
          return;
        }

        if (didSucceed) {
          setSaveState("saved");
          window.setTimeout(() => setSaveState("idle"), 1200);
        } else {
          setSaveState("idle");
        }
      }
    };

    const onMessage = (event: MessageEvent<DeckStateMessage>) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (!event.data || event.data.type !== "deck:state-change" || event.data.method !== method) {
        return;
      }

      const nextPayload = serializeDeckState({
        method,
        shortlist: event.data.shortlist,
        briefAcknowledged: event.data.briefAcknowledged,
        hiddenStrapIds: event.data.hiddenStrapIds ?? [],
        responses: event.data.responses
      });

      if (
        queuedPayloadRef.current === nextPayload ||
        savedPayloadRef.current === nextPayload
      ) {
        return;
      }

      const nextState: DeckStateSnapshot = {
        method,
        shortlist: [...event.data.shortlist],
        briefAcknowledged: event.data.briefAcknowledged,
        preferencesUpdatedAt: event.data.preferencesUpdatedAt,
        basePreferencesUpdatedAt: event.data.basePreferencesUpdatedAt,
        baseShortlist: event.data.baseShortlist,
        baseBriefAcknowledged: event.data.baseBriefAcknowledged,
        hiddenStrapIds: event.data.hiddenStrapIds ?? [],
        responses: normalizeResponses(event.data.responses)
      };

      optimisticPayloadRef.current = nextPayload;
      setOptimisticState(nextState);
      queuedPayloadRef.current = nextPayload;
      pendingStateRef.current = {
        type: "deck:state-change",
        ...nextState
      };
      setSaveState("saving");
      scheduleFlush();
    };

    window.addEventListener("message", onMessage as EventListener);
    return () => {
      window.removeEventListener("message", onMessage as EventListener);
      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };
  }, [isAuthenticated, method, savePreferences, saveResponses]);

  const syncLabel = isLoading
    ? hasSignedInUser
      ? "Connecting auth"
      : "View only"
    : hasSignedInUser
      ? isAuthenticated
        ? saveState === "saving"
          ? "Saving opinions"
          : saveState === "saved"
            ? "Saved"
          : "Cloud sync on"
        : "Signed in"
      : "View only";
  const showUserButton = isUserLoaded && hasSignedInUser;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        <div className="app-actions">
          <MethodNav activeMethod={method} />
          <span className="sync-chip">{syncLabel}</span>
          {isAdmin ? (
            <Link className="auth-chip" href="/admin">
              Admin Dashboard
            </Link>
          ) : null}
          {showUserButton ? (
            <div className="auth-chip">
              <UserButton afterSignOutUrl={routeForMethod(method)} />
            </div>
          ) : (
            <Link className="auth-chip primary" href="/sign-in">
              Sign In to Save
            </Link>
          )}
        </div>
      </header>

      {hiddenStrapIds === undefined || (isAuthenticated && (prefs === undefined || responses === undefined)) ? (
        <section className="loading-card">
          <div>
            <h2>Loading your saved deck state</h2>
            <p>
              Pulling the current listing visibility, shortlist, opinions, and
              comments from Convex before the deck renders.
            </p>
          </div>
        </section>
      ) : (
        <DeckFrame
          key={iframeKey}
          iframeRef={iframeRef}
          name={iframeName}
          onLoad={hydrateIframe}
          src={iframeSrc}
          title={title}
        />
      )}
    </main>
  );
}
