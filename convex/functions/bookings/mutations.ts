import { mutation } from "../../_generated/server";
import { v } from "convex/values";

export const createBooking = mutation({
  args: {
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
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify customer exists and is a customer type
    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }
    if (customer.userType !== "customer") {
      throw new Error("Only customers can create bookings");
    }

    // Verify shop exists
    const shop = await ctx.db.get(args.shopId);
    if (!shop) {
      throw new Error("Shop not found");
    }

    // Calculate total price and duration
    const totalPrice = args.services.reduce((sum, service) => sum + service.price, 0);
    const totalDuration = args.services.reduce((sum, service) => sum + service.duration, 0);

    // Check if time slot is available
    const existingBooking = await ctx.db
      .query("bookings")
      .withIndex("by_date", (q) => q.eq("appointmentDate", args.appointmentDate))
      .filter((q) => q.eq(q.field("shopId"), args.shopId))
      .filter((q) => q.eq(q.field("appointmentTime"), args.appointmentTime))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "confirmed")
        )
      )
      .first();

    if (existingBooking) {
      throw new Error("This time slot is already booked");
    }

    // Create booking
    const bookingId = await ctx.db.insert("bookings", {
      customerId: args.customerId,
      shopId: args.shopId,
      services: args.services,
      appointmentDate: args.appointmentDate,
      appointmentTime: args.appointmentTime,
      status: "pending",
      totalPrice,
      totalDuration,
      notes: args.notes,
    });

    return bookingId;
  },
});

export const updateBookingStatus = mutation({
  args: {
    bookingId: v.id("bookings"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    // If cancelling, delete the booking instead of updating status
    if (args.status === "cancelled") {
      await ctx.db.delete(args.bookingId);
      return args.bookingId;
    }

    await ctx.db.patch(args.bookingId, {
      status: args.status,
    });

    return args.bookingId;
  },
});

export const deleteBooking = mutation({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    await ctx.db.delete(args.bookingId);
    return args.bookingId;
  },
});

