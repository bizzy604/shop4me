'use client';

import { useUser, UserButton } from '@stackframe/stack';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Suspense } from 'react';

function UserMenuContent() {
  const user = useUser({ or: 'return-null' });

  if (!user) {
    return (
      <Link href="/auth/signin">
        <Button variant="default" size="sm">
          Sign In
        </Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">
        {user.displayName || user.primaryEmail || 'User'}
      </span>
      <UserButton />
    </div>
  );
}

export function UserMenu() {
  return (
    <Suspense fallback={
      <Link href="/auth/signin">
        <Button variant="default" size="sm">
          Sign In
        </Button>
      </Link>
    }>
      <UserMenuContent />
    </Suspense>
  );
}
