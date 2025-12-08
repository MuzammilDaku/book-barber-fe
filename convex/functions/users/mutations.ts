import { mutation } from "../../_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    userType: v.union(
      v.literal("customer"),
      v.literal("barber"),
      v.literal("admin")
    ),  
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create the user record
    const userId = await ctx.db.insert("users", {
      fullName: args.fullName,
      email: args.email,
      phone: args.phone,
      userType: args.userType,
    });

    if (args.userType === "barber") {
      // Create shop with onboarding incomplete and not deployed
      await ctx.db.insert("shops", {
        userId: userId,
        name: "",
        address: "",
        image: "",
        experience: 0,
        onboardingComplete: false,
        deployed: false,
        services: [],
        openingHours: [],
      });
    }

    return userId;
  },
});
