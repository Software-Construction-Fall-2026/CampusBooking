import { fail, redirect } from '@sveltejs/kit';
import NotificationManager, {
	NotificationError
} from '#lib/server/notifications/NotificationManager.js';

const notificationManager = new NotificationManager();

// Load notifications for the logged in user
export async function load({ locals }) {
	if (!locals.user) {
		redirect(303, '/auth/login');
	}
	const userId = locals.user.getUserId();
	const notifications = await notificationManager.getNotifications(userId);

	return {
		notifications
	};
}

export const actions = {
	// Mark a notification as read when the user clicks the read button
	setRead: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(303, '/auth/login');
		}

		const form = await request.formData();
		const notificationId = form.get('notificationId');

		try {
			await notificationManager.setReadStatus(
				locals.user.getUserId(),
				notificationId,
				true
			);
		} catch (err) {
			// For example if the user does not own the notification
			if (err instanceof NotificationError) {
				return fail(403, { error: err.message });
			}
			console.error('Failed to mark notification as read: ', err);
			return fail(500, { error: 'Something went wrong, please try again.' });
		}
	}
};
