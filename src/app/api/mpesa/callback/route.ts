import { NextResponse } from "next/server";
import { processCallback, type MpesaCallback } from "@/lib/mpesa";

export async function POST(request: Request) {
  try {
    const body: MpesaCallback = await request.json();
    
    // Log the callback for debugging (remove in production)
    console.log("M-Pesa callback received:", JSON.stringify(body, null, 2));

    // Validate callback structure
    if (!body.Body?.stkCallback) {
      console.error("Invalid callback structure:", body);
      return NextResponse.json(
        { ok: false, error: "Invalid callback structure" },
        { status: 400 }
      );
    }

    const { stkCallback } = body.Body;
    
    // Validate required fields
    if (!stkCallback.MerchantRequestID || !stkCallback.CheckoutRequestID) {
      console.error("Missing required fields in callback:", stkCallback);
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Process the callback (idempotent operation)
    const result = await processCallback(body);

    if (result.success) {
      // Return success response to M-Pesa
      return NextResponse.json({ ok: true, message: result.message });
    } else {
      console.error("Failed to process callback:", result.message);
      return NextResponse.json(
        { ok: false, error: result.message },
        { status: 500 }
      );
    }
  } catch (e: unknown) {
    const error = e as Error;
    console.error("M-Pesa callback error:", error);
    
    // Always return 200 to M-Pesa to prevent retries for non-recoverable errors
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 200 }
    );
  }
}
