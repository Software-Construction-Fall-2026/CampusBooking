import authenticatonManager from '#lib/server/auth/AuthenticationManager.js';

/**
 * Reads the session cookie and stores the logged
 * in user on event.locals.user before every request
 */
export const handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get('session');
	event.locals.user = null;

	if (sessionToken) {
		try {
			event.locals.user =
				await authenticatonManager.getCurrentUser(sessionToken);
			// Expired or unknown sessions are removed
			if (!event.locals.user) {
				event.cookies.delete('session', { path: '/' });
			}
		} catch (error) {
			console.error('Failed to load current user: ', error);
		}
	}

	return resolve(event);
};
