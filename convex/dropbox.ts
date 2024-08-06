import { v } from "convex/values";
import { mutation, query, app } from "./_generated/server";
import { auth } from "./auth";

export const isLinked = query({
  args: {},
  handler: async (ctx, _args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      return false;
    }

    return ctx.runQuery(app.dropbox.isLinked, { userId });
  },
});

export const link = mutation({
  args: { csrfToken: v.string()},
  returns: v.string(),
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not signed in");
    }

    const redirectUrl = await ctx.runMutation(app.dropbox.link, { csrfToken: args.csrfToken, userId });
    return redirectUrl;
  },
});

export const setCsrfUrl = query({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return ctx.runQuery(app.dropbox.setCsrfUrl, {});
  },
});
