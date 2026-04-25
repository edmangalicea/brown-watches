import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  deckPreferences: defineTable({
    userId: v.string(),
    method: v.literal("v1"),
    shortlist: v.array(v.string()),
    briefAcknowledged: v.boolean(),
    updatedAt: v.number()
  }).index("by_user_and_method", ["userId", "method"]),
  strapResponses: defineTable({
    userId: v.string(),
    userEmail: v.string(),
    method: v.literal("v1"),
    strapId: v.string(),
    strapTitle: v.string(),
    response: v.union(v.literal("like"), v.literal("dislike")),
    comment: v.optional(v.string()),
    clientUpdatedAt: v.optional(v.number()),
    updatedAt: v.number()
  })
    .index("by_user_and_method", ["userId", "method"])
    .index("by_method_and_strap", ["method", "strapId"])
    .index("by_user_method_and_strap", ["userId", "method", "strapId"])
});
