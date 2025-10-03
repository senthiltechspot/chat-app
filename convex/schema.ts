import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  channels: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
  }).index("by_name", ["name"]),

  messages: defineTable({
    channelId: v.id("channels"),
    authorId: v.id("users"),
    content: v.string(),
  })
    .index("by_channel", ["channelId"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["channelId"],
    }),

  profiles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    avatarId: v.optional(v.id("_storage")),
  }).index("by_user", ["userId"]),

  readReceipts: defineTable({
    userId: v.id("users"),
    channelId: v.id("channels"),
    lastReadMessageTime: v.number(),
  })
    .index("by_user_and_channel", ["userId", "channelId"])
    .index("by_channel", ["channelId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
