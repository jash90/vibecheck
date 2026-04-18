import { convexAuth } from '@convex-dev/auth/server';
import Apple from '@auth/core/providers/apple';
import Google from '@auth/core/providers/google';
import Resend from '@auth/core/providers/resend';

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google,
    Apple,
    Resend({
      from: 'VibeCheck <noreply@vibecheck.app>',
    }),
  ],
});
