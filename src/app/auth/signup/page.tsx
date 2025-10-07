'use client';

import { SignUp } from '@stackframe/stack';
import { Card } from '@/components/ui/card';
import { STACK_AUTH_REQUIRED_ENV_VARS } from '@/lib/stack-config';
import Link from 'next/link';
import { Suspense } from 'react';

const stackProjectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
const stackPublishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;
const isStackConfigured = Boolean(stackProjectId && stackPublishableClientKey);

/**
 * Mirrors the sign-in route but renders Stack's registration experience. Falls back to
 * a configuration help message when Stack credentials are missing so builds continue to
 * succeed in lower environments.
 */
function SignUpContent() {
  if (!isStackConfigured) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-muted-foreground">
          Registration is currently unavailable. Contact the Shop4Me team once Stack
          credentials are configured to enable onboarding.
        </p>
        <p className="text-xs text-muted-foreground">
          Required env vars:{' '}
          {STACK_AUTH_REQUIRED_ENV_VARS.map((variable, index) => (
            <span key={variable}>
              <code>{variable}</code>
              {index < STACK_AUTH_REQUIRED_ENV_VARS.length - 1 ? ', ' : ''}
            </span>
          ))}
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SignUp />
      <p className="text-sm text-muted-foreground text-center">
        Already registered?{' '}
        <Link href="/auth/signin" className="text-primary hover:underline">
          Sign in instead
        </Link>
      </p>
    </div>
  );
}

/**
 * Public-facing account creation page that matches the sign-in page styling and pins the
 * form inside a centered card. Depends on `StackAuthProvider` higher in the tree for
 * context.
 */
export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Join Shop4Me</h1>
          <p className="text-muted-foreground mt-2">
            Create an account to start shopping and track your orders
          </p>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <SignUpContent />
        </Suspense>
      </Card>
    </div>
  );
}
