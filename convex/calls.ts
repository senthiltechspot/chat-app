import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create a new call
export const createCall = mutation({
  args: {
    channelId: v.id("channels"),
    callId: v.string(),
    callType: v.union(v.literal("video"), v.literal("audio")),
  },
  returns: v.id("calls"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if there's already an active call in this channel
    const existingCall = await ctx.db
      .query("calls")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (existingCall) {
      throw new Error("There's already an active call in this channel");
    }

    const callId = await ctx.db.insert("calls", {
      channelId: args.channelId,
      createdBy: user._id,
      callId: args.callId,
      status: "waiting",
      callType: args.callType,
      startedAt: Date.now(),
    });

    // Add the creator as a participant
    await ctx.db.insert("callParticipants", {
      callId: args.callId,
      userId: user._id,
      joinedAt: Date.now(),
      isMuted: false,
      isVideoOff: args.callType === "audio",
    });

    return callId;
  },
});

// Join an existing call
export const joinCall = mutation({
  args: {
    callId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if call exists and is active
    const call = await ctx.db
      .query("calls")
      .withIndex("by_call_id", (q) => q.eq("callId", args.callId))
      .first();

    if (!call || call.status !== "active") {
      throw new Error("Call not found or not active");
    }

    // Check if user is already in the call
    const existingParticipant = await ctx.db
      .query("callParticipants")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (existingParticipant && !existingParticipant.leftAt) {
      throw new Error("User already in call");
    }

    // Add user as participant
    await ctx.db.insert("callParticipants", {
      callId: args.callId,
      userId: user._id,
      joinedAt: Date.now(),
      isMuted: false,
      isVideoOff: call.callType === "audio",
    });

    return null;
  },
});

// Leave a call
export const leaveCall = mutation({
  args: {
    callId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Find the participant record
    const participant = await ctx.db
      .query("callParticipants")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (participant && !participant.leftAt) {
      await ctx.db.patch(participant._id, {
        leftAt: Date.now(),
      });
    }

    return null;
  },
});

// End a call
export const endCall = mutation({
  args: {
    callId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Find the call
    const call = await ctx.db
      .query("calls")
      .withIndex("by_call_id", (q) => q.eq("callId", args.callId))
      .first();

    if (!call) {
      throw new Error("Call not found");
    }

    // Only the creator can end the call
    if (call.createdBy !== user._id) {
      throw new Error("Only the call creator can end the call");
    }

    // Update call status
    await ctx.db.patch(call._id, {
      status: "ended",
      endedAt: Date.now(),
    });

    // Mark all participants as left
    const participants = await ctx.db
      .query("callParticipants")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .collect();

    for (const participant of participants) {
      if (!participant.leftAt) {
        await ctx.db.patch(participant._id, {
          leftAt: Date.now(),
        });
      }
    }

    return null;
  },
});

// Get active call for a channel
export const getActiveCall = query({
  args: {
    channelId: v.id("channels"),
  },
  returns: v.union(
    v.object({
      _id: v.id("calls"),
      callId: v.string(),
      callType: v.union(v.literal("video"), v.literal("audio")),
      startedAt: v.number(),
      createdBy: v.id("users"),
      creatorName: v.string(),
      participantCount: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const call = await ctx.db
      .query("calls")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!call) {
      return null;
    }

    // Get creator info
    const creator = await ctx.db.get(call.createdBy);
    if (!creator || !creator.name) {
      return null;
    }

    // Get participant count
    const participants = await ctx.db
      .query("callParticipants")
      .withIndex("by_call", (q) => q.eq("callId", call.callId))
      .filter((q) => q.eq(q.field("leftAt"), undefined))
      .collect();

    return {
      _id: call._id,
      callId: call.callId,
      callType: call.callType,
      startedAt: call.startedAt,
      createdBy: call.createdBy,
      creatorName: creator.name,
      participantCount: participants.length,
    };
  },
});

// Get call participants
export const getCallParticipants = query({
  args: {
    callId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("callParticipants"),
      userId: v.id("users"),
      userName: v.string(),
      joinedAt: v.number(),
      isMuted: v.boolean(),
      isVideoOff: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("callParticipants")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .filter((q) => q.eq(q.field("leftAt"), undefined))
      .collect();

    const participantsWithNames = await Promise.all(
      participants.map(async (participant) => {
        const user = await ctx.db.get(participant.userId);
        return {
          _id: participant._id,
          userId: participant.userId,
          userName: user?.name || "Unknown",
          joinedAt: participant.joinedAt,
          isMuted: participant.isMuted,
          isVideoOff: participant.isVideoOff,
        };
      })
    );

    return participantsWithNames;
  },
});

// Update participant status (mute/video)
export const updateParticipantStatus = mutation({
  args: {
    callId: v.string(),
    isMuted: v.optional(v.boolean()),
    isVideoOff: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Find the participant record
    const participant = await ctx.db
      .query("callParticipants")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (!participant || participant.leftAt) {
      throw new Error("User not in call");
    }

    // Update participant status
    const updates: any = {};
    if (args.isMuted !== undefined) updates.isMuted = args.isMuted;
    if (args.isVideoOff !== undefined) updates.isVideoOff = args.isVideoOff;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(participant._id, updates);
    }

    return null;
  },
});
