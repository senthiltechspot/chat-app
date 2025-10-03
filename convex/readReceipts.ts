import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const markChannelAsRead = mutation({
  args: {
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();

    // Check if read receipt already exists
    const existing = await ctx.db
      .query("readReceipts")
      .withIndex("by_user_and_channel", (q) => 
        q.eq("userId", userId).eq("channelId", args.channelId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastReadMessageTime: now,
      });
    } else {
      await ctx.db.insert("readReceipts", {
        userId,
        channelId: args.channelId,
        lastReadMessageTime: now,
      });
    }
  },
});

export const getUnreadCount = query({
  args: {
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return 0;
    }

    // Get user's last read time for this channel
    const readReceipt = await ctx.db
      .query("readReceipts")
      .withIndex("by_user_and_channel", (q) => 
        q.eq("userId", userId).eq("channelId", args.channelId)
      )
      .first();

    const lastReadTime = readReceipt?.lastReadMessageTime || 0;

    // Count messages newer than last read time
    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .filter((q) => q.gt(q.field("_creationTime"), lastReadTime))
      .collect();

    return unreadMessages.length;
  },
});

export const getAllUnreadCounts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {};
    }

    // Get all channels
    const channels = await ctx.db.query("channels").collect();
    
    // Get all read receipts for this user
    const readReceipts = await ctx.db
      .query("readReceipts")
      .withIndex("by_user_and_channel", (q) => q.eq("userId", userId))
      .collect();

    const readReceiptMap = new Map(
      readReceipts.map(receipt => [receipt.channelId, receipt.lastReadMessageTime])
    );

    const unreadCounts: Record<string, number> = {};

    for (const channel of channels) {
      const lastReadTime = readReceiptMap.get(channel._id) || 0;
      
      const unreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
        .filter((q) => q.gt(q.field("_creationTime"), lastReadTime))
        .collect();

      unreadCounts[channel._id] = unreadMessages.length;
    }

    return unreadCounts;
  },
});
