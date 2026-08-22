import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { cookies } from 'next/headers';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  apiKey: string;
  plan?: string;
  planStatus?: string;
  planExpiresAt?: Date | null;
  image?: string | null;
}

export const AUTH_COOKIE_NAME = 'authjs.session-token';

/**
 * Get current authenticated user from NextAuth Google OAuth session or developer API cookie
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    // 1. Check NextAuth Google OAuth session
    const session = await auth();
    if (session && session.user) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            ...(session.user.id ? [{ id: session.user.id }] : []),
            ...(session.user.email ? [{ email: session.user.email }] : [])
          ]
        }
      });
      if (user) {
        return {
          id: user.id,
          email: user.email || 'user@pathflow.dev',
          name: user.name || 'PathFlow User',
          apiKey: user.apiKey,
          plan: user.plan || 'FREE',
          planStatus: user.planStatus || 'ACTIVE',
          planExpiresAt: user.planExpiresAt,
          image: user.image || session.user.image,
        };
      }
    }

    // 2. Check developer API key session cookie (pathflow_session)
    try {
      const cookieStore = await cookies();
      const devSession = cookieStore.get('pathflow_session')?.value;
      if (devSession) {
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { apiKey: devSession },
              { email: devSession },
              { id: devSession }
            ]
          }
        });
        if (user) {
          return {
            id: user.id,
            email: user.email || 'user@pathflow.dev',
            name: user.name || 'Developer',
            apiKey: user.apiKey,
            plan: user.plan || 'FREE',
            planStatus: user.planStatus || 'ACTIVE',
            planExpiresAt: user.planExpiresAt,
            image: user.image,
          };
        }
      }
    } catch {
      // cookies() might not be available in all execution contexts
    }
  } catch (err) {
    console.error('Error fetching current user session:', err);
  }

  return null;
}

/**
 * Validates Python SDK Authorization header (Bearer pf_live_...) or X-PathFlow-Key for telemetry endpoints
 */
export async function validateAuthToken(request: Request): Promise<UserSession | null> {
  try {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    const xApiKey = request.headers.get('X-PathFlow-Key') || request.headers.get('x-pathflow-key');
    
    let apiKey: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7).trim();
    } else if (xApiKey) {
      apiKey = xApiKey.trim();
    }

    if (apiKey) {
      const user = await prisma.user.findUnique({
        where: { apiKey }
      });
      if (user) {
        return {
          id: user.id,
          email: user.email || 'user@pathflow.dev',
          name: user.name || 'Developer',
          apiKey: user.apiKey,
          plan: user.plan || 'FREE',
          planStatus: user.planStatus || 'ACTIVE',
          planExpiresAt: user.planExpiresAt,
          image: user.image
        };
      }
    }

    // Fallback to active NextAuth / cookie Session
    const currentUser = await getCurrentUser();
    if (currentUser) {
      return currentUser;
    }
  } catch (err) {
    console.error('Error validating auth token:', err);
  }

  return null;
}
