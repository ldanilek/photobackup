import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  users: defineTable({
    userId: v.string(),
    identity: v.string(),
  }).index("userId", ["userId"]),
});
