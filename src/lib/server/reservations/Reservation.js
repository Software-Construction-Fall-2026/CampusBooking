/**
 * Contains the information about a booking
 * for a student or faculty member
 *
 * Every reservation is a 1 hour slot
 *
 * The date is parsed as "YYYY-MM-DD"
 * and the hour is parsed as an integer from 0 to 23.
 *
 * It is implemented according to the SDD Report
 * and is part of the reservation subsystem.
 */

import { formatHour } from '#lib/utils/datetime.js';

export const ReservationStatus = Object.freeze({
	CONFIRMED: 'confirmed',
	CANCELLED: 'cancelled'
});

export default class Reservation {
	static DURATION_HOURS = 1;

	#reservationId;
	#userId;
	#resourceId;
	#date;
	#startHour;
	#status;
	#createdAt;

	constructor({
		reservationId,
		userId,
		resourceId,
		date,
		startHour,
		status,
		createdAt
	}) {
		this.#reservationId = reservationId;
		this.#userId = userId;
		this.#resourceId = resourceId;
		this.#date = date;
		this.#startHour = startHour;
		this.#status = status;
		this.#createdAt = createdAt;
	}

	// Converts the reservation to a plain object
	// so it can be uploaded to the database
	toDocument() {
		return {
			id: this.#reservationId,
			userId: this.#userId,
			resourceId: this.#resourceId,
			date: this.#date,
			startHour: this.#startHour,
			endHour: this.getEndHour(),
			status: this.#status,
			createdAt: this.#createdAt
		};
	}

	getReservationId() {
		return this.#reservationId;
	}

	getUserId() {
		return this.#userId;
	}

	getResourceId() {
		return this.#resourceId;
	}

	getDate() {
		return this.#date;
	}

	getStartHour() {
		return this.#startHour;
	}

	getEndHour() {
		return this.#startHour + Reservation.DURATION_HOURS;
	}

	getStatus() {
		return this.#status;
	}

	getCreatedAt() {
		return this.#createdAt;
	}

	isConfirmed() {
		return this.#status === ReservationStatus.CONFIRMED;
	}

	getTimeLabel() {
		return `${formatHour(this.#startHour)} - ${formatHour(this.getEndHour())}`;
	}
}
