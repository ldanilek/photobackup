import { v } from "convex/values";
import { componentArg, internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { functions } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const isLinked = query({
  args: { identity: v.id("identities")},
  handler: async (ctx, args) => {
    const identity = await ctx.db.get(args.identity);
    return identity !== null && identity.accessToken;
  },
});

export const getAccessToken = query({
  args: { identity: v.id("identities")},
  returns: v.string(),
  handler: async (ctx, args) => {
    const identity = await ctx.db.get(args.identity);
    if (!identity) {
      throw new Error("Invalid identity");
    }
    return identity.accessToken!;
  },
});


export const link = mutation({
  args: {
    csrfToken: v.string(),
    identity: v.optional(v.id("identities")),
    makeUrl: v.string(),
  },
  returns: v.object({url: v.string(), identity: v.id("identities")}),
  handler: async (ctx, args): Promise<{ url: string; identity: Id<"identities">}> => {
    const csrfToken = args.csrfToken;
    const redirectUri = `${componentArg(ctx, "CONVEX_SITE")}/callback`;
    const url = await ctx.runQuery(args.makeUrl as any, { redirectUri, csrfToken });
    let identity = args.identity!;
    if (!args.identity) {
      identity = await ctx.db.insert("identities", {
        csrfToken,
      });
    } else {
      await ctx.db.patch(args.identity, {
        csrfToken,
      });
    }
    return { url, identity };
  },
});

export const getIdentityByCsrfToken = internalQuery({
  args: { csrfToken: v.string() },
  returns: v.id("identities"),
  handler: async (ctx, args) => {
    const identity = await ctx.db.query("identities")
      .withIndex("csrfToken", (q) => q.eq("csrfToken", args.csrfToken)).unique();
    return identity!._id;
  },
});

export const exchangeCodeForToken = internalAction({
  args: {
    code: v.string(),
    csrfToken: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.runQuery(functions.index.getIdentityByCsrfToken, { csrfToken: args.csrfToken });
    if (!identity) {
      throw new Error("Invalid CSRF token");
    }

    const url = 'https://api.dropbox.com/oauth2/token';
  
    const params = new URLSearchParams({
      code: args.code,
      grant_type: 'authorization_code',
      redirect_uri: `${componentArg(ctx, "CONVEX_SITE")}/callback`,
      client_id: componentArg(ctx, "clientId"),
      client_secret: componentArg(ctx, "clientSecret"),
    });
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    if (!resp.ok) {
      throw new Error(await resp.text());
    }
    const fullToken = await resp.json();
    console.log(fullToken);
    await ctx.runMutation(functions.index.saveToken, {
      identity,
      accessToken: fullToken.access_token,
    });
  }
});

export const saveToken = internalMutation({
  args: {
    identity: v.id("identities"),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.identity, {
      accessToken: args.accessToken,
    });
  },
});

export const setCsrfUrl = query({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return `${componentArg(ctx, "CONVEX_SITE")}/setCsrf`;
  },
});
