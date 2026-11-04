import authenticatonManager, {
	AuthenticationError
} from '#lib/server/auth/AuthenticationManager.js';
import { fail } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

// Redirects logged in users to the homepage
export function load({ locals }) {
	if (locals.user) {
		redirect(303, '/');
	}
}

const validateLoginForm = (email, password, role) => {
	const errors = {};
	// Fields cannot be empty
	if (!email || !password || !role) {
		errors.general = 'Missing required form fields';
	}
	return errors;
};

export const actions = {
	default: async ({ request, cookies }) => {
		// Empty string defaults allow validation to detect empty fields
		const form = await request.formData();
		const role = form.get('role') ?? '';
		const email = (form.get('email') ?? '').trim();
		const password = form.get('password') ?? '';

		// Validate login fields
		const errors = validateLoginForm(email, password, role);
		if (Object.keys(errors).length > 0) {
			return fail(400, { errors, values: { email } });
		}

		try {
			// Check credentials and start a session
			const { session } = await authenticatonManager.logIn({
				email,
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
			if (error instanceof AuthenticationError) {
				return fail(400, {
					errors: { general: error.message },
					values: { email }
				});
			}
			return fail(500, {
				errors: { general: 'Something went wrong, please try again' },
				values: { email }
			});
		}

		// Navigate to homepage
		redirect(303, '/');
	}
};
