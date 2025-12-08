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

    // Check subscription limits for the barber
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", shop.userId))
      .first();

    if (subscription && subscription.status === "active") {
      // Check if booking date is within allowed range
      const appointmentDate = new Date(args.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const maxDays = subscription.planType === "starter" ? 7 : 30;
      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() + maxDays);
      
      if (appointmentDate > maxDate) {
        throw new Error(
          `Your ${subscription.planType} plan allows bookings up to ${maxDays} days in advance. Please upgrade to Pro for longer booking periods.`
        );
      }

      // Check monthly appointment limit
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const startDateStr = startOfMonth.toISOString().split('T')[0];
      const endDateStr = endOfMonth.toISOString().split('T')[0];

      // Get all bookings for this shop in the current month
      const allBookings = await ctx.db
        .query("bookings")
        .withIndex("by_shopId", (q) => q.eq("shopId", args.shopId))
        .collect();

      // Filter bookings in current month and exclude cancelled
      const monthlyBookings = allBookings.filter((booking) => {
        const bookingDate = booking.appointmentDate;
        return (
          bookingDate >= startDateStr &&
          bookingDate <= endDateStr &&
          booking.status !== "cancelled"
        );
      });

      const monthlyLimit = subscription.planType === "starter" ? 100 : 500;
      
      if (monthlyBookings.length >= monthlyLimit) {
        throw new Error(
          `You have reached your monthly appointment limit of ${monthlyLimit} appointments. ${subscription.planType === "starter" ? "Upgrade to Pro for 500 appointments per month." : "Please contact support for higher limits."}`
        );
      }
    } else {
      // No subscription - default to 7 days and 100 appointments
      const appointmentDate = new Date(args.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() + 7);
      
      if (appointmentDate > maxDate) {
        throw new Error(
          "Bookings are limited to 7 days in advance. Subscribe to a plan to extend this limit."
        );
      }

      // Check monthly appointment limit (default 100)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const startDateStr = startOfMonth.toISOString().split('T')[0];
      const endDateStr = endOfMonth.toISOString().split('T')[0];

      const allBookings = await ctx.db
        .query("bookings")
        .withIndex("by_shopId", (q) => q.eq("shopId", args.shopId))
        .collect();

      const monthlyBookings = allBookings.filter((booking) => {
        const bookingDate = booking.appointmentDate;
        return (
          bookingDate >= startDateStr &&
          bookingDate <= endDateStr &&
          booking.status !== "cancelled"
        );
      });

      if (monthlyBookings.length >= 100) {
        throw new Error(
          "You have reached the monthly appointment limit of 100. Subscribe to a plan for higher limits (Starter: 100/month, Pro: 500/month)."
        );
      }
    }

    // Calculate total price and duration
    const totalPrice = args.services.reduce((sum, service) => sum + service.price, 0);
    const totalDuration = args.services.reduce((sum, service) => sum + service.duration, 0);

    // Parse appointment time
    const [apptHour, apptMin] = args.appointmentTime.split(":").map(Number);
    const appointmentStartMinutes = apptHour * 60 + apptMin;
    const appointmentEndMinutes = appointmentStartMinutes + totalDuration;

    // Get shop opening hours to check boundaries (shop already fetched above)
    const requestedDate = new Date(args.appointmentDate);
    const dayOfWeek = requestedDate.getDay();
    const openingHours = shop.openingHours?.find((h) => h.dayOfWeek === dayOfWeek);
    
    if (!openingHours || openingHours.isClosed) {
      throw new Error("Shop is closed on this day");
    }

    const [openHour, openMin] = openingHours.openingTime.split(":").map(Number);
    const [closeHour, closeMin] = openingHours.closingTime.split(":").map(Number);
    const openTimeMinutes = openHour * 60 + openMin;
    const closeTimeMinutes = closeHour * 60 + closeMin;

    // Check if appointment fits within opening hours
    if (appointmentStartMinutes < openTimeMinutes || appointmentEndMinutes > closeTimeMinutes) {
      throw new Error("Appointment time is outside shop opening hours");
    }

    // Check for overlapping bookings (considering duration)
    const existingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_date", (q) => q.eq("appointmentDate", args.appointmentDate))
      .filter((q) => q.eq(q.field("shopId"), args.shopId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "confirmed")
        )
      )
      .collect();

    // Check for time overlaps
    for (const booking of existingBookings) {
      const [bookingHour, bookingMin] = booking.appointmentTime.split(":").map(Number);
      const bookingStartMinutes = bookingHour * 60 + bookingMin;
      const bookingEndMinutes = bookingStartMinutes + booking.totalDuration;

      // Check if appointments overlap
      if (appointmentStartMinutes < bookingEndMinutes && appointmentEndMinutes > bookingStartMinutes) {
        throw new Error("This time slot overlaps with an existing booking");
      }
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

export const updateBookingRating = mutation({
  args: {
    bookingId: v.id("bookings"),
    rating: v.number(), // Rating from 1 to 5
  },
  handler: async (ctx, args) => {
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.status !== "completed") {
      throw new Error("Only completed appointments can be rated");
    }

    await ctx.db.patch(args.bookingId, {
      rating: args.rating,
    });

    return args.bookingId;
  },
});

