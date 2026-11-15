import { describe, it, expect, vi } from 'vitest';
import { ReservationManager, ReservationError } from './ReservationManager.js';
import { addDays, getCampusDateTime } from '#lib/utils/datetime.js';

describe('ReservationManager - Cancel Reservation', () => {
    const mockDataManager = {
        load: vi.fn(),
        update: vi.fn()
    };
    const mockAuthenticationManager = {
    hasRole: vi.fn().mockReturnValue(true)
    };
    const mockUser = {
    getUserId: vi.fn().mockReturnValue('student123')
    };
		const mockResourceManager = {
			getResource: vi.fn().mockResolvedValue({name: "Study Room"})
		};
		const mockNotificationManager = {
			notify: vi.fn().mockResolvedValue("notification123")
		}
    const manager = new ReservationManager({
			data: mockDataManager,
			authentication: mockAuthenticationManager,
			resources: mockResourceManager,
			notifications: mockNotificationManager
    });
    it('should prevent a user from cancelling another users reservation', async () => {
    const reservation = {
        id: 'reservation123',
        userId: 'student456',
        status: 'confirmed',
        date: '2026-12-15',
        startHour: 10
    };

    mockDataManager.load.mockResolvedValue(reservation);

    await expect(
        manager.cancelReservation(mockUser, 'reservation123')
    ).rejects.toThrow(
        'You are not authorized to cancel this reservation.'
    );

    expect(mockDataManager.update).not.toHaveBeenCalled();
    });
    it('should reject cancellation when reservation does not exist', async () => {
    mockDataManager.load.mockResolvedValue(null);

    await expect(
        manager.cancelReservation(mockUser, 'reservation123')
    ).rejects.toThrow('Reservation not found.');

    expect(mockDataManager.update).not.toHaveBeenCalled();
});

it('should reject cancellation when reservation is already cancelled', async () => {
    const reservation = {
        id: 'reservation123',
        userId: 'student123',
        status: 'cancelled',
        date: '2026-12-15',
        startHour: 10
    };

    mockDataManager.load.mockResolvedValue(reservation);

    await expect(
        manager.cancelReservation(mockUser, 'reservation123')
    ).rejects.toThrow('This reservation has already been cancelled.');

    expect(mockDataManager.update).not.toHaveBeenCalled();
    });

it('should reject cancellation when reservation has already started', async () => {
    const reservation = {
        id: 'reservation123',
        userId: 'student123',
        status: 'confirmed',
        date: '2020-01-01',
        startHour: 10
    };

    mockDataManager.load.mockResolvedValue(reservation);

    await expect(
        manager.cancelReservation(mockUser, 'reservation123')
    ).rejects.toThrow(
        'This reservation has already started and cannot be cancelled.'
    );

    expect(mockDataManager.update).not.toHaveBeenCalled();
    });
    it('should successfully cancel a valid reservation', async () => {
    const reservation = {
        id: 'reservation123',
        userId: 'student123',
        status: 'confirmed',
        date: '2099-12-15',
        startHour: 10
    };

    mockDataManager.load.mockResolvedValue(reservation);
    mockDataManager.update.mockResolvedValue(undefined);

    const result = await manager.cancelReservation(
        mockUser,
        'reservation123'
    );

    expect(mockDataManager.update).toHaveBeenCalledWith(
    expect.objectContaining({
        collection: 'reservations',
        id: 'reservation123',
        updatedFields: {
            status: 'cancelled'
        }
    })
    );

    expect(result.status).toBe('cancelled');
    });

		it('should notify the user when a reservation is cancelled', async () => {
			const reservation = {
				id: 'reservation123',
				userId: 'student123',
				resourceId: 'room1',
				status: 'confirmed',
				date: '2099-12-15',
				startHour: 10,
				endHour: 11
			};

			mockDataManager.load.mockResolvedValue(reservation);
			mockDataManager.update.mockResolvedValue(undefined);

			await manager.cancelReservation(mockUser, 'reservation123');

			expect(mockNotificationManager.notify).toHaveBeenCalledWith(
				'student123',
				expect.stringContaining('Study Room')
			);

			expect(mockNotificationManager.notify).toHaveBeenCalledWith(
				'student123',
				expect.stringContaining('cancelled')
			);
		});

		it("should still cancel the reservation if the notification fails", async () => {
			const reservation = {
				id: 'reservation123',
				userId: 'student123',
				resourceId: 'room1',
				status: 'confirmed',
				date: '2099-12-15',
				startHour: 10,
				endHour: 11
			};

			mockDataManager.load.mockResolvedValue(reservation);
			mockDataManager.update.mockResolvedValue(undefined);
			mockNotificationManager.notify.mockRejectedValueOnce(new Error("Firestore is down"));

			const result = await manager.cancelReservation(mockUser, "reservation123")
			expect(result.status).toBe("cancelled");
		});
});

