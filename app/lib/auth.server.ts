import { createCookieSessionStorage, redirect } from "@remix-run/node";

const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required.');
}

const sessionStorage = createCookieSessionStorage({
    cookie: {
        name: '__session',
        httpOnly: true,
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
        sameSite: 'lax',
        secrets: [SESSION_SECRET],
        secure: process.env.NODE_ENV === 'production',
    },
});

export async function createUserSession(token: string, redirectTo: string) {
    const session = await sessionStorage.getSession();
    session.set('token', token);

    return redirect(redirectTo, {
        headers: {
            'Set-Cookie': await sessionStorage.commitSession(session),
        },
    });
}

export async function getUserToken(request: Request): Promise<string | null> {
    const session = await sessionStorage.getSession(
        request.headers.get('Cookie')
    );

    return session.get('token') || null;
}

export async function requireUserToken(request: Request): Promise<string> {
    const token = await getUserToken(request);

    if (!token) {
        throw redirect('/login');
    }

    return token;
}

export async function logout(request: Request) {
    const session = await sessionStorage.getSession(
        request.headers.get('Cookie')
    );

    return redirect('/login', {
        headers: {
            'Set-Cookie': await sessionStorage.destroySession(session),
        },
    });
}

// Force logout without request (for 401 handling)
export async function forceLogout() {
    const session = await sessionStorage.getSession();

    throw redirect('/login', {
        headers: {
            'Set-Cookie': await sessionStorage.destroySession(session),
        },
    });
}
