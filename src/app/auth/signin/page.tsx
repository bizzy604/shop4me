'use client';

import { SignIn, useUser } from '@stackframe/stack';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { STACK_AUTH_REQUIRED_ENV_VARS } from '@/lib/stack-config';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';

const stackProjectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
const stackPublishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;
const isStackConfigured = Boolean(stackProjectId && stackPublishableClientKey);

/**
 * Ensures the Stack-hosted `<SignIn />` experience only renders when the
 * upstream `StackAuthProvider` is configured with valid credentials. This
 * prevents the `useStackApp` runtime error thrown by `@stackframe/stack` when
 * its context is missing, while keeping the Suspense-driven UX intact.
 */
function SignInContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const user = useUser({ or: 'return-null' });
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  // If user is already signed in and there's a redirect parameter, redirect them
  useEffect(() => {
    if (user && redirect !== '/' && !hasRedirected) {
      setHasRedirected(true);
      router.push(redirect);
    }
  }, [user, redirect, router, hasRedirected]);

  if (!isStackConfigured) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-muted-foreground">
          Authentication is currently unavailable. Contact the Shop4Me team to
          complete sign-in once Stack credentials are configured.
        </p>
        <p className="text-xs text-muted-foreground">
          Required env vars: {STACK_AUTH_REQUIRED_ENV_VARS.map((variable, index) => (
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

  // If user is already signed in, show appropriate message and redirect options
  if (user) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-semibold">You are already signed in</h2>
        <div className="flex gap-2 justify-center">
          <Button 
            variant="outline" 
            onClick={() => router.push('/auth/stack/sign-out')}
          >
            Sign out
          </Button>
          <Button 
            onClick={() => router.push(redirect)}
          >
            {redirect === '/admin' ? 'Go to Admin' : 'Go home'}
          </Button>
        </div>
        {redirect !== '/' && (
          <p className="text-xs text-muted-foreground">
            You&apos;ll be redirected to {redirect} after clicking Continue
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <SignIn />
      <p className="text-sm text-muted-foreground text-center mt-6">
        Need an account?{' '}
        <Link href="/auth/signup" className="text-primary hover:underline">
          Register instead
        </Link>
      </p>
      {redirect !== '/' && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          You&apos;ll be redirected to {redirect} after signing in
        </p>
      )}
    </>
  );
}

/**
 * High-level auth route wrapper responsible for presenting the Stack sign-in UI
 * inside the branded `Card` shell. Depends on `StackAuthProvider` (layout
 * level) for context and reuses the cart/theme providers established in
 * `app/layout.tsx` to maintain a consistent experience across routes.
 */
export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Shop4Me</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your account
          </p>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <SignInContent />
        </Suspense>
      </Card>
    </div>
  );
}
