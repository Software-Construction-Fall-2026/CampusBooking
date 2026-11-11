import { describe, it, expect } from 'vitest';
import Reservation, { ReservationStatus } from './Reservation.js';

const SAMPLE_RESERVATION = {
	reservationId: 'res-1',
	userId: 'user-1',
	resourceId: 'resource-1',
	date: '2026-11-20',
	startHour: 9,
	status: ReservationStatus.CONFIRMED,
	createdAt: new Date('2026-11-10T12:00:00Z')
};

const makeReservation = (overrides = {}) => {
	return new Reservation({
		...SAMPLE_RESERVATION,
		...overrides
	});
};

describe('Reservation', () => {
	// Getter tests
	it('getters return the values given to the constructor', () => {
		const reservation = makeReservation();
		expect(reservation.getReservationId()).toBe(
			SAMPLE_RESERVATION.reservationId
		);
		expect(reservation.getUserId()).toBe(SAMPLE_RESERVATION.userId);
		expect(reservation.getReservationId()).toBe(
			SAMPLE_RESERVATION.reservationId
		);
		expect(reservation.getResourceId()).toBe(SAMPLE_RESERVATION.resourceId);
		expect(reservation.getDate()).toBe(SAMPLE_RESERVATION.date);
		expect(reservation.getStartHour()).toBe(SAMPLE_RESERVATION.startHour);
		expect(reservation.getStatus()).toBe(SAMPLE_RESERVATION.status);
		expect(reservation.getCreatedAt()).toBe(SAMPLE_RESERVATION.createdAt);
	});

	// Has proper confirmation status
	it('confirmation verification is correct', () => {
		const reservation = makeReservation({
			status: ReservationStatus.CONFIRMED
		});
		expect(reservation.isConfirmed()).toBe(true);
		const reservation2 = makeReservation({
			status: ReservationStatus.CANCELLED
		});
		expect(reservation2.isConfirmed()).toBe(false);
	});

	it('is converted to a plain object properly', () => {
		const reservation = makeReservation();
		expect(reservation.toDocument()).toStrictEqual({
			id: reservation.getReservationId(),
			userId: reservation.getUserId(),
			resourceId: reservation.getResourceId(),
			date: reservation.getDate(),
			startHour: reservation.getStartHour(),
			endHour: reservation.getEndHour(),
			status: reservation.getStatus(),
			createdAt: reservation.getCreatedAt()
		});
	});

	it('gets the proper time label', () => {
		const reservation = makeReservation();
		const expectedTimeLabel = '9:00 AM - 10:00 AM';
		expect(reservation.getTimeLabel()).toBe(expectedTimeLabel);
	});

	it('gets the proper end hour', () => {
		const reservation = makeReservation();
		expect(reservation.getEndHour()).toBe(
			reservation.getStartHour() + Reservation.DURATION_HOURS
		);
	});
});
