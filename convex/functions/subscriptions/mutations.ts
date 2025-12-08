import { mutation } from "../../_generated/server";
import { v } from "convex/values";

export const createSubscription = mutation({
  args: {
    userId: v.id("users"),
    planType: v.union(v.literal("starter"), v.literal("pro")),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("incomplete")
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if user already has a subscription
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        planType: args.planType,
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripePriceId: args.stripePriceId,
        status: args.status,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd ?? false,
      });
      return existing._id;
    } else {
      // Create new subscription
      const subscriptionId = await ctx.db.insert("subscriptions", {
        userId: args.userId,
        planType: args.planType,
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripePriceId: args.stripePriceId,
        status: args.status,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd ?? false,
      });
      return subscriptionId;
    }
  },
});

export const updateSubscriptionStatus = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("incomplete")
    ),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    await ctx.db.patch(args.subscriptionId, {
      status: args.status,
      ...(args.currentPeriodStart !== undefined && { currentPeriodStart: args.currentPeriodStart }),
      ...(args.currentPeriodEnd !== undefined && { currentPeriodEnd: args.currentPeriodEnd }),
      ...(args.cancelAtPeriodEnd !== undefined && { cancelAtPeriodEnd: args.cancelAtPeriodEnd }),
    });

    return args.subscriptionId;
  },
});

export const cancelSubscription = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    await ctx.db.patch(subscription._id, {
      status: "canceled",
      cancelAtPeriodEnd: true,
    });

    return subscription._id;
  },
});

