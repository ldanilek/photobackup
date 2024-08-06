import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  identities: defineTable({
    csrfToken: v.string(),
    accessToken: v.optional(v.string()),
  }).index("csrfToken", ["csrfToken"]),
});
