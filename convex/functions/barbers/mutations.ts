import { mutation } from "../../_generated/server";
import { v } from "convex/values";

// Shop/Onboarding mutations
export const updateShop = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    address: v.string(),
    phone: v.optional(v.string()),
    description: v.optional(v.string()),
    experience: v.number(),
    image: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify user exists and is a barber
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    if (user.userType !== "barber") {
      throw new Error("Only barbers can have shops");
    }

    let shop = await ctx.db
      .query("shops")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    // Create shop if it doesn't exist
    if (!shop) {
      const shopId = await ctx.db.insert("shops", {
        userId: args.userId,
        name: args.name,
        address: args.address,
        phone: args.phone,
        description: args.description,
        experience: args.experience,
        image: args.image,
        onboardingComplete: false,
        deployed: false,
        services: [],
        openingHours: [],
      });
      return shopId;
    }

    // Update existing shop
    await ctx.db.patch(shop._id, {
      name: args.name,
      address: args.address,
      phone: args.phone,
      description: args.description,
      experience: args.experience,
      image: args.image,
    });

    return shop._id;
  },
});

export const completeOnboarding = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const shop = await ctx.db
      .query("shops")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!shop) {
      throw new Error("Shop not found");
    }

    // Check if user has active subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    // Auto-deploy if subscription is active
    const shouldDeploy = !!(subscription && subscription.status === "active");

    await ctx.db.patch(shop._id, {
      onboardingComplete: true,
      deployed: shouldDeploy, // Automatically deploy if subscription is active
    });

    return shop._id;
  },
});

export const deployShop = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const shop = await ctx.db
      .query("shops")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!shop) {
      throw new Error("Shop not found");
    }

    if (!shop.onboardingComplete) {
      throw new Error("Please complete onboarding first");
    }

    // Check if user has active subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!subscription || subscription.status !== "active") {
      throw new Error("Active subscription is required to deploy your shop");
    }

    await ctx.db.patch(shop._id, {
      deployed: true,
    });

    return shop._id;
  },
});

// Service mutations - now working with shop
export const addService = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const shop = await ctx.db
      .query("shops")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!shop) {
      throw new Error("Shop not found");
    }

    const newService = {
      name: args.name,
      description: args.description,
      price: args.price,
      duration: args.duration,
      isActive: true,
    };

    await ctx.db.patch(shop._id, {
      services: [...(shop.services || []), newService],
    });

    return shop._id;
  },
});

export const updateService = mutation({
  args: {
    userId: v.id("users"),
    serviceIndex: v.number(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    duration: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const shop = await ctx.db
      .query("shops")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!shop) {
      throw new Error("Shop not found");
    }

    const services = shop.services || [];
    if (args.serviceIndex < 0 || args.serviceIndex >= services.length) {
      throw new Error("Service index out of range");
    }

    const updatedServices = [...services];
    updatedServices[args.serviceIndex] = {
      ...updatedServices[args.serviceIndex],
      ...(args.name !== undefined && { name: args.name }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.price !== undefined && { price: args.price }),
      ...(args.duration !== undefined && { duration: args.duration }),
      ...(args.isActive !== undefined && { isActive: args.isActive }),
    };

    await ctx.db.patch(shop._id, {
      services: updatedServices,
    });

    return shop._id;
  },
});

export const deleteService = mutation({
  args: {
    userId: v.id("users"),
    serviceIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const shop = await ctx.db
      .query("shops")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!shop) {
      throw new Error("Shop not found");
    }

    const services = shop.services || [];
    if (args.serviceIndex < 0 || args.serviceIndex >= services.length) {
      throw new Error("Service index out of range");
    }

    const updatedServices = services.filter((_, index) => index !== args.serviceIndex);

    await ctx.db.patch(shop._id, {
      services: updatedServices,
    });

    return shop._id;
  },
});

// Opening hours mutations - now working with shop
export const setAllOpeningHours = mutation({
  args: {
    userId: v.id("users"),
    hours: v.array(
      v.object({
        dayOfWeek: v.number(),
        openingTime: v.string(),
        closingTime: v.string(),
        isClosed: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const shop = await ctx.db
      .query("shops")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!shop) {
      throw new Error("Shop not found");
    }

    await ctx.db.patch(shop._id, {
      openingHours: args.hours,
    });

    return shop._id;
  },
});
