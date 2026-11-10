import { describe, it, expect, vi } from 'vitest';
import { ReservationManager, ReservationError } from './ReservationManager.js';

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
    const manager = new ReservationManager({
    data: mockDataManager,
    authentication: mockAuthenticationManager
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
});