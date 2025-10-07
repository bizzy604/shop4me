import "server-only";
import { StackServerApp } from "@stackframe/stack";

import { STACK_URLS } from "@/lib/stack-config";

const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;
const secretServerKey = process.env.STACK_SECRET_SERVER_KEY;

export const isStackServerConfigured = Boolean(
  projectId && publishableClientKey && secretServerKey
);

// Initialize Stack Auth with environment variables when available. The Stack SDK
// gracefully falls back to its own env readers, but we pass the values explicitly to
// surface configuration issues earlier in development and tests.
export const stackServerApp = new StackServerApp({
  ...(projectId ? { projectId } : {}),
  ...(publishableClientKey ? { publishableClientKey } : {}),
  ...(secretServerKey ? { secretServerKey } : {}),
  tokenStore: "nextjs-cookie",
  urls: STACK_URLS,
});
