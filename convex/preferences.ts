import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";

const methodArg = v.union(v.literal("v1"), v.literal("v2"));

async function getHiddenStrapIdSet(ctx: MutationCtx, method: "v1" | "v2") {
  const rows = await ctx.db
    .query("strapVisibility")
    .withIndex("by_method", (q) => q.eq("method", method))
    .collect();

  return new Set(rows.filter((row) => row.hidden).map((row) => row.strapId));
}

export const getForCurrentUser = query({
  args: {
    method: methodArg
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const preference = await ctx.db
      .query("deckPreferences")
      .withIndex("by_user_and_method", (q) =>
        q.eq("userId", identity.subject).eq("method", args.method)
      )
      .unique();

    if (!preference) {
      return null;
    }

    return {
      _id: preference._id,
      shortlist: preference.shortlist,
      briefAcknowledged: preference.briefAcknowledged,
      updatedAt: preference.updatedAt
    };
  }
});

export const saveForCurrentUser = mutation({
  args: {
    method: methodArg,
    shortlist: v.array(v.string()),
    briefAcknowledged: v.boolean(),
    baseShortlist: v.optional(v.array(v.string())),
    baseBriefAcknowledged: v.optional(v.boolean()),
    baseUpdatedAt: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("deckPreferences")
      .withIndex("by_user_and_method", (q) =>
        q.eq("userId", identity.subject).eq("method", args.method)
      )
      .unique();

    const hiddenStrapIds = await getHiddenStrapIdSet(ctx, args.method);
    const existingHiddenShortlist = existing?.shortlist.filter((id) => hiddenStrapIds.has(id)) ?? [];
    const visibleShortlist = args.shortlist.filter((id) => !hiddenStrapIds.has(id));
    const visibleBaseShortlist = (args.baseShortlist ?? []).filter((id) => !hiddenStrapIds.has(id));
    const visibleExistingShortlist =
      existing?.shortlist.filter((id) => !hiddenStrapIds.has(id)) ?? [];
    const baseShortlist = new Set(visibleBaseShortlist);
    const nextShortlist = new Set(visibleShortlist);
    const added = [...nextShortlist].filter((id) => !baseShortlist.has(id));
    const removed = [...baseShortlist].filter((id) => !nextShortlist.has(id));
    const existingChangedSinceBase =
      existing && args.baseUpdatedAt !== undefined && existing.updatedAt > args.baseUpdatedAt;
    const visibleResolvedShortlist = existingChangedSinceBase
      ? [
          ...new Set([
            ...visibleExistingShortlist.filter((id) => !removed.includes(id)),
            ...added
          ])
        ]
      : visibleShortlist;
    const shortlist = [...new Set([...visibleResolvedShortlist, ...existingHiddenShortlist])];
    const briefAcknowledged = existingChangedSinceBase
      ? existing.briefAcknowledged || args.briefAcknowledged
      : args.briefAcknowledged;
    const updatedAt = Date.now();

    const payload = {
      userId: identity.subject,
      method: args.method,
      shortlist,
      briefAcknowledged,
      updatedAt
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return {
        conflict: Boolean(existingChangedSinceBase),
        shortlist,
        briefAcknowledged,
        updatedAt
      };
    }

    await ctx.db.insert("deckPreferences", payload);
    return {
      conflict: false,
      shortlist,
      briefAcknowledged,
      updatedAt
    };
  }
});
