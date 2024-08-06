import { v } from "convex/values";
import { app, mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { api } from "./_generated/api";

export const generateUploadUrl = mutation({
  args: {
    // ...
  },
  handler: async (ctx, _args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not signed in");
    }
    // use `args` and/or `ctx.auth` to authorize the user
    // ...
    
    // Return an upload URL
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveStorageIds = mutation({
  // You can customize these as you like
  args: {
    storageIds: v.array(
      v.object({
        storageId: v.id("_storage"),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not signed in");
    }
    
    // Save the storageId to the database using `insert`
    for (const { storageId } of args.storageIds) {
      await ctx.db.insert("photos", {
        userId,
        storageId,
      });
    }
  },
});

export const list = query({
  // You can customize these as you like
  args: {
    // ...
  },
  handler: async (ctx, _args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Not signed in");
    }
    
    // Return the list of photos
    const photoDocs = await ctx.db.query("photos").withIndex("userId", (q) => q.eq("userId", userId)).collect();
    const photosWithUrls = await Promise.all(photoDocs.map(async (photoDoc) => {
      const storageUrl = await ctx.storage.getUrl(photoDoc.storageId);
      return { ...photoDoc, storageUrl: storageUrl };
    }));
    return photosWithUrls;
  },
});

export const backupToDropbox = mutation({
  args: {
    // ...
  },
  handler: async (ctx, _args) => {
    const photoList = await ctx.runQuery(api.files.list, {});
    const userId = (await auth.getUserId(ctx))!;
    for (const { storageUrl } of photoList) {
      await ctx.runMutation(app.dropbox.upload, { userId, storageUrl: storageUrl! });
    }
  },
});
