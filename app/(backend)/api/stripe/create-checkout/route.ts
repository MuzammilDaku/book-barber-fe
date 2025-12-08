import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
});

// Helper function to get price ID from Stripe
async function getPriceId(planType: "starter" | "pro"): Promise<string> {
  try {
    // Fetch all active prices
    const prices = await stripe.prices.list({
      active: true,
      type: "recurring",
      expand: ["data.product"],
    });

    // Find price by plan type
    const price = prices.data.find(
      (p) =>
        (p.product as Stripe.Product).metadata?.planType === planType ||
        (p.product as Stripe.Product).name?.toLowerCase().includes(planType)
    );

    if (price) {
      return price.id;
    }

    // Fallback to environment variables
    if (planType === "starter") {
      return process.env.STRIPE_STARTER_PRICE_ID || "price_starter_test";
    } else {
      return process.env.STRIPE_PRO_PRICE_ID || "price_pro_test";
    }
  } catch (error) {
    console.error("Error fetching price ID:", error);
    // Fallback to environment variables
    if (planType === "starter") {
      return process.env.STRIPE_STARTER_PRICE_ID || "price_starter_test";
    } else {
      return process.env.STRIPE_PRO_PRICE_ID || "price_pro_test";
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planType, userId, email } = body;

    if (!planType || !userId || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (planType !== "starter" && planType !== "pro") {
      return NextResponse.json(
        { error: "Invalid plan type" },
        { status: 400 }
      );
    }

    // Get price ID from Stripe
    const priceId = await getPriceId(planType);

    // Create or retrieve Stripe customer
    let customer: Stripe.Customer;
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: email,
        metadata: {
          userId: userId,
        },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/barber/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/pricing?canceled=true`,
      metadata: {
        userId: userId,
        planType: planType,
      },
      subscription_data: {
        metadata: {
          userId: userId,
          planType: planType,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

