"use client";

import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type DeckMethod = "v1" | "v2";

const SELF_FILTER = "__self__";

function normalizeEmail(email: string | undefined) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

const ADMIN_EMAIL = normalizeEmail(
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "edmangalicea@gmail.com"
);

function formatDateTime(timestamp: number) {
  if (!timestamp) {
    return "No responses yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(timestamp);
}

export function AdminDashboard() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <main className="loading-card">
        <div className="config-card">
          <h2>Admin dashboard is not configured yet</h2>
          <p>
            Add the Clerk and Convex environment variables before enabling the
            authenticated dashboard.
          </p>
        </div>
      </main>
    );
  }

  return <ConfiguredAdminDashboard />;
}

function ConfiguredAdminDashboard() {
  const { user, isLoaded } = useUser();
  const [method, setMethod] = useState<DeckMethod>("v1");
  const [search, setSearch] = useState("");
  const [respondentFilter, setRespondentFilter] = useState("");
  const [selectedStrapId, setSelectedStrapId] = useState("");

  const userEmail = normalizeEmail(user?.primaryEmailAddress?.emailAddress);
  const isAdmin = userEmail === ADMIN_EMAIL;
  const resolvedRespondentEmail = normalizeEmail(
    respondentFilter === SELF_FILTER ? userEmail : respondentFilter || undefined
  ) || undefined;

  const dashboard = useQuery(
    api.responses.getAdminDashboard,
    isAdmin
      ? {
          method,
          search: search.trim() || undefined,
          respondentEmail: resolvedRespondentEmail
        }
      : "skip"
  );

  const respondentDetail = useQuery(
    api.responses.getAdminRespondentDetail,
    isAdmin && resolvedRespondentEmail
      ? {
          method,
          respondentEmail: resolvedRespondentEmail,
          search: search.trim() || undefined
        }
      : "skip"
  );

  const selectedStrap = useMemo(
    () => dashboard?.straps.find((item) => item.strapId === selectedStrapId) ?? null,
    [dashboard?.straps, selectedStrapId]
  );

  if (!isLoaded) {
    return (
      <main className="loading-card">
        <div>
          <h2>Loading admin session</h2>
          <p>Checking your signed-in identity before loading dashboard data.</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="admin-shell">
        <section className="admin-card admin-empty">
          <h1>Admin Dashboard</h1>
          <p>Sign in with your Google account to review respondent feedback.</p>
          <SignInButton mode="modal">
            <button className="auth-chip primary" type="button">
              Sign In
            </button>
          </SignInButton>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="admin-shell">
        <section className="admin-card admin-empty">
          <h1>Access Denied</h1>
          <p>
            This dashboard is restricted to <strong>{ADMIN_EMAIL}</strong>.
          </p>
          <Link className="auth-chip" href="/method-1">
            Back to deck
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-brand-kicker">Admin dashboard</span>
          <h1>Respondent opinions</h1>
          <p>
            Aggregate strap sentiment, review comments, and switch between each
            respondent&apos;s detailed opinions without leaving the app.
          </p>
        </div>
        <div className="app-actions">
          <nav className="method-switch" aria-label="Primary navigation">
            <Link className="method-link" href="/method-1">
              Method 1
            </Link>
            <Link className="method-link" href="/method-2">
              Method 2
            </Link>
            <span className="method-link active">Admin</span>
          </nav>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="auth-chip primary" type="button">
                Sign In
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

      <section className="admin-card admin-controls">
        <div className="admin-toolbar">
          <div className="method-switch" aria-label="Method selector">
            <button
              className={`method-link${method === "v1" ? " active" : ""}`}
              onClick={() => {
                setMethod("v1");
                setSelectedStrapId("");
              }}
              type="button"
            >
              Method 1
            </button>
            <button
              className={`method-link${method === "v2" ? " active" : ""}`}
              onClick={() => {
                setMethod("v2");
                setSelectedStrapId("");
              }}
              type="button"
            >
              Method 2
            </button>
          </div>

          <div className="admin-filter">
            <label htmlFor="admin-search">Search</label>
            <input
              id="admin-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSelectedStrapId("");
              }}
              placeholder="Search straps, emails, comments"
            />
          </div>

          <div className="admin-filter">
            <label htmlFor="respondent-filter">Respondent</label>
            <select
              id="respondent-filter"
              value={respondentFilter}
              onChange={(event) => {
                setRespondentFilter(event.target.value);
                setSelectedStrapId("");
              }}
            >
              <option value="">All respondents</option>
              <option value={SELF_FILTER}>My responses</option>
              {(dashboard?.respondents ?? []).map((email) => (
                <option key={email} value={email}>
                  {email}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="admin-metrics">
        <article className="summary-card">
          <div className="summary-rank">{dashboard?.summary.respondentCount ?? 0}</div>
          <h3>Respondents</h3>
          <p>Unique people with recorded opinions in the current filtered view.</p>
        </article>
        <article className="summary-card">
          <div className="summary-rank">{dashboard?.summary.strapCount ?? 0}</div>
          <h3>Straps</h3>
          <p>Listings with at least one matching response for this method.</p>
        </article>
        <article className="summary-card">
          <div className="summary-rank">{dashboard?.summary.totalLikes ?? 0}</div>
          <h3>Likes</h3>
          <p>Total positive responses in the active result set.</p>
        </article>
        <article className="summary-card">
          <div className="summary-rank">{dashboard?.summary.totalDislikes ?? 0}</div>
          <h3>Dislikes</h3>
          <p>Total negative responses in the active result set.</p>
        </article>
        <article className="summary-card">
          <div className="summary-rank">{dashboard?.summary.totalCommentedStraps ?? 0}</div>
          <h3>Commented straps</h3>
          <p>Unique straps that have at least one comment in the filtered view.</p>
        </article>
      </section>

      <section className="admin-grid">
        <section className="admin-card">
          <div className="admin-section-head">
            <div>
              <h2>Aggregate strap breakdown</h2>
              <p>
                Click any strap to inspect every respondent&apos;s vote and comment.
              </p>
            </div>
          </div>

          {!dashboard ? (
            <div className="admin-empty">Loading aggregated response data…</div>
          ) : dashboard.straps.length === 0 ? (
            <div className="admin-empty">No responses match the current method and filters.</div>
          ) : (
            <div className="admin-table">
              {dashboard.straps.map((strap) => (
                <button
                  key={strap.strapId}
                  className={`admin-row${selectedStrapId === strap.strapId ? " active" : ""}`}
                  onClick={() => setSelectedStrapId(strap.strapId)}
                  type="button"
                >
                  <div className="admin-row-main">
                    <strong>{strap.strapTitle}</strong>
                    <span>{strap.totalResponses} total responses</span>
                  </div>
                  <div className="admin-row-stats">
                    <span className="pill positive">{strap.totalLikes} like</span>
                    <span className="pill negative">{strap.totalDislikes} dislike</span>
                    <span>{strap.likePercentage}% like</span>
                    <span>{strap.commentCount} comments</span>
                    <span>{formatDateTime(strap.lastResponseAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="admin-card">
          <div className="admin-section-head">
            <div>
              <h2>Selected strap detail</h2>
              <p>Every respondent opinion and comment for the active strap.</p>
            </div>
          </div>

          {!selectedStrap ? (
            <div className="admin-empty">Select a strap from the left to inspect detailed responses.</div>
          ) : (
            <div className="admin-detail">
              <h3>{selectedStrap.strapTitle}</h3>
              <div className="admin-detail-list">
                {selectedStrap.entries.map((entry) => (
                  <article key={`${selectedStrap.strapId}-${entry.userEmail}`} className="admin-entry">
                    <div className="admin-entry-head">
                      <strong>{entry.userEmail}</strong>
                      <span className={`pill ${entry.response === "like" ? "positive" : "negative"}`}>
                        {entry.response}
                      </span>
                    </div>
                    <p>{entry.comment.trim().length ? entry.comment : "No comment left."}</p>
                    <span className="admin-entry-time">{formatDateTime(entry.updatedAt)}</span>
                  </article>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>

      <section className="admin-card">
        <div className="admin-section-head">
          <div>
            <h2>Respondent detail</h2>
            <p>
              Switch to a specific person, including your own responses, to review their choices in isolation.
            </p>
          </div>
        </div>

        {!resolvedRespondentEmail ? (
          <div className="admin-empty">Choose a respondent filter to inspect one person&apos;s opinions.</div>
        ) : !respondentDetail ? (
          <div className="admin-empty">Loading respondent detail…</div>
        ) : respondentDetail.length === 0 ? (
          <div className="admin-empty">No respondent detail matches the current method and search.</div>
        ) : (
          <div className="admin-detail-list">
            {respondentDetail.map((entry) => (
              <article key={`${entry.strapId}-${entry.userEmail}`} className="admin-entry">
                <div className="admin-entry-head">
                  <strong>{entry.strapTitle}</strong>
                  <span className={`pill ${entry.response === "like" ? "positive" : "negative"}`}>
                    {entry.response}
                  </span>
                </div>
                <p>{entry.comment.trim().length ? entry.comment : "No comment left."}</p>
                <span className="admin-entry-time">{formatDateTime(entry.updatedAt)}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