describe('ReservationManager - View Reservations (C13)', () => {
	// Reservations are loaded from a list and resources by their id
	const createManager = ({
		reservations = [],
		resources = {},
		role = 'student'
	} = {}) => {
		const mockDataManager = {
			load: vi.fn(async (criteria) =>
				criteria.id ? (resources[criteria.id] ?? null) : reservations
			)
		};
		const mockAuthenticationManager = {
			hasRole: vi.fn(
				(user, checkedRole) => Boolean(user) && checkedRole === role
			)
		};
		const manager = new ReservationManager({
			data: mockDataManager,
			authentication: mockAuthenticationManager
		});
		return { manager, mockDataManager };
	};

	const mockUser = { getUserId: vi.fn().mockReturnValue('student123') };

	const studyRoom = {
		id: 'room1',
		name: 'Study Room',
		building: 'Library',
		room: '201'
	};

	const getResourceLoads = (mockDataManager) =>
		mockDataManager.load.mock.calls.filter(
			([criteria]) => criteria.collection === 'resources'
		);

	describe('getMyReservations', () => {
		it('should reject users who are not logged in', async () => {
			const { manager, mockDataManager } = createManager();

			await expect(manager.getMyReservations(null)).rejects.toThrow(
				ReservationError
			);
			expect(mockDataManager.load).not.toHaveBeenCalled();
		});

		it('should only load the reservations of the current user', async () => {
			const { manager, mockDataManager } = createManager();

			await manager.getMyReservations(mockUser);

			expect(mockDataManager.load).toHaveBeenCalledWith({
				collection: 'reservations',
				filters: [{ field: 'userId', operator: '==', value: 'student123' }]
			});
		});

		it('should return empty lists when the user has no reservations', async () => {
			const { manager } = createManager();

			const result = await manager.getMyReservations(mockUser);

			expect(result).toEqual({ upcoming: [], past: [] });
		});

		it('should split reservations into upcoming and past, sorted by date and time', async () => {
			const { manager } = createManager({
				resources: { room1: studyRoom },
				reservations: [
					{
						id: 'later',
						userId: 'student123',
						resourceId: 'room1',
						date: '2099-12-20',
						startHour: 9,
						status: 'confirmed'
					},
					{
						id: 'sooner',
						userId: 'student123',
						resourceId: 'room1',
						date: '2099-12-15',
						startHour: 14,
						status: 'confirmed'
					},
					{
						id: 'soonest',
						userId: 'student123',
						resourceId: 'room1',
						date: '2099-12-15',
						startHour: 10,
						status: 'confirmed'
					},
					{
						id: 'old',
						userId: 'student123',
						resourceId: 'room1',
						date: '2020-01-01',
						startHour: 10,
						status: 'confirmed'
					},
					{
						id: 'recent',
						userId: 'student123',
						resourceId: 'room1',
						date: '2021-06-01',
						startHour: 10,
						status: 'confirmed'
					},
					{
						id: 'cancelled',
						userId: 'student123',
						resourceId: 'room1',
						date: '2099-12-30',
						startHour: 10,
						status: 'cancelled'
					}
				]
			});

			const { upcoming, past } = await manager.getMyReservations(mockUser);

			expect(upcoming.map((reservation) => reservation.id)).toEqual([
				'soonest',
				'sooner',
				'later'
			]);
			// Cancelled reservations go with the past ones, most recent first
			expect(past.map((reservation) => reservation.id)).toEqual([
				'cancelled',
				'recent',
				'old'
			]);
		});

		it('should include the resource details and a readable time', async () => {
			const { manager } = createManager({
				resources: { room1: studyRoom },
				reservations: [
					{
						id: 'reservation123',
						userId: 'student123',
						resourceId: 'room1',
						date: '2099-12-15',
						startHour: 14,
						status: 'confirmed'
					}
				]
			});

			const { upcoming } = await manager.getMyReservations(mockUser);

			expect(upcoming[0]).toEqual({
				id: 'reservation123',
				userId: 'student123',
				resourceId: 'room1',
				resourceName: 'Study Room',
				building: 'Library',
				room: '201',
				date: '2099-12-15',
				startHour: 14,
				timeLabel: '2:00 PM - 3:00 PM',
				status: 'confirmed'
			});
		});

		it('should load each resource from the DataManager only once', async () => {
			const { manager, mockDataManager } = createManager({
				resources: { room1: studyRoom },
				reservations: [
					{
						id: 'a',
						userId: 'student123',
						resourceId: 'room1',
						date: '2099-12-15',
						startHour: 10,
						status: 'confirmed'
					},
					{
						id: 'b',
						userId: 'student123',
						resourceId: 'room1',
						date: '2099-12-16',
						startHour: 10,
						status: 'confirmed'
					}
				]
			});

			await manager.getMyReservations(mockUser);

			expect(getResourceLoads(mockDataManager)).toEqual([
				[{ collection: 'resources', id: 'room1' }]
			]);
		});

		it('should still show reservations whose resource was deleted', async () => {
			const { manager } = createManager({
				reservations: [
					{
						id: 'reservation123',
						userId: 'student123',
						resourceId: 'deleted',
						date: '2099-12-15',
						startHour: 10,
						status: 'confirmed'
					}
				]
			});

			const { upcoming } = await manager.getMyReservations(mockUser);

			expect(upcoming[0].resourceName).toBe('Unknown resource');
			expect(upcoming[0].building).toBeNull();
		});
	});

	describe('getAllReservations', () => {
		it('should reject users who are not administrators', async () => {
			const { manager, mockDataManager } = createManager({ role: 'student' });

			await expect(manager.getAllReservations(mockUser)).rejects.toThrow(
				'Only administrators can view all reservations.'
			);
			expect(mockDataManager.load).not.toHaveBeenCalled();
		});

		it('should return the reservations of every user to an administrator', async () => {
			const { manager, mockDataManager } = createManager({
				role: 'admin',
				resources: { room1: studyRoom },
				reservations: [
					{
						id: 'a',
						userId: 'student123',
						resourceId: 'room1',
						date: '2099-12-15',
						startHour: 10,
						status: 'confirmed'
					},
					{
						id: 'b',
						userId: 'faculty456',
						resourceId: 'room1',
						date: '2020-01-01',
						startHour: 10,
						status: 'confirmed'
					}
				]
			});

			const { upcoming, past } = await manager.getAllReservations(mockUser);

			// The whole collection is loaded, without a user filter
			expect(mockDataManager.load).toHaveBeenCalledWith({
				collection: 'reservations'
			});
			expect(upcoming.map((reservation) => reservation.userId)).toEqual([
				'student123'
			]);
			expect(past.map((reservation) => reservation.userId)).toEqual([
				'faculty456'
			]);
		});
	});
});

