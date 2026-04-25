"use client";

import Link from "next/link";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser
} from "@clerk/nextjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type DeckMethod = "v1";
type StrapOpinion = "like" | "dislike";

type DeckShellProps = {
  method: DeckMethod;
  title: string;
  description: string;
  iframeSrc: string;
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
  responses: DeckResponse[];
};

type DeckHydrateMessage = {
  type: "deck:hydrate";
  method: DeckMethod;
  isAuthenticated: boolean;
  shortlist: string[];
  briefAcknowledged: boolean;
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
  return JSON.stringify({
    shortlist: [...state.shortlist].sort(),
    briefAcknowledged: state.briefAcknowledged,
    responses: normalizeResponses(state.responses)
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
            <span className="app-brand-kicker">Next.js shell active</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="app-actions">
            <span className="sync-chip">Auth/env setup pending</span>
          </div>
        </header>
        <section className="deck-frame">
          <iframe src={iframeSrc} title={title} />
        </section>
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
  const { user } = useUser();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const prefs = useQuery(
    api.preferences.getForCurrentUser,
    isAuthenticated ? { method } : "skip"
  );
  const responses = useQuery(
    api.responses.getForCurrentUser,
    isAuthenticated ? { method } : "skip"
  );
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
  const hasSignedInUser = Boolean(userEmail);
  const canSyncFeedback = hasSignedInUser && isAuthenticated;
  const isAdmin = userEmail === ADMIN_EMAIL;

  const serverState = useMemo<DeckStateSnapshot>(() => ({
    method,
    shortlist: prefs?.shortlist ?? [],
    briefAcknowledged: prefs?.briefAcknowledged ?? false,
    responses:
      responses?.map((item): DeckResponse => ({
        strapId: item.strapId,
        strapTitle: item.strapTitle,
        response: item.response,
        comment: item.comment ?? "",
        updatedAt: item.updatedAt,
        baseUpdatedAt: item.updatedAt,
        clientUpdatedAt: item.clientUpdatedAt,
        baseClientUpdatedAt: item.clientUpdatedAt
      })) ?? []
  }), [
    method,
    prefs?.briefAcknowledged,
    prefs?.shortlist,
    responses
  ]);

  const serverPayload = useMemo(() => serializeDeckState(serverState), [serverState]);
  const activeState = optimisticState ?? serverState;
  const iframeState = useMemo<DeckHydrateMessage>(() => ({
    type: "deck:hydrate",
    isAuthenticated: canSyncFeedback,
    ...activeState
  }), [activeState, canSyncFeedback]);

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
    if (!canSyncFeedback || prefs === undefined || responses === undefined) {
      return;
    }

    if (optimisticPayloadRef.current === serverPayload) {
      optimisticPayloadRef.current = "";
      setOptimisticState(null);
    }

    if (!optimisticPayloadRef.current) {
      savedPayloadRef.current = serverPayload;
    }
  }, [canSyncFeedback, prefs, responses, serverPayload]);

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
        const [, responseResult] = await Promise.all([
          savePreferences({
            method,
            shortlist: nextState.shortlist,
            briefAcknowledged: nextState.briefAcknowledged
          }),
          saveResponses({
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
          })
        ]);

        if (responseResult.conflicts.length > 0) {
          const resolvedState: DeckStateSnapshot = {
            method,
            shortlist: nextState.shortlist,
            briefAcknowledged: nextState.briefAcknowledged,
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

      const nextPayload = JSON.stringify({
        shortlist: [...event.data.shortlist].sort(),
        briefAcknowledged: event.data.briefAcknowledged,
        responses: normalizeResponses(event.data.responses).sort((a, b) =>
          a.strapId.localeCompare(b.strapId)
        )
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
    ? "Connecting auth"
    : hasSignedInUser
      ? isAuthenticated
        ? saveState === "saving"
          ? "Saving opinions"
          : saveState === "saved"
            ? "Saved"
            : "Cloud sync on"
        : "Signed in"
      : "View only";

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-brand-kicker">Clerk + Convex + Vercel</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="app-actions">
          <span className="sync-chip">{syncLabel}</span>
          {isAdmin ? (
            <Link className="auth-chip" href="/admin">
              Admin Dashboard
            </Link>
          ) : null}
          <SignedOut>
            <SignInButton mode="modal">
              <button className="auth-chip primary" type="button">
                Sign In to Save
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="auth-chip">
              <UserButton afterSignOutUrl="/method-1" />
            </div>
          </SignedIn>
        </div>
      </header>

      {isAuthenticated && (prefs === undefined || responses === undefined) ? (
        <section className="loading-card">
          <div>
            <h2>Loading your saved deck state</h2>
            <p>
              Pulling your shortlist, opinions, and comments from Convex before the
              deck renders.
            </p>
          </div>
        </section>
      ) : (
        <section className="deck-frame">
          <iframe
            ref={iframeRef}
            key={iframeKey}
            name={iframeName}
            onLoad={hydrateIframe}
            src={iframeSrc}
            title={title}
          />
        </section>
      )}
    </main>
  );
}
