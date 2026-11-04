import authenticationManager from '#lib/server/auth/AuthenticationManager.js';
import { fail, redirect } from '@sveltejs/kit';

const MIN_PASSWORD_LENGTH = 6;

// Redirects logged in users to the homepage
export function load({ locals }) {
	if (locals.user) {
		redirect(303, '/');
	}
}

const validateSignupForm = (email, name, password, role) => {
	const errors = {};
	// Fields cannot be empty
	if (!email || !name || !password || !role) {
		errors.general = 'Missing required form fields';
	}
	if (password.length < MIN_PASSWORD_LENGTH) {
		errors.general = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
	}
	return errors;
};

export const actions = {
	default: async ({ request, cookies }) => {
		// Empty string defaults allow validation to detect empty fields
		const form = await request.formData();
		const role = (form.get('role') ?? '').toLowerCase();
		const email = (form.get('email') ?? '').trim();
		const name = (form.get('name') ?? '').trim();
		const password = form.get('password') ?? '';

		// Validate signup fields
		const errors = validateSignupForm(email, name, password, role);
		if (Object.keys(errors).length > 0) {
			return fail(400, { errors, values: { email, name } });
		}

		try {
			// Create the account and log in (session)
			const { session } = await authenticationManager.signUp({
				email,
				name,
				password,
				role
			});

			// Tell browser client to set the session cookie
			cookies.set('session', session.token, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				expires: session.expiresAt
			});
		} catch (error) {
			return fail(400, {
				errors: { general: error.message },
				values: { email, name }
			});
		}

		// Navigate to homepage
		redirect(303, '/');
	}
};
