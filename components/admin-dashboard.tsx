"use client";

import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  STRAP_CATALOG_BY_METHOD,
  type DeckMethod
} from "@/lib/strap-catalog";

const SELF_FILTER = "__self__";
const METHOD_LABELS: Record<DeckMethod, string> = {
  v1: "Method 1",
  v2: "Method 2"
};

function normalizeEmail(email: string | undefined) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

const ADMIN_EMAIL = normalizeEmail(
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "edmangalicea@gmail.com"
);

type AdminEntry = {
  userEmail: string;
  response: "like" | "dislike";
  comment: string;
  updatedAt: number;
};

type AdminStrapRow = {
  strapId: string;
  strapTitle: string;
  sectionTitle: string;
  sectionRank: number;
  strapRank: number;
  tier: string;
  url?: string;
  image?: string;
  color?: string;
  colorName?: string;
  colorHex?: string;
  bestWatches?: string;
  hidden: boolean;
  totalLikes: number;
  totalDislikes: number;
  totalResponses: number;
  likePercentage: number;
  dislikePercentage: number;
  commentCount: number;
  lastResponseAt: number;
  entries: AdminEntry[];
};

const STRAP_DIRECTIONS = [
  {
    rank: 1,
    title: "Soft Etaupe Everyday Neutral",
    summary: "The most modern and quietly expensive option in the catalog.",
    worksOn: "Tank watches, sector dials, silver-dial dress watches, rectangular watches, refined vintage-inspired pieces."
  },
  {
    rank: 2,
    title: "Deep Dark-Brown Nubuck",
    summary: "Warm, tactile, subtly sensual without looking rugged.",
    worksOn: "Vintage chronographs, cream-dial watches, smaller divers, field watches, dress-casual pieces."
  },
  {
    rank: 3,
    title: "Graphite Suede / Soft Grey Matte",
    summary: "Cool, architectural, and very strong with steel and silver.",
    worksOn: "Black-dial steel watches, monochrome everyday pieces, modern minimalist watches, cool-toned dress watches."
  },
  {
    rank: 4,
    title: "Ink Navy Refined Texture",
    summary: "A better blue than bright navy calf or loud exotic.",
    worksOn: "Blue-dial watches, dress-casual steel pieces, understated sport watches, clean GADA designs."
  },
  {
    rank: 5,
    title: "Black Formal Minimal",
    summary: "Clean black without glossy or corporate energy.",
    worksOn: "Tank watches, ultra-thin dress watches, clean black-dial pieces, evening wear pairings."
  },
  {
    rank: 6,
    title: "Dark-Brown Polished Minimal",
    summary: "A cleaner brown dress lane that avoids rugged heritage styling.",
    worksOn: "Dress-casual pieces, silver dials, cream dials, vintage-inspired watches."
  },
  {
    rank: 7,
    title: "Soft Black Matte Casual",
    summary: "Black with texture and ease instead of boardroom severity.",
    worksOn: "Everyday steel watches, field watches, casual divers, monochrome outfits."
  },
  {
    rank: 8,
    title: "Slate-Grey Structured Leather",
    summary: "A sharper grey lane for structure, polish, and urban restraint.",
    worksOn: "Modern steel watches, black dials, minimalist pieces, angular cases."
  },
  {
    rank: 9,
    title: "Muted Blue Accent",
    summary: "Controlled personality without obvious color.",
    worksOn: "Chronographs, blue-dial watches, relaxed steel pieces, smart-casual tailoring."
  },
  {
    rank: 10,
    title: "One Controlled Matte Exotic",
    summary: "Only if you want one dressier wildcard, not a core daily strap.",
    worksOn: "True dress watches only, especially slim cases or formal vintage-inspired pieces."
  }
];

