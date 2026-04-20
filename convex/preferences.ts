import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const methodArg = v.union(v.literal("v1"), v.literal("v2"));

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
    briefAcknowledged: v.boolean()
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

    const payload = {
      userId: identity.subject,
      method: args.method,
      shortlist: args.shortlist,
      briefAcknowledged: args.briefAcknowledged,
      updatedAt: Date.now()
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert("deckPreferences", payload);
  }
});
