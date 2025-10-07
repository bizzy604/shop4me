/**
 * User persistence helper for syncing Stack Auth users with Prisma database.
 * 
 * This module handles user synchronization between Stack Auth and our Prisma database,
 * including role management and admin access control.
 */

import { stackServerApp } from './stack';
import prisma from './prisma';

/**
 * Ensures a Stack Auth user exists in the Prisma users table.
 * Creates a new user record if it doesn't exist.
 * 
 * @param stackUserId - The Stack Auth user ID
 * @returns The Prisma user record
 */
export async function ensureUserInDatabase(stackUserId: string) {
  // Get current user from Stack Auth
  const stackUser = await stackServerApp.getUser();
  
  if (!stackUser || stackUser.id !== stackUserId) {
    throw new Error('Stack user not found or ID mismatch');
  }

  // Extract phone number from contact channels
  const contactChannels = await stackUser.useContactChannels();
  const phoneChannel = contactChannels?.find((c: any) => c.type === 'phone');
  const phone = phoneChannel?.value || null;
  const phoneVerified = phoneChannel?.verified || false;

  const user = await prisma.user.upsert({
    where: { providerId: stackUserId },
    update: {
      email: stackUser.primaryEmail,
      phone: phone,
      name: stackUser.displayName,
      phoneVerified: phoneVerified,
    },
    create: {
      providerId: stackUserId,
      email: stackUser.primaryEmail,
      phone: phone,
      name: stackUser.displayName,
      phoneVerified: phoneVerified,
      role: 'CUSTOMER', // Default role
    },
  });

  return user;
}

/**
 * Gets a user from the database by their Stack Auth ID.
 * 
 * @param stackUserId - The Stack Auth user ID
 * @returns The Prisma user record or null if not found
 */
export async function getUserFromDatabase(stackUserId: string) {
  const user = await prisma.user.findUnique({
    where: { providerId: stackUserId },
  });
  return user;
}

/**
 * Checks if a user has admin privileges.
 * 
 * @param stackUserId - The Stack Auth user ID
 * @returns True if user is an admin
 */
export async function isUserAdmin(stackUserId: string): Promise<boolean> {
  const user = await getUserFromDatabase(stackUserId);
  return user?.role === 'ADMIN';
}

/**
 * Gets the current user from Stack Auth and ensures they exist in database.
 * 
 * @returns The current user or null if not authenticated
 */
export async function getCurrentUser() {
  const stackUser = await stackServerApp.getUser();
  
  if (!stackUser) {
    return null;
  }

  const user = await ensureUserInDatabase(stackUser.id);
  return user;
}

/**
 * Checks if the current user is an admin.
 * 
 * @returns True if current user is an admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const stackUser = await stackServerApp.getUser();
  
  if (!stackUser) {
    return false;
  }

  return await isUserAdmin(stackUser.id);
}
