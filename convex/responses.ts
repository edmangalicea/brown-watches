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

const methodArg = v.literal("v1");
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

    return responses
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

    const existingByStrapId = new Map(existing.map((record) => [record.strapId, record]));
    const now = Date.now();
    const conflicts: string[] = [];

    for (const item of args.responses) {
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

    const grouped = new Map<
      string,
      {
        strapId: string;
        strapTitle: string;
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
        if (b.totalLikes !== a.totalLikes) {
          return b.totalLikes - a.totalLikes;
        }
        if (a.totalDislikes !== b.totalDislikes) {
          return a.totalDislikes - b.totalDislikes;
        }
        return a.strapTitle.localeCompare(b.strapTitle);
      });

    return {
      respondents,
      summary: {
        respondentCount: new Set(filtered.map((item) => normalizeEmail(item.userEmail))).size,
        strapCount: straps.length,
        totalLikes: filtered.filter((item) => item.response === "like").length,
        totalDislikes: filtered.filter((item) => item.response === "dislike").length,
        totalCommentedStraps: new Set(
          filtered
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
        updatedAt: item.updatedAt,
        userEmail: item.userEmail
      }));
  }
});
