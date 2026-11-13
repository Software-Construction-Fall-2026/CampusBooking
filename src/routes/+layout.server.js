import NotificationManager from '#lib/server/notifications/NotificationManager.js';

// Gets the logged in user, if any
// Locals user is populated by hooks.server.js 
// using session data
export async function load({ locals }) {
	let unreadNotifications = null;
	if (locals.user) {
		const notificationManager = new NotificationManager();
		try {
			unreadNotifications = await notificationManager.countUnread(
				locals.user.getUserId()
			);
		} catch {
			// Unread notifications shouldn't cause an error
		}
	}

	return {
		user: locals.user
			? { name: locals.user.getName(), role: locals.user.getRole() }
			: null,
		unreadNotifications
	};
}
