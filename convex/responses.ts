import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

function normalizeEmail(email: string | undefined) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function adminEmail() {
  return normalizeEmail(
    process.env.ADMIN_EMAIL ||
      process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      "edmangalicea@gmail.com"
  );
}

const methodArg = v.union(v.literal("v1"), v.literal("v2"));
const responseArg = v.union(v.literal("like"), v.literal("dislike"));

const responseItemArg = v.object({
  strapId: v.string(),
  strapTitle: v.string(),
  response: responseArg,
  comment: v.optional(v.string()),
  updatedAt: v.optional(v.number()),
  baseUpdatedAt: v.optional(v.number()),
  clientUpdatedAt: v.optional(v.number()),
  baseClientUpdatedAt: v.optional(v.number())
});

function normalizeComment(comment: string | undefined) {
  const trimmed = comment?.trim() ?? "";
  return trimmed.length ? trimmed : undefined;
}

async function getHiddenStrapIdSet(ctx: QueryCtx | MutationCtx, method: "v1" | "v2") {
  const rows = await ctx.db
    .query("strapVisibility")
    .withIndex("by_method", (q) => q.eq("method", method))
    .collect();

  return new Set(rows.filter((row) => row.hidden).map((row) => row.strapId));
}

async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await requireIdentity(ctx);
  const email = normalizeEmail(identity.email);

  if (!email || email !== adminEmail()) {
    throw new Error("Not authorized");
  }

  return identity;
}

export const getHiddenStrapIds = query({
  args: {
    method: methodArg
  },
  handler: async (ctx, args) => {
    return [...(await getHiddenStrapIdSet(ctx, args.method))].sort();
  }
});

export const getForCurrentUser = query({
  args: {
    method: methodArg
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const responses = await ctx.db
      .query("strapResponses")
      .withIndex("by_user_and_method", (q) =>
        q.eq("userId", identity.subject).eq("method", args.method)
      )
      .collect();
    const hiddenStrapIds = await getHiddenStrapIdSet(ctx, args.method);

    return responses
      .filter((response) => !hiddenStrapIds.has(response.strapId))
      .sort((a, b) => a.strapTitle.localeCompare(b.strapTitle))
      .map((response) => ({
        strapId: response.strapId,
        strapTitle: response.strapTitle,
        response: response.response,
        comment: response.comment ?? "",
        clientUpdatedAt: response.clientUpdatedAt ?? response.updatedAt,
        updatedAt: response.updatedAt
      }));
  }
});

export const upsertManyForCurrentUser = mutation({
  args: {
    method: methodArg,
    responses: v.array(responseItemArg)
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const email = identity.email?.toLowerCase();

    if (!email) {
      throw new Error("Authenticated user is missing an email address");
    }

    const existing = await ctx.db
      .query("strapResponses")
      .withIndex("by_user_and_method", (q) =>
        q.eq("userId", identity.subject).eq("method", args.method)
      )
      .collect();

    const hiddenStrapIds = await getHiddenStrapIdSet(ctx, args.method);
    const existingByStrapId = new Map(existing.map((record) => [record.strapId, record]));
    const now = Date.now();
    const conflicts: string[] = [];

    for (const item of args.responses) {
      if (hiddenStrapIds.has(item.strapId)) {
        continue;
      }

      const record = existingByStrapId.get(item.strapId);
      const clientUpdatedAt = item.clientUpdatedAt ?? now;
      const baseUpdatedAt = item.baseUpdatedAt ?? item.updatedAt ?? 0;
      const baseClientUpdatedAt = item.baseClientUpdatedAt ?? 0;
      const recordClientUpdatedAt = record?.clientUpdatedAt ?? 0;
      const recordServerUpdatedAt = record?.updatedAt ?? 0;
      const isBasedOnCurrentRecord = record
        ? recordClientUpdatedAt > 0
          ? recordClientUpdatedAt === baseClientUpdatedAt
          : recordServerUpdatedAt <= baseUpdatedAt
        : true;

      if (record && !isBasedOnCurrentRecord) {
        conflicts.push(item.strapId);
        continue;
      }

      const next = {
        userEmail: email,
        strapTitle: item.strapTitle,
        response: item.response,
        comment: normalizeComment(item.comment),
        clientUpdatedAt,
        updatedAt: now
      };

      if (record) {
        if (
          record.userEmail === next.userEmail &&
          record.strapTitle === next.strapTitle &&
          record.response === next.response &&
          (record.comment ?? undefined) === next.comment &&
          (record.clientUpdatedAt ?? record.updatedAt) === next.clientUpdatedAt
        ) {
          continue;
        }

        await ctx.db.patch(record._id, next);
        continue;
      }

      await ctx.db.insert("strapResponses", {
        userId: identity.subject,
        method: args.method,
        strapId: item.strapId,
        ...next
      });
    }

    const current = await ctx.db
      .query("strapResponses")
      .withIndex("by_user_and_method", (q) =>
        q.eq("userId", identity.subject).eq("method", args.method)
      )
      .collect();

    return {
      conflicts,
      responses: current
        .filter((response) => !hiddenStrapIds.has(response.strapId))
        .sort((a, b) => a.strapTitle.localeCompare(b.strapTitle))
        .map((response) => ({
          strapId: response.strapId,
          strapTitle: response.strapTitle,
          response: response.response,
          comment: response.comment ?? "",
          clientUpdatedAt: response.clientUpdatedAt ?? response.updatedAt,
          updatedAt: response.updatedAt
        }))
    };
  }
});

