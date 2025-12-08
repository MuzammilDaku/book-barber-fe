import { query } from "../../_generated/server";
import { v } from "convex/values";

export const getSubscription = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    
    return subscription;
  },
});

export const getSubscriptionByStripeCustomer = query({
  args: {
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();
    
    return subscription;
  },
});

