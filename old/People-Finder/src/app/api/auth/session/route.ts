import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin'; // Now properly typed

export async function POST(request: Request) {
  try {
    // Check origin for CSRF protection
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    
    if (origin) {
      const originUrl = new URL(origin)
      const expectedOrigin = process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_APP_URL || `https://${host}`
        : `http://${host}`
      
      if (origin !== expectedOrigin && originUrl.host !== host) {
        return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
      }
    }

    const { token } = await request.json();
    
    // Verify the token before creating session
    await adminAuth.verifyIdToken(token);
    
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    const sessionCookie = await adminAuth.createSessionCookie(token, {
      expiresIn,
    });

    const cookieStore = await cookies();
    cookieStore.set({
      name: 'session',
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // Changed from 'lax' to 'strict' for better CSRF protection
      path: '/',
    });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Unauthorized request' }, { status: 401 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    
    // Clear the session cookie with all the same options as when it was set
    cookieStore.set({
      name: 'session',
      value: '',
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    
    // Also try to delete it explicitly
    cookieStore.delete('session');
    
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
