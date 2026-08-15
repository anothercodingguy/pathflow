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
            { id: session.user.id },
            { email: session.user.email || '' }
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

    // 3. Fallback to existing workspace database user
    const defaultUser = await prisma.user.findFirst();
    if (defaultUser) {
      return {
        id: defaultUser.id,
        email: defaultUser.email || 'admin@pathflow.dev',
        name: defaultUser.name || 'Developer',
        apiKey: defaultUser.apiKey,
        plan: defaultUser.plan || 'FREE',
        planStatus: defaultUser.planStatus || 'ACTIVE',
        planExpiresAt: defaultUser.planExpiresAt,
        image: defaultUser.image,
      };
    }
  } catch (err) {
    console.error('Error fetching current user session:', err);
  }

  return null;
}

/**
 * Validates Python SDK Authorization header (Bearer pf_live_...) for telemetry endpoints
 */
export async function validateAuthToken(request: Request): Promise<UserSession | null> {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const apiKey = authHeader.substring(7).trim();
    const user = await prisma.user.findUnique({
      where: { apiKey }
    });
    if (user) {
      return {
        id: user.id,
        email: user.email || 'user@pathflow.dev',
        name: user.name || 'Developer',
        apiKey: user.apiKey
      };
    }
  }

  // Fallback to NextAuth Session
  const currentUser = await getCurrentUser();
  if (currentUser) {
    return currentUser;
  }

  // Fallback to primary developer account if initial setup
  const defaultUser = await prisma.user.findFirst();
  if (defaultUser) {
    return {
      id: defaultUser.id,
      email: defaultUser.email || 'admin@pathflow.dev',
      name: defaultUser.name || 'Admin',
      apiKey: defaultUser.apiKey
    };
  }

  return null;
}
