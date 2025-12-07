import { query } from "../../_generated/server";
import { v } from "convex/values";

export const getAvailableTimeSlots = query({
  args: {
    shopId: v.id("shops"),
    date: v.string(), // ISO date string (YYYY-MM-DD)
  },
  handler: async (ctx, args) => {
    const shop = await ctx.db.get(args.shopId);
    if (!shop) {
      throw new Error("Shop not found");
    }

    // Get the day of week for the requested date
    const requestedDate = new Date(args.date);
    const dayOfWeek = requestedDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Find opening hours for this day
    const openingHours = shop.openingHours?.find((h) => h.dayOfWeek === dayOfWeek);

    if (!openingHours || openingHours.isClosed) {
      return []; // Shop is closed on this day
    }

    // Parse opening and closing times
    const [openHour, openMin] = openingHours.openingTime.split(":").map(Number);
    const [closeHour, closeMin] = openingHours.closingTime.split(":").map(Number);

    const openTime = openHour * 60 + openMin; // Total minutes from midnight
    const closeTime = closeHour * 60 + closeMin;

    // Generate 30-minute time slots
    const slots: string[] = [];
    for (let minutes = openTime; minutes < closeTime; minutes += 30) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      slots.push(`${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`);
    }

    // Get existing bookings for this date
    const existingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_date", (q) => q.eq("appointmentDate", args.date))
      .filter((q) => q.eq(q.field("shopId"), args.shopId))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "confirmed")
        )
      )
      .collect();

    // Get booked time slots
    const bookedSlots = new Set(
      existingBookings.map((booking) => booking.appointmentTime)
    );

    // Filter out booked slots
    const availableSlots = slots.filter((slot) => !bookedSlots.has(slot));

    // Filter out past times if it's today
    const now = new Date();
    const isToday = requestedDate.toDateString() === now.toDateString();
    if (isToday) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      return availableSlots.filter((slot) => {
        const [slotHour, slotMin] = slot.split(":").map(Number);
        const slotTimeInMinutes = slotHour * 60 + slotMin;
        // Only show slots that are at least 30 minutes in the future
        return slotTimeInMinutes >= currentTimeInMinutes + 30;
      });
    }

    return availableSlots;
  },
});

export const getBookingsByCustomer = query({
  args: {
    customerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_customerId", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .collect();

    // Filter out cancelled bookings
    const activeBookings = bookings.filter((booking) => booking.status !== "cancelled");

    // Enrich with shop details
    const enrichedBookings = await Promise.all(
      activeBookings.map(async (booking) => {
        const shop = await ctx.db.get(booking.shopId);
        return {
          ...booking,
          shop: shop
            ? {
                name: shop.name,
                address: shop.address,
                image: shop.image,
              }
            : null,
        };
      })
    );

    return enrichedBookings;
  },
});

export const getBookingsByShop = query({
  args: {
    shopId: v.id("shops"),
  },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_shopId", (q) => q.eq("shopId", args.shopId))
      .order("desc")
      .collect();

    // Filter out cancelled bookings
    const activeBookings = bookings.filter((booking) => booking.status !== "cancelled");

    // Enrich with customer details
    const enrichedBookings = await Promise.all(
      activeBookings.map(async (booking) => {
        const customer = await ctx.db.get(booking.customerId);
        return {
          ...booking,
          customer: customer
            ? {
                fullName: customer.fullName,
                email: customer.email,
                phone: customer.phone,
              }
            : null,
        };
      })
    );

    return enrichedBookings;
  },
});

