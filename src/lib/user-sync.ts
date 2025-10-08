/**
 * User Synchronization Utilities
 * 
 * This module handles synchronizing users from Stack Auth to the Prisma database.
 * It ensures that authenticated users always have a corresponding record in our database
 * for order tracking, customer management, and business operations.
 * 
 * Key Functions:
 * - syncUserToDatabase: Creates or updates a user in the database from Stack Auth data
 * 
 * Dependencies:
 * - Stack Auth for authentication
 * - Prisma for database operations
 * 
 * Used by:
 * - Middleware (automatic sync on protected routes)
 * - Checkout flow (ensure user exists before creating orders)
 */

import "server-only";
import prisma from "@/lib/prisma";
import type { StackServerApp } from "@stackframe/stack";

export type SyncUserResult =
  | { success: true; userId: string }
  | { success: false; error: string };

/**
 * Syncs a Stack Auth user to the Prisma database
 * 
 * This function ensures that a user from Stack Auth has a corresponding record
 * in our database. It creates the user if they don't exist, or updates their
 * information if they do.
 * 
 * @param stackUser - The user object from Stack Auth
 * @returns The database user ID on success, or an error message on failure
 * 
 * Why this is important:
 * - Orders need to be linked to users via foreign key constraints
 * - We need user data for customer management and analytics
 * - Ensures data consistency between auth provider and our database
 */
export async function syncUserToDatabase(
  stackUser: Awaited<ReturnType<StackServerApp["getUser"]>>
): Promise<SyncUserResult> {
  if (!stackUser) {
    return { success: false, error: "No user provided" };
  }

  try {
    // Extract user data from Stack Auth
    const providerId = stackUser.id;
    const email = stackUser.primaryEmail || undefined;
    const name = stackUser.displayName || stackUser.primaryEmail?.split("@")[0] || undefined;
    
    // Extract phone from Stack user data if available
    // Stack Auth may store phone in different fields depending on configuration
    // We use type assertion with Record to safely access potential phone fields
    const userWithPhone = stackUser as Record<string, unknown>;
    const phone = (typeof userWithPhone.phoneNumber === 'string' ? userWithPhone.phoneNumber : undefined) || 
                  (typeof userWithPhone.primaryPhoneNumber === 'string' ? userWithPhone.primaryPhoneNumber : undefined);

    // Ensure at least phone or email is present
    if (!phone && !email) {
      return {
        success: false,
        error: "User must have either a phone number or email address",
      };
    }

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { providerId },
      update: {
        name: name || undefined,
        email: email || undefined,
        phone: phone || undefined,
        updatedAt: new Date(),
      },
      create: {
        providerId,
        name: name || "Customer",
        email: email || undefined,
        phone: phone || `temp_${providerId}`, // Temporary phone if not provided
        role: "CUSTOMER",
        phoneVerified: false, // Can be updated later via profile
      },
    });

    console.log(`User synced to database: ${user.id} (Stack ID: ${providerId})`);
    return { success: true, userId: user.id };
  } catch (error) {
    console.error("Failed to sync user to database:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during user sync",
    };
  }
}

/**
 * Gets or creates a user in the database from Stack Auth
 * 
 * This is a convenience function that retrieves an existing user or creates
 * a new one if they don't exist in the database.
 * 
 * @param providerId - The Stack Auth user ID
 * @param stackUser - The user object from Stack Auth (optional, used for creation)
 * @returns The database user ID or null if not found/created
 */
export async function getOrCreateUser(
  providerId: string,
  stackUser?: Awaited<ReturnType<StackServerApp["getUser"]>>
): Promise<string | null> {
  try {
    // Try to find existing user
    const existingUser = await prisma.user.findUnique({
      where: { providerId },
      select: { id: true },
    });

    if (existingUser) {
      return existingUser.id;
    }

    // If user doesn't exist and we have Stack user data, sync them
    if (stackUser) {
      const syncResult = await syncUserToDatabase(stackUser);
      return syncResult.success ? syncResult.userId : null;
    }

    return null;
  } catch (error) {
    console.error("Failed to get or create user:", error);
    return null;
  }
}
