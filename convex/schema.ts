import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    userType: v.union(v.literal("customer"), v.literal("barber"),v.literal("admin")),
  }).index("by_email", ["email"]),

  shops: defineTable({
    userId: v.id("users"),
    name: v.string(),
    address: v.string(),
    experience: v.number(),
    image: v.string(),
    phone: v.optional(v.string()),
    description: v.optional(v.string()),
    onboardingComplete: v.boolean(),
    deployed: v.boolean(), // Shop is visible to customers only when deployed and has active subscription
    services: v.array(
      v.object({
        name: v.string(),
        description: v.optional(v.string()),
        price: v.number(),
        duration: v.number(), // in minutes
        isActive: v.boolean(),
      })
    ),
    openingHours: v.array(
      v.object({
        dayOfWeek: v.number(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        openingTime: v.string(), // Format: "HH:mm" (e.g., "09:00")
        closingTime: v.string(), // Format: "HH:mm" (e.g., "18:00")
        isClosed: v.boolean(),
      })
    ),
  }).index("by_userId", ["userId"]),

  bookings: defineTable({
    customerId: v.id("users"),
    shopId: v.id("shops"),
    services: v.array(
      v.object({
        name: v.string(),
        price: v.number(),
        duration: v.number(),
      })
    ),
    appointmentDate: v.string(), // ISO date string (YYYY-MM-DD)
    appointmentTime: v.string(), // Time string (HH:mm)
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    totalPrice: v.number(),
    totalDuration: v.number(), // in minutes
    notes: v.optional(v.string()),
    rating: v.optional(v.number()), // Rating from 1 to 5
  })
    .index("by_customerId", ["customerId"])
    .index("by_shopId", ["shopId"])
    .index("by_date", ["appointmentDate"]),

  subscriptions: defineTable({
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
    currentPeriodStart: v.number(), // Unix timestamp
    currentPeriodEnd: v.number(), // Unix timestamp
    cancelAtPeriodEnd: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_stripeCustomerId", ["stripeCustomerId"]),
});
