import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import PocketBase from 'pocketbase';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    // Create a new PocketBase instance for each request
    event.locals.pb = new PocketBase(PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');
    
    // Load the auth cookie if it exists
    event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');
    
    try {
        // Refresh the auth if it exists and is valid
        if (event.locals.pb.authStore.isValid) {
            await event.locals.pb.collection('users').authRefresh();
        }
    } catch (err) {
        // Clear the auth and continue
        event.locals.pb.authStore.clear();
    }
    
    // Set the auth user in locals if authenticated
    event.locals.user = event.locals.pb.authStore.model;
    
    // Resolve the request
    const response = await resolve(event);
    
    // Set the latest auth cookie in the response
    response.headers.set('set-cookie', event.locals.pb.authStore.exportToCookie({ 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        httpOnly: true,
        path: '/'
    }));
    
    return response;
};