import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function GET() {
  try {
    // Fetch all active prices
    const prices = await stripe.prices.list({
      active: true,
      type: "recurring",
      expand: ["data.product"],
    });

    // Find Starter and Pro prices
    // We'll look for products with metadata or names that match our plans
    const starterPrice = prices.data.find(
      (price) =>
        (price.product as Stripe.Product).metadata?.planType === "starter" ||
        (price.product as Stripe.Product).name?.toLowerCase().includes("starter")
    );

    const proPrice = prices.data.find(
      (price) =>
        (price.product as Stripe.Product).metadata?.planType === "pro" ||
        (price.product as Stripe.Product).name?.toLowerCase().includes("pro")
    );

    // If not found by metadata, try environment variables as fallback
    const starterPriceId = process.env.STRIPE_STARTER_PRICE_ID;
    const proPriceId = process.env.STRIPE_PRO_PRICE_ID;

    let starter: any = null;
    let pro: any = null;

    if (starterPrice) {
      starter = {
        priceId: starterPrice.id,
        amount: starterPrice.unit_amount ? starterPrice.unit_amount / 100 : 10,
        currency: starterPrice.currency,
        interval: starterPrice.recurring?.interval || "month",
      };
    } else if (starterPriceId) {
      // Fallback: fetch by price ID from env
      try {
        const price = await stripe.prices.retrieve(starterPriceId);
        starter = {
          priceId: price.id,
          amount: price.unit_amount ? price.unit_amount / 100 : 10,
          currency: price.currency,
          interval: price.recurring?.interval || "month",
        };
      } catch (error) {
        console.error("Error fetching starter price:", error);
      }
    }

    if (proPrice) {
      pro = {
        priceId: proPrice.id,
        amount: proPrice.unit_amount ? proPrice.unit_amount / 100 : 25,
        currency: proPrice.currency,
        interval: proPrice.recurring?.interval || "month",
      };
    } else if (proPriceId) {
      // Fallback: fetch by price ID from env
      try {
        const price = await stripe.prices.retrieve(proPriceId);
        pro = {
          priceId: price.id,
          amount: price.unit_amount ? price.unit_amount / 100 : 25,
          currency: price.currency,
          interval: price.recurring?.interval || "month",
        };
      } catch (error) {
        console.error("Error fetching pro price:", error);
      }
    }

    // Default fallback values if nothing found
    if (!starter) {
      starter = {
        priceId: starterPriceId || "price_starter_test",
        amount: 10,
        currency: "usd",
        interval: "month",
      };
    }

    if (!pro) {
      pro = {
        priceId: proPriceId || "price_pro_test",
        amount: 25,
        currency: "usd",
        interval: "month",
      };
    }

    return NextResponse.json({
      starter,
      pro,
    });
  } catch (error: any) {
    console.error("Error fetching Stripe prices:", error);
    // Return fallback values on error
    return NextResponse.json({
      starter: {
        priceId: process.env.STRIPE_STARTER_PRICE_ID || "price_starter_test",
        amount: 10,
        currency: "usd",
        interval: "month",
      },
      pro: {
        priceId: process.env.STRIPE_PRO_PRICE_ID || "price_pro_test",
        amount: 25,
        currency: "usd",
        interval: "month",
      },
    });
  }
}

