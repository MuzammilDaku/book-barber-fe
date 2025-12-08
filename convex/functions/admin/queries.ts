import { query } from "../../_generated/server";
import { v } from "convex/values";

// Get all users
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users;
  },
});

// Get all shops
export const getAllShops = query({
  args: {},
  handler: async (ctx) => {
    const shops = await ctx.db.query("shops").collect();
    
    // Enrich shops with user and subscription info
    const enrichedShops = await Promise.all(
      shops.map(async (shop) => {
        const user = await ctx.db.get(shop.userId);
        const subscription = await ctx.db
          .query("subscriptions")
          .withIndex("by_userId", (q) => q.eq("userId", shop.userId))
          .first();
        
        // Count bookings for this shop
        const allBookings = await ctx.db.query("bookings").collect();
        const bookings = allBookings.filter(b => b.shopId === shop._id);
        
        return {
          ...shop,
          user,
          subscription,
          totalBookings: bookings.length,
          completedBookings: bookings.filter(b => b.status === "completed").length,
        };
      })
    );
    
    return enrichedShops;
  },
});

// Get all bookings
export const getAllBookings = query({
  args: {},
  handler: async (ctx) => {
    const bookings = await ctx.db.query("bookings").collect();
    
    // Enrich bookings with customer and shop info
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const customer = await ctx.db.get(booking.customerId);
        const shop = await ctx.db.get(booking.shopId);
        return {
          ...booking,
          customer,
          shop,
        };
      })
    );
    
    return enrichedBookings;
  },
});

// Get admin dashboard stats
export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    // Get all data
    const users = await ctx.db.query("users").collect();
    const shops = await ctx.db.query("shops").collect();
    const bookings = await ctx.db.query("bookings").collect();
    const subscriptions = await ctx.db.query("subscriptions").collect();
    
    // Calculate stats
    const totalUsers = users.length;
    const totalCustomers = users.filter(u => u.userType === "customer").length;
    const totalBarbers = users.filter(u => u.userType === "barber").length;
    const totalAdmins = users.filter(u => u.userType === "admin").length;
    
    const totalShops = shops.length;
    const deployedShops = shops.filter(s => s.deployed).length;
    const activeShops = shops.filter(s => s.deployed && s.onboardingComplete).length;
    
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === "completed").length;
    const pendingBookings = bookings.filter(b => b.status === "pending").length;
    const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;
    const cancelledBookings = bookings.filter(b => b.status === "cancelled").length;
    
    // Calculate earnings
    // No commission - all revenue goes to barbers
    const completedBookingsList = bookings.filter(b => b.status === "completed");
    const totalRevenue = completedBookingsList.reduce((sum: number, booking) => sum + booking.totalPrice, 0);
    const platformEarnings = 0; // No commission
    const barberEarnings = totalRevenue; // All revenue goes to barbers
    
    // Active subscriptions
    const activeSubscriptions = subscriptions.filter(s => s.status === "active").length;
    const starterSubscriptions = subscriptions.filter(s => s.status === "active" && s.planType === "starter").length;
    const proSubscriptions = subscriptions.filter(s => s.status === "active" && s.planType === "pro").length;
    
    // Monthly subscription revenue (assuming $10 for starter, $25 for pro)
    const monthlySubscriptionRevenue = (starterSubscriptions * 10) + (proSubscriptions * 25);
    
    // Calculate bookings by status
    const bookingsByStatus = {
      pending: pendingBookings,
      confirmed: confirmedBookings,
      completed: completedBookings,
      cancelled: cancelledBookings,
    };
    
    // Recent bookings (last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentBookings = bookings.filter(
      b => new Date(b.appointmentDate).getTime() >= thirtyDaysAgo
    );
    
    // Recent earnings (last 30 days)
    const recentCompletedBookings = recentBookings.filter(b => b.status === "completed");
    const recentRevenue = recentCompletedBookings.reduce((sum: number, booking) => sum + booking.totalPrice, 0);
    const recentEarnings = 0; // No commission
    
    return {
      users: {
        total: totalUsers,
        customers: totalCustomers,
        barbers: totalBarbers,
        admins: totalAdmins,
      },
      shops: {
        total: totalShops,
        deployed: deployedShops,
        active: activeShops,
      },
      bookings: {
        total: totalBookings,
        byStatus: bookingsByStatus,
        recent: recentBookings.length,
      },
      subscriptions: {
        active: activeSubscriptions,
        starter: starterSubscriptions,
        pro: proSubscriptions,
        monthlyRevenue: monthlySubscriptionRevenue,
      },
      earnings: {
        totalRevenue,
        platformEarnings,
        barberEarnings,
        recentRevenue, // Recent revenue (last 30 days)
        commissionRate: 0, // No commission
      },
    };
  },
});

// Get bookings by date range
export const getBookingsByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const bookings = await ctx.db.query("bookings").collect();
    
    const filteredBookings = bookings.filter((booking) => {
      const bookingDate = booking.appointmentDate;
      return bookingDate >= args.startDate && bookingDate <= args.endDate;
    });
    
    // Enrich with customer and shop info
    const enrichedBookings = await Promise.all(
      filteredBookings.map(async (booking) => {
        const customer = await ctx.db.get(booking.customerId);
        const shop = await ctx.db.get(booking.shopId);
        return {
          ...booking,
          customer,
          shop,
        };
      })
    );
    
    return enrichedBookings;
  },
});

