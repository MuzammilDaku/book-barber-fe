import { query } from "../../_generated/server";
import { v } from "convex/values";

export const getAvailableTimeSlots = query({
  args: {
    shopId: v.id("shops"),
    date: v.string(), // ISO date string (YYYY-MM-DD)
    serviceDuration: v.optional(v.number()), // Total duration of selected services in minutes
  },
  handler: async (ctx, args) => {
    const shop = await ctx.db.get(args.shopId);
    if (!shop) {
      throw new Error("Shop not found");
    }

    // Get the day of week for the requested date
    // Parse date string (YYYY-MM-DD) in local timezone to avoid timezone issues
    const [year, month, day] = args.date.split('-').map(Number);
    const requestedDate = new Date(year, month - 1, day); // month is 0-indexed
    const dayOfWeek = requestedDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Find opening hours for this day
    const openingHours = shop.openingHours?.find((h) => h.dayOfWeek === dayOfWeek);

    if (!openingHours || openingHours.isClosed) {
      return { available: [], booked: [] }; // Shop is closed on this day
    }

    // Parse opening and closing times
    const [openHour, openMin] = openingHours.openingTime.split(":").map(Number);
    const [closeHour, closeMin] = openingHours.closingTime.split(":").map(Number);

    const openTime = openHour * 60 + openMin; // Total minutes from midnight
    const closeTime = closeHour * 60 + closeMin;

    // Validate opening hours
    if (openTime >= closeTime) {
      return { available: [], booked: [] }; // Invalid opening hours
    }

    // Use service duration if provided, otherwise default to 30 minutes
    const slotDuration = args.serviceDuration || 30;

    // Ensure slot duration is reasonable
    if (slotDuration <= 0 || slotDuration > (closeTime - openTime)) {
      return { available: [], booked: [] }; // Invalid slot duration
    }

    // Generate time slots based on service duration
    const slots: string[] = [];
    for (let minutes = openTime; minutes < closeTime; minutes += slotDuration) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const slotTime = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
      // Only add slot if it fits within opening hours
      if (minutes + slotDuration <= closeTime) {
        slots.push(slotTime);
      }
    }

    // Get existing bookings for this date (include pending, confirmed, and completed)
    const existingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_date", (q) => q.eq("appointmentDate", args.date))
      .filter((q) => q.eq(q.field("shopId"), args.shopId))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "confirmed"),
          q.eq(q.field("status"), "completed")
        )
      )
      .collect();

    // Calculate which slots are booked based on booking duration
    const bookedSlotsSet = new Set<string>();
    for (const booking of existingBookings) {
      const bookingStartTime = booking.appointmentTime;
      const [startHour, startMin] = bookingStartTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const bookingDuration = booking.totalDuration || 30; // Use booking duration or default to 30
      
      // Mark all slots that overlap with this booking
      for (let slotMinutes = openTime; slotMinutes < closeTime; slotMinutes += slotDuration) {
        const slotEnd = slotMinutes + slotDuration;
        const bookingEnd = startMinutes + bookingDuration;
        
        // Check if slot overlaps with booking
        if (slotMinutes < bookingEnd && slotEnd > startMinutes) {
          const hours = Math.floor(slotMinutes / 60);
          const mins = slotMinutes % 60;
          const slotTime = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
          bookedSlotsSet.add(slotTime);
        }
      }
    }

    // Separate available and booked slots
    const bookedSlots: string[] = [];
    const availableSlots: string[] = [];
    
    for (const slot of slots) {
      if (bookedSlotsSet.has(slot)) {
        bookedSlots.push(slot);
      } else {
        // Check if slot has enough time for the service
        const [slotHour, slotMin] = slot.split(":").map(Number);
        const slotStartMinutes = slotHour * 60 + slotMin;
        const slotEndMinutes = slotStartMinutes + slotDuration;
        
        // Only add if slot doesn't go past closing time
        if (slotEndMinutes <= closeTime) {
          availableSlots.push(slot);
        }
      }
    }

    return { available: availableSlots, booked: bookedSlots };
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

export const getMonthlyAppointmentCount = query({
  args: {
    shopId: v.id("shops"),
  },
  handler: async (ctx, args) => {
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

    return monthlyBookings.length;
  },
});
