import authenticatonManager from '#lib/server/auth/AuthenticationManager.js';
import { redirect } from '@sveltejs/kit';

// Sends the user back to the homepage
// when this page is visited directly from
// the address bar
export function load() {
	redirect(303, '/');
}

export const actions = {
	default: async ({ cookies }) => {
		await authenticatonManager.logOut(cookies.get('session'));
		cookies.delete('session', { path: '/' });
		redirect(303, '/auth/login');
	}
};
