export const STACK_AUTH_REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_STACK_PROJECT_ID",
  "NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY",
  "STACK_SECRET_SERVER_KEY",
] as const;

export const STACK_URLS = {
  handler: "/auth/stack",
  signIn: "/auth/signin",
  signUp: "/auth/signup",
  afterSignIn: "/",
  afterSignUp: "/",
  signOut: "/auth/stack/sign-out",
  afterSignOut: "/",
  emailVerification: "/auth/stack/email-verification",
  passwordReset: "/auth/stack/password-reset",
  forgotPassword: "/auth/stack/forgot-password",
  home: "/",
  oauthCallback: "/auth/stack/oauth-callback",
  magicLinkCallback: "/auth/stack/magic-link-callback",
  accountSettings: "/auth/stack/account-settings",
  teamInvitation: "/auth/stack/team-invitation",
  mfa: "/auth/stack/mfa",
  error: "/auth/stack/error",
} as const;
