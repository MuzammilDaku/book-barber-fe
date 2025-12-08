import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        const userId = session.metadata?.userId;
        const planType = session.metadata?.planType as "starter" | "pro";

        if (!userId || !planType) {
          console.error("Missing metadata in checkout session");
          break;
        }

        await convex.mutation(api.functions.subscriptions.mutations.createSubscription, {
          userId: userId as any,
          planType,
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0]?.price.id,
          status: subscription.status === "active" ? "active" : "incomplete",
          currentPeriodStart: (subscription as any).current_period_start || Math.floor(Date.now() / 1000),
          currentPeriodEnd: (subscription as any).current_period_end || Math.floor(Date.now() / 1000) + 2592000,
          cancelAtPeriodEnd: (subscription as any).cancel_at_period_end || false,
        });

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find subscription by Stripe customer ID
        const existingSub = await convex.query(
          api.functions.subscriptions.queries.getSubscriptionByStripeCustomer,
          { stripeCustomerId: customerId }
        );

        if (existingSub) {
          await convex.mutation(api.functions.subscriptions.mutations.updateSubscriptionStatus, {
            subscriptionId: existingSub._id,
            status:
              subscription.status === "active"
                ? "active"
                : subscription.status === "canceled"
                ? "canceled"
                : subscription.status === "past_due"
                ? "past_due"
                : "incomplete",
            currentPeriodStart: (subscription as any).current_period_start,
            currentPeriodEnd: (subscription as any).current_period_end,
            cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
          });
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const existingSub = await convex.query(
          api.functions.subscriptions.queries.getSubscriptionByStripeCustomer,
          { stripeCustomerId: customerId }
        );

        if (existingSub) {
          await convex.mutation(api.functions.subscriptions.mutations.updateSubscriptionStatus, {
            subscriptionId: existingSub._id,
            status: "canceled",
          });
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}