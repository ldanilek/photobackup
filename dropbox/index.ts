import { v } from "convex/values";
import { mutation, query, component, internalQuery, componentArg, action } from "./_generated/server";
import { createFunctionHandle } from "convex/server";
import { functions } from "./_generated/api";
import mime from "mime";

export const isLinked = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").withIndex("userId", (q) => q.eq("userId", args.userId)).unique();
    if (!user) {
      return false;
    }
    return ctx.runQuery(component.oauth.isLinked, { identity: user.identity });
  },
});

export const link = mutation({
  args: {
    csrfToken: v.string(),
    userId: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    const user = await ctx.db.query("users")
      .withIndex("userId", (q) => q.eq("userId", args.userId)).unique();
    const { url, identity } = await ctx.runMutation(component.oauth.link, {
      csrfToken: args.csrfToken,
      identity: user?.identity,
      makeUrl: await createFunctionHandle(functions.index.authorizationUrl),
    });
    if (user === null) {
      await ctx.db.insert("users", {
        userId: args.userId,
        identity,
      });
    }
    return url;
  },
});

export const authorizationUrl = internalQuery({
  args: {
    redirectUri: v.string(),
    csrfToken: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const MY_CLIENT_ID = componentArg(ctx, "appKey");
    const redirectUri = encodeURIComponent(args.redirectUri);
    const state = encodeURIComponent(args.csrfToken);
    return `https://www.dropbox.com/oauth2/authorize?client_id=${MY_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&state=${state}`;
  },
});

export const setCsrfUrl = query({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return ctx.runQuery(component.oauth.setCsrfUrl, {});
  },
});

export const upload = mutation({
  args: {
    userId: v.string(),
    storageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users")
      .withIndex("userId", (q) => q.eq("userId", args.userId)).unique();
    const token = await ctx.runQuery(component.oauth.getAccessToken, { identity: user!.identity });
    await ctx.scheduler.runAfter(0, functions.index.uploadFile, {
      token,
      storageUrl: args.storageUrl,
    });
  },
});

export const uploadFile = action({
  args: {
    token: v.string(),
    storageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const toUpload = await fetch(args.storageUrl);
    if (!toUpload.ok) {
      throw new Error(`Failed to fetch ${args.storageUrl}`);
    }
    const blob = await toUpload.blob();
    const extension = mime.getExtension(blob.type) || "txt";
    const url = "https://content.dropboxapi.com/2/files/upload";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.token}`,
        "Content-Type": "application/octet-stream",
        "Dropbox-API-Arg": JSON.stringify({
          autorename: true,
          mode: "add",
          mute: false,
          path: "/photos/" + crypto.randomUUID() + "." + extension,
          strict_conflict: false,
        }),
      },
      body: blob,
    });
    if (!response.ok) {
      throw new Error(`Failed to upload to Dropbox: ${response.statusText}`);
    }
  },
});
