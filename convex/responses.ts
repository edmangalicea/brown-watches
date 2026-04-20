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
  comment: v.optional(v.string())
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

    const nextByStrapId = new Map(
      args.responses.map((item) => [
        item.strapId,
        {
          ...item,
          comment: normalizeComment(item.comment)
        }
      ])
    );

    for (const record of existing) {
      const next = nextByStrapId.get(record.strapId);

      if (!next) {
        await ctx.db.delete(record._id);
        continue;
      }

      await ctx.db.patch(record._id, {
        userEmail: email,
        strapTitle: next.strapTitle,
        response: next.response,
        comment: next.comment,
        updatedAt: Date.now()
      });
      nextByStrapId.delete(record.strapId);
    }

    for (const next of nextByStrapId.values()) {
      await ctx.db.insert("strapResponses", {
        userId: identity.subject,
        userEmail: email,
        method: args.method,
        strapId: next.strapId,
        strapTitle: next.strapTitle,
        response: next.response,
        comment: next.comment,
        updatedAt: Date.now()
      });
    }
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
