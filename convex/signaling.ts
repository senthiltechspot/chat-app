import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Send WebRTC signaling data
export const sendSignal = mutation({
  args: {
    callId: v.string(),
    signal: v.string(), // JSON stringified signal data
    type: v.union(v.literal("offer"), v.literal("answer"), v.literal("ice-candidate")),
    targetUserId: v.optional(v.id("users")), // If targeting specific user
  },
  returns: v.id("signaling"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Store the signal in the database
    const signalId = await ctx.db.insert("signaling", {
      callId: args.callId,
      fromUserId: userId,
      targetUserId: args.targetUserId,
      type: args.type,
      signal: args.signal,
      timestamp: Date.now(),
    });

    return signalId;
  },
});

// Get signaling data for a call
export const getSignalingData = query({
  args: {
    callId: v.string(),
    fromUserId: v.optional(v.id("users")),
  },
  returns: v.array(
    v.object({
      _id: v.id("signaling"),
      callId: v.string(),
      fromUserId: v.id("users"),
      targetUserId: v.optional(v.id("users")),
      type: v.union(v.literal("offer"), v.literal("answer"), v.literal("ice-candidate")),
      signal: v.string(),
      timestamp: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get signals for this call where the current user is either sender or target
    const signals = await ctx.db
      .query("signaling")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .filter((q) => 
        q.or(
          q.eq(q.field("fromUserId"), userId),
          q.eq(q.field("targetUserId"), userId),
          q.eq(q.field("targetUserId"), undefined) // Broadcast signals
        )
      )
      .order("desc")
      .take(50); // Limit to recent signals

    return signals;
  },
});