export const getAdminVisibility = query({
  args: {
    method: methodArg
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const rows = await ctx.db
      .query("strapVisibility")
      .withIndex("by_method", (q) => q.eq("method", args.method))
      .collect();

    return rows
      .sort((a, b) => a.strapTitle.localeCompare(b.strapTitle))
      .map((row) => ({
        strapId: row.strapId,
        strapTitle: row.strapTitle,
        hidden: row.hidden,
        updatedAt: row.updatedAt,
        updatedByEmail: row.updatedByEmail
      }));
  }
});

export const setStrapHidden = mutation({
  args: {
    method: methodArg,
    strapId: v.string(),
    strapTitle: v.string(),
    hidden: v.boolean()
  },
  handler: async (ctx, args) => {
    const identity = await requireAdmin(ctx);
    const updatedByEmail = normalizeEmail(identity.email);
    const updatedAt = Date.now();

    const existing = await ctx.db
      .query("strapVisibility")
      .withIndex("by_method_and_strap", (q) =>
        q.eq("method", args.method).eq("strapId", args.strapId)
      )
      .unique();

    const next = {
      strapTitle: args.strapTitle,
      hidden: args.hidden,
      updatedAt,
      updatedByEmail
    };

    if (existing) {
      await ctx.db.patch(existing._id, next);
    } else {
      await ctx.db.insert("strapVisibility", {
        method: args.method,
        strapId: args.strapId,
        ...next
      });
    }

    return {
      strapId: args.strapId,
      hidden: args.hidden,
      updatedAt,
      updatedByEmail
    };
  }
});

