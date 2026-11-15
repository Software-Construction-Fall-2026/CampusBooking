import { describe, it, expect, vi } from 'vitest';
import ResourceManager from './ResourceManager.js';

describe('ResourceManager', () => {
    it('should return all campus resources', async () => {
        const resources = [
            {
                id: '1',
                name: 'Study Room',
                type: 'Study Room',
                building: 'Library'
            },
            {
                id: '2',
                name: 'Computer Lab',
                type: 'Computer Lab',
                building: 'CCSB'
            }
        ];

        const mockDataManager = {
            load: vi.fn().mockResolvedValue(resources)
        };

        const manager = new ResourceManager(mockDataManager);
        const result = await manager.getResources();

        expect(result).toEqual(resources);
        expect(mockDataManager.load).toHaveBeenCalledWith({
            collection: 'resources'
        });
    });

    it('should return an empty list when no resources exist', async () => {
        const mockDataManager = {
            load: vi.fn().mockResolvedValue([])
        };

        const manager = new ResourceManager(mockDataManager);
        const result = await manager.getResources();

        expect(result).toEqual([]);
    });
});

describe('ResourceManager - Administrators (C5, C6)', () => {
	const admin = { role: 'admin' };
	const student = { role: 'student' };

	const studyRoom = {
		id: 'room1',
		name: 'Study Room',
		type: 'Study Room',
		building: 'Library',
		availability: true
	};

	// dataManager.load returns the study room for any id
	const createManager = () => {
		const mockDataManager = {
			load: vi.fn().mockResolvedValue(studyRoom),
			save: vi.fn().mockResolvedValue('newRoom'),
			update: vi.fn(),
			delete: vi.fn()
		};

		const mockAuthenticationManager = {
			hasRole: vi.fn((user, role) => user.role === role)
		};

		const manager = new ResourceManager(
			mockDataManager,
			mockAuthenticationManager
		);

		return { manager, mockDataManager };
	};

	it('should reject users who are not administrators', async () => {
		const { manager, mockDataManager } = createManager();

		await expect(manager.addResource(student, studyRoom)).rejects.toThrow(
			'Only administrators can manage resources.'
		);
		expect(mockDataManager.save).not.toHaveBeenCalled();
	});

	it('should add a resource with only the known fields', async () => {
		const { manager, mockDataManager } = createManager();
		const resourceId = await manager.addResource(admin, {
			id: 'hacked',
			name: 'Study Room',
			type: 'Study Room',
			building: 'Library'
		});

		expect(resourceId).toBe('newRoom');
		expect(mockDataManager.save).toHaveBeenCalledWith({
			collection: 'resources',
			documentData: {
				name: 'Study Room',
				type: 'Study Room',
				building: 'Library',
				availability: true
			}
		});
	});

	it('should edit only the changed fields and keep the rest', async () => {
		const { manager, mockDataManager } = createManager();

		const result = await manager.editResource(admin, 'room1', {
			name: 'Quiet Room'
		});

		expect(mockDataManager.update).toHaveBeenCalledWith({
			collection: 'resources',
			id: 'room1',
			updatedFields: { name: 'Quiet Room' }
		});
		expect(result).toEqual({ ...studyRoom, name: 'Quiet Room' });
	});

	it('should cancel the reservations before removing the resource', async () => {
		const { manager, mockDataManager } = createManager();
		const mockReservationManager = { cancelReservationsFor: vi.fn() };

		await manager.removeResource(admin, 'room1', mockReservationManager);
		expect(mockReservationManager.cancelReservationsFor).toHaveBeenCalledWith(
			studyRoom
		);

		expect(mockDataManager.delete).toHaveBeenCalledWith({
			collection: 'resources',
			id: 'room1'
		});
		const cancelOrder =
			mockReservationManager.cancelReservationsFor.mock.invocationCallOrder[0];
		const deleteOrder = mockDataManager.delete.mock.invocationCallOrder[0];
		expect(cancelOrder).toBeLessThan(deleteOrder);
	});

	it('should set the availability', async () => {
		const { manager, mockDataManager } = createManager();

		await manager.setAvailability(admin, 'room1', false);
		expect(mockDataManager.update).toHaveBeenCalledWith({
			collection: 'resources',
			id: 'room1',
			updatedFields: { availability: false }
		});
	});
});