const STRONGEST_FIRST_ORDER = [
  {
    rank: 1,
    title: "Suede Etaupe Leather watch strap",
    note: "Best expression of the idea. Soft, dry, quietly rich, and the least try-hard."
  },
  {
    rank: 2,
    title: "Nubuck dark brown watch strap",
    note: "The cleanest dark-brown textured option. Rich without looking heritage-costume."
  },
  {
    rank: 3,
    title: "Suede dark grey Leather watch strap",
    note: "Best mix of softness and edge. Feels modern without looking trendy."
  },
  {
    rank: 4,
    title: "Alran suly navy watch strap",
    note: "Best navy in the lineup. Fine grain, elegant surface, and more elevated than basic calf."
  },
  {
    rank: 5,
    title: "Box Calf black Leather watch strap",
    note: "The most elegant black option. Clean, smooth, and appropriately formal."
  }
];

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
  const [search, setSearch] = useState("");
  const [respondentFilter, setRespondentFilter] = useState("");
  const [selectedStrapId, setSelectedStrapId] = useState("");
  const [pendingVisibilityStrapId, setPendingVisibilityStrapId] = useState("");
  const [visibilityError, setVisibilityError] = useState("");
  const [method, setMethod] = useState<DeckMethod>("v1");
  const catalog = STRAP_CATALOG_BY_METHOD[method];
  const setStrapHidden = useMutation(api.responses.setStrapHidden);

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

  const adminVisibility = useQuery(
    api.responses.getAdminVisibility,
    isAdmin ? { method } : "skip"
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
  const referenceDirections = useMemo(() => {
    if (method === "v1") {
      return STRAP_DIRECTIONS;
    }

    const grouped = new Map<
      string,
      {
        rank: number;
        title: string;
        summary: string;
        worksOn: string;
      }
    >();

    for (const item of catalog) {
      if (grouped.has(item.sectionId)) {
        continue;
      }

      grouped.set(item.sectionId, {
        rank: item.sectionRank,
        title: item.sectionTitle,
        summary: item.note ?? "Method 2 wardrobe slot.",
        worksOn: item.bestWatches ?? "See the method 2 deck for watch fit notes."
      });
    }

    return [...grouped.values()].sort((a, b) => a.rank - b.rank);
  }, [catalog, method]);
  const strongestFirstOrder = useMemo(() => {
    if (method === "v1") {
      return STRONGEST_FIRST_ORDER;
    }

    return catalog
      .filter((item) => item.tier === "Primary")
      .sort((a, b) => a.sectionRank - b.sectionRank)
      .slice(0, 5)
      .map((item) => ({
        rank: item.sectionRank,
        title: item.title,
        note: item.note ?? item.bestWatches ?? "Primary method 2 pick."
      }));
  }, [catalog, method]);

  const displayRows = useMemo<AdminStrapRow[]>(() => {
    const responseByStrapId = new Map(
      (dashboard?.straps ?? []).map((strap) => [strap.strapId, strap])
    );
    const visibilityByStrapId = new Map(
      (adminVisibility ?? []).map((item) => [item.strapId, item])
    );
    const catalogIds = new Set(catalog.map((item) => item.id));
    const searchValue = search.trim().toLowerCase();
    const catalogRows = catalog.map((item): AdminStrapRow => {
      const response = responseByStrapId.get(item.id);
      const visibility = visibilityByStrapId.get(item.id);
      const totalResponses = response?.totalResponses ?? 0;

      return {
        strapId: item.id,
        strapTitle: response?.strapTitle ?? visibility?.strapTitle ?? item.title,
        sectionTitle: item.sectionTitle,
        sectionRank: item.sectionRank,
        strapRank: item.strapRank,
        tier: item.tier,
        url: item.url,
        image: item.image,
        color: item.color,
        colorName: item.colorName,
        colorHex: item.colorHex,
        bestWatches: item.bestWatches,
        hidden: visibility?.hidden ?? response?.hidden ?? false,
        totalLikes: response?.totalLikes ?? 0,
        totalDislikes: response?.totalDislikes ?? 0,
        totalResponses,
        likePercentage: totalResponses ? response?.likePercentage ?? 0 : 0,
        dislikePercentage: totalResponses ? response?.dislikePercentage ?? 0 : 0,
        commentCount: response?.commentCount ?? 0,
        lastResponseAt: response?.lastResponseAt ?? 0,
        entries: response?.entries ?? []
      };
    });
    const responseOnlyRows = (dashboard?.straps ?? [])
      .filter((strap) => !catalogIds.has(strap.strapId))
      .map((strap): AdminStrapRow => {
        const visibility = visibilityByStrapId.get(strap.strapId);

        return {
          strapId: strap.strapId,
          strapTitle: visibility?.strapTitle ?? strap.strapTitle,
          sectionTitle: "Response-only listing",
          sectionRank: Number.MAX_SAFE_INTEGER,
          strapRank: Number.MAX_SAFE_INTEGER,
          tier: "Legacy response",
          url: strap.strapId.startsWith("http") ? strap.strapId : undefined,
          image: undefined,
          color: undefined,
          colorName: undefined,
          colorHex: undefined,
          bestWatches: undefined,
          hidden: visibility?.hidden ?? strap.hidden,
          totalLikes: strap.totalLikes,
          totalDislikes: strap.totalDislikes,
          totalResponses: strap.totalResponses,
          likePercentage: strap.likePercentage,
          dislikePercentage: strap.dislikePercentage,
          commentCount: strap.commentCount,
          lastResponseAt: strap.lastResponseAt,
          entries: strap.entries
        };
      });
    const rows = [...catalogRows, ...responseOnlyRows];

    if (!searchValue) {
      return rows;
    }

    return rows.filter((row) => {
      const catalogText = [
        row.strapTitle,
        row.sectionTitle,
        row.tier,
        row.color ?? "",
        row.bestWatches ?? "",
        row.url ?? ""
      ].join(" ").toLowerCase();

      return (
        catalogText.includes(searchValue) ||
        row.entries.some(
          (entry) =>
            normalizeEmail(entry.userEmail).includes(searchValue) ||
            entry.comment.toLowerCase().includes(searchValue)
        )
      );
    });
  }, [adminVisibility, catalog, dashboard?.straps, search]);

  const selectedStrap = useMemo(
    () => displayRows.find((item) => item.strapId === selectedStrapId) ?? null,
    [displayRows, selectedStrapId]
  );
  const visibleDisplayRows = displayRows.filter((row) => !row.hidden);
  const hiddenDisplayRows = displayRows.filter((row) => row.hidden);

  async function toggleStrapVisibility(strap: AdminStrapRow) {
    setVisibilityError("");
    setPendingVisibilityStrapId(strap.strapId);

    try {
      await setStrapHidden({
        method,
        strapId: strap.strapId,
        strapTitle: strap.strapTitle,
        hidden: !strap.hidden
      });
    } catch (error) {
      console.error("Failed to update strap visibility", error);
      setVisibilityError("Could not update listing visibility. Try again.");
    } finally {
      setPendingVisibilityStrapId("");
    }
  }

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
          <div className="admin-filter">
            <label htmlFor="method-filter">Method</label>
            <select
              id="method-filter"
              value={method}
              onChange={(event) => {
                setMethod(event.target.value as DeckMethod);
                setRespondentFilter("");
                setSelectedStrapId("");
              }}
            >
              <option value="v1">Method 1</option>
              <option value="v2">Method 2</option>
            </select>
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
        {visibilityError ? <p className="admin-error">{visibilityError}</p> : null}
      </section>

      <section className="admin-card admin-reference">
        <div className="admin-section-head">
          <div>
            <h2>At A Glance</h2>
            <p>
              Admin-only reference for the active {METHOD_LABELS[method]} catalog.
              Reviewers only see the straps and rating controls.
            </p>
          </div>
        </div>
        <div className="admin-reference-grid">
          {referenceDirections.map((direction) => (
            <article key={direction.title} className="admin-reference-card">
              <div className="summary-rank">{direction.rank}</div>
              <h3>{direction.title}</h3>
              <p>{direction.summary}</p>
              <p>
                <strong>Best on:</strong> {direction.worksOn}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-card admin-reference">
        <div className="admin-section-head">
          <div>
            <h2>Strongest First Order</h2>
            <p>
              The five strongest starting picks for interpreting reviewer feedback
              against the active method.
            </p>
          </div>
        </div>
        <div className="admin-reference-grid compact">
          {strongestFirstOrder.map((item) => (
            <article key={item.title} className="admin-reference-card">
              <div className="summary-rank">{item.rank}</div>
              <h3>{item.title}</h3>
              <p>{item.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-metrics">
        <article className="summary-card">
          <div className="summary-rank">{dashboard?.summary.respondentCount ?? 0}</div>
          <h3>Respondents</h3>
          <p>Unique people with recorded opinions in the current filtered view.</p>
        </article>
        <article className="summary-card">
          <div className="summary-rank">{dashboard && adminVisibility ? visibleDisplayRows.length : 0}</div>
          <h3>Visible listings</h3>
          <p>Catalog rows currently shown to raters and included in aggregate ratings.</p>
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
          <div className="summary-rank">{dashboard && adminVisibility ? hiddenDisplayRows.length : 0}</div>
          <h3>Hidden listings</h3>
          <p>Rows still visible here, excluded from rater dashboards and rating totals.</p>
        </article>
      </section>

      <section className="admin-grid">
        <section className="admin-card">
          <div className="admin-section-head">
            <div>
              <h2>Aggregate strap breakdown</h2>
              <p>
                Hide a listing to remove it from rater dashboards and aggregate
                totals without deleting historical responses.
              </p>
            </div>
          </div>

          {!dashboard || !adminVisibility ? (
            <div className="admin-empty">Loading aggregated response data…</div>
          ) : displayRows.length === 0 ? (
            <div className="admin-empty">No listings match the current filters.</div>
          ) : (
            <div className="admin-table">
              {selectedStrap?.image ? (
                <div className="admin-mobile-selected" aria-live="polite">
                  <img src={selectedStrap.image} alt={selectedStrap.strapTitle} />
                  <strong>{selectedStrap.strapTitle}</strong>
                </div>
              ) : null}
              {displayRows.map((strap) => (
                <article
                  key={strap.strapId}
                  className={`admin-row${selectedStrapId === strap.strapId ? " active" : ""}${strap.hidden ? " is-hidden" : ""}`}
                >
                  <button
                    className="admin-row-select"
                    onClick={() => setSelectedStrapId(strap.strapId)}
                    type="button"
                  >
                    <div className="admin-row-summary">
                      {strap.image ? (
                        <img
                          className="admin-row-thumb"
                          src={strap.image}
                          alt={strap.strapTitle}
                          loading="lazy"
                        />
                      ) : (
                        <div className="admin-row-thumb admin-row-thumb-empty" aria-hidden="true" />
                      )}
                      <div className="admin-row-main">
                        <strong>{strap.strapTitle}</strong>
                        <span>
                          {strap.sectionRank === Number.MAX_SAFE_INTEGER
                            ? strap.sectionTitle
                            : method === "v2"
                              ? `Slot ${strap.sectionRank} · Pick ${strap.strapRank} · ${strap.tier}`
                              : `Direction ${strap.sectionRank} · Rank ${strap.strapRank} · ${strap.tier}`}
                        </span>
                        {strap.colorName ? (
                          <span>
                            {strap.colorName}
                            {strap.bestWatches ? ` · ${strap.bestWatches}` : ""}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="admin-row-stats">
                      <span>{strap.totalResponses} total responses</span>
                      <span className="pill positive">{strap.totalLikes} like</span>
                      <span className="pill negative">{strap.totalDislikes} dislike</span>
                      <span>{strap.likePercentage}% like</span>
                      <span>{strap.commentCount} comments</span>
                      <span>{formatDateTime(strap.lastResponseAt)}</span>
                    </div>
                  </button>
                  <div className="admin-row-actions">
                    {strap.hidden ? <span className="pill hidden">Hidden</span> : null}
                    {strap.url ? (
                      <a className="admin-row-link" href={strap.url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    ) : null}
                    <button
                      className={`visibility-toggle${strap.hidden ? " restore" : ""}`}
                      disabled={pendingVisibilityStrapId === strap.strapId}
                      onClick={() => {
                        void toggleStrapVisibility(strap);
                      }}
                      type="button"
                    >
                      {pendingVisibilityStrapId === strap.strapId
                        ? "Saving"
                        : strap.hidden
                          ? "Unhide"
                          : "Hide"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="admin-card admin-sticky-detail">
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
              {selectedStrap.image ? (
                <img
                  className="admin-detail-image"
                  src={selectedStrap.image}
                  alt={selectedStrap.strapTitle}
                />
              ) : null}
              <div className="admin-detail-heading">
                <h3>{selectedStrap.strapTitle}</h3>
                {selectedStrap.hidden ? <span className="pill hidden">Hidden</span> : null}
              </div>
              <p>
                {selectedStrap.strapRank === Number.MAX_SAFE_INTEGER
                  ? selectedStrap.sectionTitle
                  : method === "v2"
                    ? `${selectedStrap.sectionTitle} · Pick ${selectedStrap.strapRank}`
                    : `${selectedStrap.sectionTitle} · Rank ${selectedStrap.strapRank}`}
              </p>
              {selectedStrap.colorName ? (
                <p>
                  {selectedStrap.colorName}
                  {selectedStrap.colorHex ? ` ${selectedStrap.colorHex}` : ""}
                  {selectedStrap.bestWatches ? ` · ${selectedStrap.bestWatches}` : ""}
                </p>
              ) : null}
              {selectedStrap.entries.length === 0 ? (
                <div className="admin-empty">No respondent has rated this listing yet.</div>
              ) : (
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
              )}
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
              <article
                key={`${entry.strapId}-${entry.userEmail}`}
                className={`admin-entry${entry.hidden ? " is-hidden" : ""}`}
              >
                <div className="admin-entry-head">
                  <strong>{entry.strapTitle}</strong>
                  <div className="admin-entry-pills">
                    {entry.hidden ? <span className="pill hidden">Hidden</span> : null}
                    <span className={`pill ${entry.response === "like" ? "positive" : "negative"}`}>
                      {entry.response}
                    </span>
                  </div>
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