describe('ReservationManager for administrators', () => {
	const admin = { role: 'admin' };
	const student = { role: 'student', getUserId: () => 'student1' };
	const studyRoom = { id: 'room1', name: 'Study Room' };

	const upcomingReservation = {
		id: 'res1',
		userId: 'student1',
		resourceId: 'room1',
		status: 'confirmed',
		date: '2099-12-15',
		startHour: 10
	};

	const createManager = ({ reservation = null, reservations = [] } = {}) => {
		const mockDataManager = {
			load: vi.fn(async (criteria) => {
				if (criteria.id) {
					return reservation;
				}
				return reservations;
			}),
			save: vi.fn(),
			update: vi.fn()
		};

		const mockResourceManager = {
			getResource: vi.fn().mockResolvedValue(studyRoom),
			isAvailable: vi.fn().mockReturnValue(true)
		};

		const mockAuthenticationManager = {
			hasRole: vi.fn((user, role) => user.role === role),
			getUserById: vi.fn().mockResolvedValue(student)
		};

		const mockNotificationManager = { notify: vi.fn() };

		const manager = new ReservationManager({
			data: mockDataManager,
			resources: mockResourceManager,
			authentication: mockAuthenticationManager,
			notifications: mockNotificationManager
		});

		return { manager, mockDataManager, mockNotificationManager };
	};

	it('should make a reservation for a user and notify them', async () => {
		const { manager, mockDataManager, mockNotificationManager } =
			createManager();

		const tomorrow = addDays(getCampusDateTime('America/Denver').date, 1);
		const reservation = await manager.makeReservationForUser(
			admin,
			'student1',
			'room1',
			tomorrow,
			10
		);

		expect(reservation.getUserId()).toBe('student1');
		expect(mockDataManager.save).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: 'reservations',
				documentData: expect.objectContaining({
					userId: 'student1',
					resourceId: 'room1',
					date: tomorrow,
					startHour: 10
				})
			})
		);

		expect(mockNotificationManager.notify).toHaveBeenCalledWith(
			'student1',
			expect.stringContaining('has been confirmed')
		);
	});

	it("should cancel a user's reservation and notify the owner", async () => {
		const { manager, mockDataManager, mockNotificationManager } = createManager(
			{ reservation: upcomingReservation }
		);
		const result = await manager.cancelReservationForUser(admin, 'res1');

		expect(result.status).toBe('cancelled');
		expect(mockDataManager.update).toHaveBeenCalledWith({
			collection: 'reservations',
			id: 'res1',
			updatedFields: { status: 'cancelled' }
		});
		expect(mockNotificationManager.notify).toHaveBeenCalledWith(
			'student1',
			expect.stringContaining('cancelled by an administrator')
		);
	});

	it('should cancel only the upcoming reservations of a removed resource', async () => {
		const { manager, mockDataManager, mockNotificationManager } = createManager(
			{
				reservations: [
					{ ...upcomingReservation, id: 'upcoming' },
					{ ...upcomingReservation, id: 'past', date: '2020-01-01' }
				]
			}
		);

		await manager.cancelReservationsFor(studyRoom);
		expect(mockDataManager.update).toHaveBeenCalledWith({
			collection: 'reservations',
			id: 'upcoming',
			updatedFields: { deletedResourceName: 'Study Room', status: 'cancelled' }
		});

		expect(mockDataManager.update).toHaveBeenCalledWith({
			collection: 'reservations',
			id: 'past',
			updatedFields: { deletedResourceName: 'Study Room' }
		});

		expect(mockNotificationManager.notify).toHaveBeenCalledTimes(1);
	});
});