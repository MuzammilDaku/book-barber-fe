import { query } from "../../_generated/server";
import { v } from "convex/values";

export const getShop = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const shop = await ctx.db
      .query("shops")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    return shop;
  },
});

export const getShopById = query({
  args: {
    shopId: v.id("shops"),
  },
  handler: async (ctx, args) => {
    const shop = await ctx.db.get(args.shopId);
    return shop;
  },
});

export const getServices = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const shop = await ctx.db
      .query("shops")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!shop) return [];
    
    // Return services with index for updates/deletes
    return (shop.services || []).map((service, index) => ({
      ...service,
      _index: index,
    }));
  },
});

export const getOpeningHours = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const shop = await ctx.db
      .query("shops")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!shop) return [];
    
    const hours = shop.openingHours || [];
    
    // Sort by day of week
    hours.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    
    return hours;
  },
});

export const getBarberProfile = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const shop = await ctx.db
      .query("shops")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    return {
      user,
      shop,
      services: shop?.services || [],
      hours: shop?.openingHours || [],
    };
  },
});

export const listBarbers = query({
  args: {
    searchQuery: v.optional(v.string()),
    location: v.optional(v.string()),
    service: v.optional(v.string()),
    rating: v.optional(v.number()),
    availability: v.optional(v.string()),
    sortBy: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const page = args.page || 1;
    const pageSize = args.pageSize || 12;
    const skip = (page - 1) * pageSize;

    // Get all shops
    let shops = await ctx.db.query("shops").collect();

    // Filter shops where user is a barber and onboarding is complete
    const barberShops = [];
    for (const shop of shops) {
      const user = await ctx.db.get(shop.userId);
      if (user && user.userType === "barber" && shop.onboardingComplete) {
        // Calculate average rating from completed bookings
        const completedBookings = await ctx.db
          .query("bookings")
          .withIndex("by_shopId", (q) => q.eq("shopId", shop._id))
          .filter((q) => q.eq(q.field("status"), "completed"))
          .collect();

        const ratings = completedBookings
          .map((b) => b.rating)
          .filter((r): r is number => r !== undefined && r !== null);

        const averageRating = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
          : 0;

        const totalRatings = ratings.length;

        barberShops.push({
          ...shop,
          user: {
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
          },
          averageRating,
          totalRatings,
        });
      }
    }

    // Apply filters
    let filtered = barberShops;

    // Search by name or location
    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (shop) =>
          shop.name.toLowerCase().includes(query) ||
          shop.address.toLowerCase().includes(query) ||
          shop.services.some((s) => s.name.toLowerCase().includes(query))
      );
    }

    // Filter by location
    if (args.location) {
      const locationLower = args.location.toLowerCase();
      filtered = filtered.filter((shop) =>
        shop.address.toLowerCase().includes(locationLower)
      );
    }

    // Filter by service
    if (args.service) {
      const serviceLower = args.service.toLowerCase();
      filtered = filtered.filter((shop) =>
        shop.services.some(
          (s) =>
            s.isActive &&
            s.name.toLowerCase().includes(serviceLower)
        )
      );
    }

    // Filter by rating
    if (args.rating) {
      filtered = filtered.filter((shop) => shop.averageRating >= args.rating!);
    }

    // Filter by availability
    if (args.availability) {
      const now = new Date();
      const today = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      filtered = filtered.filter((shop) => {
        const hours = shop.openingHours || [];
        
        if (args.availability === "today") {
          // Check if shop is open today
          const todayHours = hours.find((h) => h.dayOfWeek === today);
          return todayHours && !todayHours.isClosed;
        } else if (args.availability === "tomorrow") {
          // Check if shop is open tomorrow
          const tomorrow = (today + 1) % 7;
          const tomorrowHours = hours.find((h) => h.dayOfWeek === tomorrow);
          return tomorrowHours && !tomorrowHours.isClosed;
        } else if (args.availability === "weekend") {
          // Check if shop is open on weekends (Saturday or Sunday)
          const saturdayHours = hours.find((h) => h.dayOfWeek === 6);
          const sundayHours = hours.find((h) => h.dayOfWeek === 0);
          return (saturdayHours && !saturdayHours.isClosed) || (sundayHours && !sundayHours.isClosed);
        }
        
        return true;
      });
    }

    // Apply sorting
    let sorted = [...filtered];
    switch (args.sortBy) {
      case "rating":
        // Sort by average rating (descending), then by total ratings
        sorted.sort((a, b) => {
          if (b.averageRating !== a.averageRating) {
            return b.averageRating - a.averageRating;
          }
          return b.totalRatings - a.totalRatings;
        });
        break;
      case "price-low":
        sorted.sort((a, b) => {
          const activeServicesA = a.services.filter(s => s.isActive);
          const activeServicesB = b.services.filter(s => s.isActive);
          const minPriceA = activeServicesA.length > 0 
            ? Math.min(...activeServicesA.map(s => s.price))
            : Infinity;
          const minPriceB = activeServicesB.length > 0
            ? Math.min(...activeServicesB.map(s => s.price))
            : Infinity;
          return minPriceA - minPriceB;
        });
        break;
      case "price-high":
        sorted.sort((a, b) => {
          const activeServicesA = a.services.filter(s => s.isActive);
          const activeServicesB = b.services.filter(s => s.isActive);
          const minPriceA = activeServicesA.length > 0
            ? Math.min(...activeServicesA.map(s => s.price))
            : 0;
          const minPriceB = activeServicesB.length > 0
            ? Math.min(...activeServicesB.map(s => s.price))
            : 0;
          return minPriceB - minPriceA;
        });
        break;
      case "distance":
        // For now, keep original order (can be enhanced with location data)
        break;
      default:
        // Default: sort by average rating
        sorted.sort((a, b) => {
          if (b.averageRating !== a.averageRating) {
            return b.averageRating - a.averageRating;
          }
          return b.totalRatings - a.totalRatings;
        });
    }

    // Apply pagination
    const total = sorted.length;
    const paginated = sorted.slice(skip, skip + pageSize);

    return {
      barbers: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },
});
