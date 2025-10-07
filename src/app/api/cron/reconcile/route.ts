import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Daily reconciliation job for M-Pesa payments
 * 
 * This endpoint should be called daily (e.g., via Vercel Cron) to:
 * 1. Find orders with pending payments that are overdue
 * 2. Mark them as failed if payment window has expired
 * 3. Log reconciliation discrepancies for manual review
 * 
 * For production, add proper authentication and rate limiting.
 */
export async function POST(request: Request) {
  try {
    // Simple authentication check (use proper auth in production)
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET || 'dev-cron-secret'}`;
    
    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reconciliationResults = {
      processedOrders: 0,
      expiredPayments: 0,
      discrepancies: 0,
      errors: 0,
    };

    // Find orders with pending payments that are overdue (more than 30 minutes old)
    const overduePayments = await prisma.order.findMany({
      where: {
        paymentStatus: 'PENDING',
        paymentDueAt: {
          lt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        },
        orderStatus: {
          not: 'CANCELLED',
        },
      },
    });

    console.log(`Found ${overduePayments.length} overdue payments`);

    for (const order of overduePayments) {
      try {
        // Mark payment as failed and order as cancelled
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'FAILED',
            orderStatus: 'CANCELLED',
            cancellationReason: 'Payment timeout - no response from M-Pesa within 30 minutes',
            reconciliationStatus: 'COMPLETED',
          },
        });

        // Create status log
        await prisma.statusLog.create({
          data: {
            orderId: order.id,
            status: 'CANCELLED',
            actor: 'SYSTEM',
            channel: 'WEB',
            note: 'Auto-cancelled: Payment timeout (30 minutes expired)',
          },
        });

        reconciliationResults.expiredPayments++;
        reconciliationResults.processedOrders++;
      } catch (error) {
        console.error(`Error processing overdue order ${order.id}:`, error);
        reconciliationResults.errors++;
      }
    }

    // Find orders that might have payment discrepancies
    // (orders marked as paid but with unusual amounts or missing receipts)
    const potentialDiscrepancies = await prisma.order.findMany({
      where: {
        paymentStatus: 'PAID',
        reconciliationStatus: 'NOT_REQUIRED',
        OR: [
          { mpesaReceipt: null },
          { 
            AND: [
              { amountCollected: { not: null } },
              { totalEstimate: { not: null } },
            ]
          },
        ],
      },
    });

    console.log(`Found ${potentialDiscrepancies.length} potential discrepancies`);

    for (const order of potentialDiscrepancies) {
      try {
        const amountCollected = order.amountCollected?.toNumber() || 0;
        const totalEstimate = order.totalEstimate?.toNumber() || 0;
        const difference = Math.abs(amountCollected - totalEstimate);

        let reconciliationStatus: 'COMPLETED' | 'DISCREPANCY' = 'COMPLETED';
        let note = 'Auto-reconciled: No significant discrepancies found';

        if (!order.mpesaReceipt) {
          reconciliationStatus = 'DISCREPANCY';
          note = 'Missing M-Pesa receipt number';
          reconciliationResults.discrepancies++;
        } else if (difference > 10) { // More than 10 KES difference
          reconciliationStatus = 'DISCREPANCY';
          note = `Amount discrepancy: Collected ${amountCollected} vs Expected ${totalEstimate}`;
          reconciliationResults.discrepancies++;
        }

        await prisma.order.update({
          where: { id: order.id },
          data: {
            reconciliationStatus,
          },
        });

        // Log discrepancies for manual review
        if (reconciliationStatus === 'DISCREPANCY') {
          await prisma.statusLog.create({
            data: {
              orderId: order.id,
              status: order.orderStatus,
              actor: 'SYSTEM',
              channel: 'WEB',
              note: `Reconciliation: ${note}`,
            },
          });
        }

        reconciliationResults.processedOrders++;
      } catch (error) {
        console.error(`Error reconciling order ${order.id}:`, error);
        reconciliationResults.errors++;
      }
    }

    // Log reconciliation summary
    console.log('Daily reconciliation completed:', reconciliationResults);

    return NextResponse.json({
      success: true,
      message: 'Daily reconciliation completed',
      results: reconciliationResults,
    });
  } catch (error) {
    console.error('Reconciliation job failed:', error);
    return NextResponse.json(
      { success: false, error: 'Reconciliation job failed' },
      { status: 500 }
    );
  }
}

// Handle GET requests for status checks
export async function GET() {
  return NextResponse.json({
    message: 'M-Pesa reconciliation cron job endpoint',
    usage: 'POST with proper authorization to run reconciliation',
  });
}