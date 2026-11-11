import { describe, it, expect, beforeEach } from 'vitest';
import dataManager from '#lib/server/DataManager.js';
import { clearEmulator } from '#lib/server/testing/emulator.js';
import User from '#lib/server/auth/User';
import reservationManager, {
	ReservationError,
	SlotStatus
} from '#lib/server/reservations/ReservationManager.js';
import { addDays, getCampusDateTime } from '#lib/utils/datetime.js';

beforeEach(clearEmulator);

// Sample documents and constants
const JUAN = new User({ userId: 'juan', role: 'student' });
const BOB = new User({ userId: 'bob', role: 'student' });
const CLASSROOM = { name: 'Study Room', type: 'classroom', availability: true };
const DATE = addDays(getCampusDateTime('America/Denver').date, 1);
const HOUR = 10;

// Status of the slots can be available, booked, or past
const getSlotStatus = async (resourceId) => {
	const resource = await dataManager.load({
		collection: 'resources',
		id: resourceId
	});
	const slots = await reservationManager.getAvailableSlots(resource, DATE);
	return slots.find((slot) => slot.startHour === HOUR).status;
};

// Status of reservation in Firestore which is confirmed or cancelled
const getReservationStatus = async (reservationId) => {
	const reservation = await dataManager.load({
		collection: 'reservations',
		id: reservationId
	});
	return reservation.status;
};

describe('Reservations', () => {
	let resourceId;

	beforeEach(async () => {
		resourceId = await dataManager.save({
			collection: 'resources',
			documentData: CLASSROOM
		});
	});

	// The reservation slots are one hour for now
	it('books a one hour slot', async () => {
		const reservation = await reservationManager.makeReservation(
			JUAN,
			resourceId,
			DATE,
			HOUR
		);

		const stored = await dataManager.load({
			collection: 'reservations',
			id: reservation.getReservationId()
		});

		expect(stored).toMatchObject({
			userId: 'juan',
			resourceId,
			date: DATE,
			startHour: HOUR,
			status: 'confirmed'
		});

		expect(await getSlotStatus(resourceId)).toBe(SlotStatus.BOOKED);
	});

	// Each resource is only booked once
	it('rejects a second booking of the same slot', async () => {
		await reservationManager.makeReservation(JUAN, resourceId, DATE, HOUR);

		await expect(
			reservationManager.makeReservation(BOB, resourceId, DATE, HOUR)
		).rejects.toThrow(ReservationError);
	});

	// Some resources can be marked unavailable by an administrator
	it('rejects booking an unavailable resource', async () => {
		await dataManager.update({
			collection: 'resources',
			id: resourceId,
			updatedFields: { availability: false }
		});

		await expect(
			reservationManager.makeReservation(JUAN, resourceId, DATE, HOUR)
		).rejects.toThrow(ReservationError);
	});

	// For security purposes
	it('lets a student cancel only their own booking', async () => {
		const own = await reservationManager.makeReservation(
			JUAN,
			resourceId,
			DATE,
			HOUR
		);

		const other = await reservationManager.makeReservation(
			BOB,
			resourceId,
			DATE,
			HOUR + 1
		);

		await reservationManager.cancelReservation(JUAN, own.getReservationId());
		expect(await getReservationStatus(own.getReservationId())).toBe(
			'cancelled'
		);
		expect(await getSlotStatus(resourceId)).toBe(SlotStatus.AVAILABLE);

		await expect(
			reservationManager.cancelReservation(JUAN, other.getReservationId())
		).rejects.toThrow(ReservationError);
		expect(await getReservationStatus(other.getReservationId())).toBe(
			'confirmed'
		);
	});
});
