import { SESSION_COOKIE_NAME } from '@/constants/auth';
import { UserRole } from '@/db/schema/users';
import { SessionService } from '@/services/session';
import { HonoEnv } from '@/types/hono-env';
import { HttpStatusCode } from '@/types/http';
import { isInteger } from '@/utils/numbers';
import { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';

export const createAuthMiddleware = (
  sessionService: SessionService,
): MiddlewareHandler<HonoEnv> => {
  return async (c, next) => {
    const cookie = getCookie(c, SESSION_COOKIE_NAME) ?? '';
    const { session, user } = await sessionService.validateSessionToken(cookie);
    c.set('user', user);
    c.set('session', session);
    if (!session || !user) {
      throw new HTTPException(HttpStatusCode.UNAUTHORIZED);
    }
    return next();
  };
};

export const createAdminMiddleware = (
  sessionService: SessionService,
): MiddlewareHandler<HonoEnv> => {
  return async (c, next) => {
    const cookie = getCookie(c, SESSION_COOKIE_NAME) ?? '';
    const { session, user } = await sessionService.validateSessionToken(cookie);
    c.set('user', user);
    c.set('session', session);
    if (!session || !user || user.role !== UserRole.ADMIN) {
      throw new HTTPException(HttpStatusCode.UNAUTHORIZED);
    }
    return next();
  };
};

export const createAdminOrSelfMiddleware = (
  sessionService: SessionService,
): MiddlewareHandler<HonoEnv, '/:userId'> => {
  return async (c, next) => {
    const cookie = getCookie(c, SESSION_COOKIE_NAME) ?? '';
    const { session, user } = await sessionService.validateSessionToken(cookie);
    c.set('user', user);
    c.set('session', session);
    if (!session || !user || user.role !== UserRole.ADMIN) {
      const userId = c.req.param('userId');
      if (
        !user ||
        !isInteger(userId) ||
        Number(userId) !== user.id ||
        user.role !== UserRole.ADMIN
      ) {
        throw new HTTPException(HttpStatusCode.UNAUTHORIZED);
      }
    }
    return next();
  };
};
