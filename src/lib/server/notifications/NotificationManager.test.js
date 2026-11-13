import { describe, it, expect, vi } from 'vitest';
import {
	NotificationManager,
	NotificationError
} from './NotificationManager.js';

// Firestore returns dates as timestamps with a toDate() method
const timestamp = (isoString) => ({ toDate: () => new Date(isoString) });

// Mock data manager so that it doesn't affect Firestore
const createManager = ({ loadResult = [] } = {}) => {
	const mockDataManager = {
		save: vi.fn().mockResolvedValue('notification123'),
		load: vi.fn().mockResolvedValue(loadResult),
		update: vi.fn().mockResolvedValue(undefined)
	};
	const manager = new NotificationManager({ data: mockDataManager });
	return { manager, mockDataManager };
};

describe('NotificationManager', () => {
	describe('notify', () => {
		it('should save an unread notification for the user', async () => {
			const { manager, mockDataManager } = createManager();

			const id = await manager.notify('student123', 'Hello');

			expect(id).toBe('notification123');
			expect(mockDataManager.save).toHaveBeenCalledWith({
				collection: 'notifications',
				documentData: {
					userId: 'student123',
					message: 'Hello',
					read: false,
					createdAt: expect.any(Date)
				}
			});
		});
	});

	describe('getNotifications', () => {
		it('should only load the notifications of the given user', async () => {
			const { manager, mockDataManager } = createManager();

			await manager.getNotifications('student123');
			expect(mockDataManager.load).toHaveBeenCalledWith({
				collection: 'notifications',
				filters: [{ field: 'userId', operator: '==', value: 'student123' }]
			});
		});

		it('should return the notifications newest first with plain dates', async () => {
			const { manager } = createManager({
				loadResult: [
					{ id: 'old', createdAt: timestamp('2026-11-01T10:00:00Z') },
					{ id: 'newest', createdAt: timestamp('2026-11-10T10:00:00Z') },
					{ id: 'middle', createdAt: timestamp('2026-11-05T10:00:00Z') }
				]
			});

			const notifications = await manager.getNotifications('student123');

			expect(notifications.map((notification) => notification.id)).toEqual([
				'newest',
				'middle',
				'old'
			]);

			expect(notifications[0].createdAt).toBeInstanceOf(Date);
		});
	});

	describe('countUnread', () => {
		it('should count only the unread notifications of the user', async () => {
			const { manager, mockDataManager } = createManager({
				loadResult: [{ id: 'a' }, { id: 'b' }]
			});

			const count = await manager.countUnread('student123');
			expect(count).toBe(2);
			expect(mockDataManager.load).toHaveBeenCalledWith({
				collection: 'notifications',
				filters: [
					{ field: 'userId', operator: '==', value: 'student123' },
					{ field: 'read', operator: '==', value: false }
				]
			});
		});
	});

	describe('setReadStatus', () => {
		it("should update the user's own notification", async () => {
			const { manager, mockDataManager } = createManager({
				loadResult: { id: 'notification123', userId: 'student123' }
			});

			await manager.setReadStatus('student123', 'notification123', true);

			expect(mockDataManager.update).toHaveBeenCalledWith({
				collection: 'notifications',
				id: 'notification123',
				updatedFields: { read: true }
			});
		});

		it("should prevent a user from changing another user's notification", async () => {
			const { manager, mockDataManager } = createManager({
				loadResult: { id: 'notification123', userId: 'student456' }
			});

			await expect(
				manager.setReadStatus('student123', 'notification123', true)
			).rejects.toThrow(NotificationError);
			expect(mockDataManager.update).not.toHaveBeenCalled();
		});

		it('should reject a notification that does not exist', async () => {
			const { manager, mockDataManager } = createManager({
				loadResult: null
			});

			await expect(
				manager.setReadStatus('student123', 'missing', true)
			).rejects.toThrow(NotificationError);
			expect(mockDataManager.update).not.toHaveBeenCalled;
		});
	});
});
