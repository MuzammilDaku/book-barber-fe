import { v } from "convex/values";
import { query } from "../../_generated/server";

export const getUser = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.query("users").filter((q) => q.eq(q.field("email"), args.email)).first();
  },
});