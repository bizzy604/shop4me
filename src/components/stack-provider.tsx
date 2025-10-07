"use client";

import { StackClientApp, StackProvider } from "@stackframe/stack";
import { ReactNode, useMemo } from "react";

import { STACK_AUTH_REQUIRED_ENV_VARS, STACK_URLS } from "@/lib/stack-config";

export default function StackAuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
  const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;
  const isStackConfigured = Boolean(projectId && publishableClientKey);

  const stackApp = useMemo(() => {
    if (!isStackConfigured || !projectId || !publishableClientKey) {
      return null;
    }

    return new StackClientApp({
      projectId,
      publishableClientKey,
      tokenStore: "nextjs-cookie",
      urls: STACK_URLS,
      redirectMethod: "nextjs",
    });
  }, [isStackConfigured, projectId, publishableClientKey]);

  if (!stackApp) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `Stack Auth not configured. Authentication and registration features are disabled until ${STACK_AUTH_REQUIRED_ENV_VARS.join(", ")} are set.`
      );
    }

    return <>{children}</>;
  }

  return <StackProvider app={stackApp}>{children}</StackProvider>;
}
