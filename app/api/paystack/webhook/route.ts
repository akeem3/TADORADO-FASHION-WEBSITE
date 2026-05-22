import { NextRequest, NextResponse, after } from "next/server";
import crypto from "crypto";
import { PAYSTACK_CONFIG, parseAmount } from "@/lib/paystack";
import { createAdminOrderNotificationEmail, sendEmail } from "@/lib/email";

// Paystack webhook payload types
interface PaystackWebhookPayload {
  event: string;
  data: {
    id?: number;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    customer?: {
      email?: string;
      first_name?: string;
      phone?: string;
    };
    metadata?: {
      custom_fields?: Array<{
        variable_name?: string;
        value?: string;
      }>;
    };
  };
}

// Verify Paystack webhook signature using secret key
function isValidSignature(rawBody: string, signature: string | null): boolean {
  try {
    if (!signature) return false;
    const secret = PAYSTACK_CONFIG.secretKey;
    if (!secret) return false;
    const hash = crypto
      .createHmac("sha512", secret)
      .update(rawBody, "utf8")
      .digest("hex");
    return hash === signature;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Read raw body to compute signature
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    // Validate signature
    if (!isValidSignature(rawBody, signature)) {
      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody) as PaystackWebhookPayload;

    // Only handle successful charge events
    if (payload.event !== "charge.success") {
      return NextResponse.json({ success: true, message: "Event ignored" });
    }

    const tx = payload.data;
    if (!tx || tx.status !== "success") {
      return NextResponse.json(
        { success: false, message: "Transaction not successful" },
        { status: 400 }
      );
    }

    const reference: string = tx.reference;
    const amount: number = parseAmount(tx.amount, tx.currency);
    const customerEmail: string = tx.customer?.email || "";

    // Extract metadata custom fields we set during initialization
    const metaFields: Record<string, string> = {};
    const customFields = tx.metadata?.custom_fields ?? [];
    for (const field of customFields) {
      if (field?.variable_name && typeof field.value === "string") {
        metaFields[field.variable_name] = field.value;
      }
    }

    const customerName =
      metaFields["customer_name"] || tx.customer?.first_name || "";
    const customerPhone =
      metaFields["customer_phone"] || tx.customer?.phone || "";
    const orderItemsStr = metaFields["order_items"] || ""; // e.g., "Item A (2x), Item B (1x)"
    const measurementsStr = metaFields["measurements"] || "";
    const deliveryAddressStr = metaFields["delivery_address"] || ""; // address, city, state, country

    // Try to reconstruct delivery struct from deliveryAddressStr
    const parts = deliveryAddressStr.split(",").map((p) => p.trim());
    const [address, city, state, country] = [
      parts[0] || "",
      parts[1] || "",
      parts[2] || "",
      parts[3] || "",
    ];

    after(async () => {
      try {
        // Send admin email immediately (server-side guarantee)
        const adminEmail = createAdminOrderNotificationEmail({
          customerName: customerName,
          customerEmail: customerEmail,
          customerPhone: customerPhone,
          orderReference: reference,
          totalAmount: amount,
          orderItems: orderItemsStr,
          measurements: measurementsStr,
          deliveryAddress:
            deliveryAddressStr ||
            [address, city, state, country].filter(Boolean).join(", "),
          paymentStatus: "success",
        });

        // Fire-and-forget email (do not fail webhook if email fails)
        try {
          await sendEmail(adminEmail);
        } catch (emailError) {
          console.error("Webhook background: email sending error:", emailError);
        }

        // Prepare minimal cartItems from orderItemsStr for Google Sheets export
        const cartItems = orderItemsStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((entry, idx) => {
            // Parse "Name (Nx)" pattern
            const match = entry.match(/^(.*)\s*\((\d+)x\)$/i);
            const name = match ? match[1].trim() : entry;
            const quantity = match ? parseInt(match[2], 10) : 1;
            return {
              id: idx + 1,
              name,
              category: "",
              subCategory: "",
              price: 0,
              quantity,
              image: "",
            };
          });

        // Export order to Google Sheets using existing orders API
        const host = request.headers.get("host");
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        const baseUrl = host
          ? `${protocol}://${host}`
          : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        
        try {
          const ordersRes = await fetch(`${baseUrl}/api/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerInfo: {
                fullName: customerName,
                email: customerEmail,
                phone: customerPhone,
                address,
                city,
                state,
                country,
                postalCode: "",
                deliverySpeed: "standard",
              },
              measurements: [], // measurements already included in notes and admin email
              paymentInfo: {
                method: "paystack",
                status: "success",
                reference,
                transactionId: String(tx.id || ""),
              },
              cartItems,
              totalAmount: amount,
              shippingCost: 0,
              taxAmount: 0,
              notes: measurementsStr || "",
              paymentReference: reference,
            }),
          });

          if (!ordersRes.ok) {
            console.error("Webhook background: failed to export order to Google Sheets");
          }
        } catch (sheetsError) {
          console.error("Webhook background: sheets export error:", sheetsError);
        }
      } catch (backgroundError) {
        console.error("Webhook background error:", backgroundError);
      }
    });

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
