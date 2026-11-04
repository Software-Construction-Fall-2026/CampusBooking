// Gets the logged in user, if any
// Locals user is populated by hooks.server.js 
// using session data
export function load({ locals }) {
	return {
		user: locals.user
			? { name: locals.user.getName(), role: locals.user.getRole() }
			: null
	};
}
