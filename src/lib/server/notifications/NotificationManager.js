/**
 * Managers notifications in the system
 * by modifying, reading, or deleting them.
 */

import dataManager from '#lib/server/DataManager.js';

const COLLECTION = 'notifications';

export class NotificationError extends Error {
	constructor(message) {
		super(message);
		this.name = 'NotificationError';
	}
}

export class NotificationManager {
	#dataManager;

	constructor({ data = dataManager } = {}) {
		this.#dataManager = data;
	}

	/**
	 * Save unread notification for the user.
	 *
	 * @param {string} userId - Unique identifier for the user.
	 * @param {string} message - Message to be stored as notification.
	 * @returns {Promise<string>} - Promise resolving to notification ID.
	 */
	async notify(userId, message) {
		const notificationId = await this.#dataManager.save({
			collection: COLLECTION,
			documentData: {
				userId,
				message,
				read: false,
				createdAt: new Date()
			}
		});
		return notificationId;
	}

	/**
	 * Gets all notifications sorted in creation order for the given user id.
	 *
	 * @param {string} userId - Unique identifier for the user.
	 * @returns {Promise<Array>} - Promise resolving to an array of notifications sorted by creation time.
	 */
	async getNotifications(userId) {
		const userNotifications = await this.#dataManager.load({
			collection: COLLECTION,
			filters: [
				{
					field: 'userId',
					operator: '==',
					value: userId
				}
			]
		});

		// Makes the date serializable for sveltekit
		userNotifications.forEach((notification) => {
			notification.createdAt = notification.createdAt.toDate();
		});

		const sortedNotifications = userNotifications.sort(
			(a, b) => b.createdAt - a.createdAt
		);

		return sortedNotifications;
	}

	/**
	 * Marks a notification as read or unread.
	 *
	 * @param {string} userId - Unique identifier for the user who owns the notification.
	 * @param {string} notificationId - Unique identifier for the notification.
	 * @param {boolean} readStatus - `true` if read, `false` if unread.
	 * @throws {NotificationError} If the notification doesn't exist or belongs to another user.
	 */
	async setReadStatus(userId, notificationId, readStatus) {
		const notification = await this.#dataManager.load({
			collection: COLLECTION,
			id: notificationId
		});

		if (!notification || notification.userId !== userId) {
			throw new NotificationError('Notification not found');
		}

		await this.#dataManager.update({
			collection: COLLECTION,
			id: notificationId,
			updatedFields: {
				read: readStatus
			}
		});
	}

	/**
	 * Removes a notification from the notifications collection.
	 *
	 * @param {string} notificationId - Unique identifier for the notification.
	 */
	async deleteNotification(notificationId) {
		await this.#dataManager.delete({
			collection: COLLECTION,
			id: notificationId
		});
	}

	/**
	 * Counts the number of unread notifications for the given user.
	 *
	 * @param {string} userId - Unique identifier for the user.
	 * @returns {Promise<number>} - Promise resolving to the count of unread notifications.
	 */
	async countUnread(userId) {
		const unreadNotifications = await this.#dataManager.load({
			collection: COLLECTION,
			filters: [
				{ field: 'userId', operator: '==', value: userId },
				{ field: 'read', operator: '==', value: false }
			]
		});

		return unreadNotifications.length;
	}
}

export default NotificationManager;