export const getAdminDashboard = query({
  args: {
    method: methodArg,
    search: v.optional(v.string()),
    respondentEmail: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const search = args.search?.trim().toLowerCase() ?? "";
    const respondentEmail = args.respondentEmail?.trim().toLowerCase() ?? "";

    const allForMethod = await ctx.db
      .query("strapResponses")
      .withIndex("by_method_and_strap", (q) => q.eq("method", args.method))
      .collect();

    const respondents = [...new Set(allForMethod.map((item) => normalizeEmail(item.userEmail)))].sort();

    const filtered = allForMethod.filter((item) => {
      if (respondentEmail && normalizeEmail(item.userEmail) !== respondentEmail) {
        return false;
      }

      if (!search) {
        return true;
      }

      return (
        item.strapTitle.toLowerCase().includes(search) ||
        normalizeEmail(item.userEmail).includes(search) ||
        (item.comment ?? "").toLowerCase().includes(search)
      );
    });
    const hiddenStrapIds = await getHiddenStrapIdSet(ctx, args.method);

    const grouped = new Map<
      string,
      {
        strapId: string;
        strapTitle: string;
        hidden: boolean;
        entries: Array<{
          userEmail: string;
          response: "like" | "dislike";
          comment: string;
          updatedAt: number;
        }>;
      }
    >();

    for (const item of filtered) {
      if (!grouped.has(item.strapId)) {
        grouped.set(item.strapId, {
          strapId: item.strapId,
          strapTitle: item.strapTitle,
          hidden: hiddenStrapIds.has(item.strapId),
          entries: []
        });
      }

      grouped.get(item.strapId)!.entries.push({
        userEmail: item.userEmail,
        response: item.response,
        comment: item.comment ?? "",
        updatedAt: item.updatedAt
      });
    }

    const straps = [...grouped.values()]
      .map((group) => {
        const totalLikes = group.entries.filter((entry) => entry.response === "like").length;
        const totalDislikes = group.entries.filter((entry) => entry.response === "dislike").length;
        const totalResponses = group.entries.length;
        const commentCount = group.entries.filter((entry) => entry.comment.trim().length > 0).length;
        const lastResponseAt = group.entries.reduce(
          (latest, entry) => Math.max(latest, entry.updatedAt),
          0
        );

        return {
          strapId: group.strapId,
          strapTitle: group.strapTitle,
          hidden: group.hidden,
          totalLikes,
          totalDislikes,
          totalResponses,
          likePercentage: totalResponses ? Math.round((totalLikes / totalResponses) * 100) : 0,
          dislikePercentage: totalResponses ? Math.round((totalDislikes / totalResponses) * 100) : 0,
          commentCount,
          lastResponseAt,
          entries: group.entries.sort((a, b) => a.userEmail.localeCompare(b.userEmail))
        };
      })
      .sort((a, b) => {
        if (a.hidden !== b.hidden) {
          return a.hidden ? 1 : -1;
        }
        if (b.totalLikes !== a.totalLikes) {
          return b.totalLikes - a.totalLikes;
        }
        if (a.totalDislikes !== b.totalDislikes) {
          return a.totalDislikes - b.totalDislikes;
        }
        return a.strapTitle.localeCompare(b.strapTitle);
      });
    const activeFiltered = filtered.filter((item) => !hiddenStrapIds.has(item.strapId));
    const activeStraps = straps.filter((strap) => !strap.hidden);

    return {
      respondents,
      summary: {
        respondentCount: new Set(activeFiltered.map((item) => normalizeEmail(item.userEmail))).size,
        strapCount: activeStraps.length,
        totalLikes: activeFiltered.filter((item) => item.response === "like").length,
        totalDislikes: activeFiltered.filter((item) => item.response === "dislike").length,
        totalCommentedStraps: new Set(
          activeFiltered
            .filter((item) => (item.comment ?? "").trim().length > 0)
            .map((item) => item.strapId)
        ).size
      },
      straps
    };
  }
});

export const getAdminRespondentDetail = query({
  args: {
    method: methodArg,
    respondentEmail: v.string(),
    search: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const respondentEmail = normalizeEmail(args.respondentEmail);
    const search = args.search?.trim().toLowerCase() ?? "";
    const hiddenStrapIds = await getHiddenStrapIdSet(ctx, args.method);

    const rows = await ctx.db
      .query("strapResponses")
      .withIndex("by_method_and_strap", (q) => q.eq("method", args.method))
      .collect();

    return rows
      .filter((item) => normalizeEmail(item.userEmail) === respondentEmail)
      .filter((item) => {
        if (!search) {
          return true;
        }

        return (
          item.strapTitle.toLowerCase().includes(search) ||
          normalizeEmail(item.userEmail).includes(search) ||
          (item.comment ?? "").toLowerCase().includes(search)
        );
      })
      .sort((a, b) => a.strapTitle.localeCompare(b.strapTitle))
      .map((item) => ({
        strapId: item.strapId,
        strapTitle: item.strapTitle,
        response: item.response,
        comment: item.comment ?? "",
        hidden: hiddenStrapIds.has(item.strapId),
        updatedAt: item.updatedAt,
        userEmail: item.userEmail
      }));
  }
});
