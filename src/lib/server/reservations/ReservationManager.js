/**
 * This manager handles all the reservation
 * requests. It also shows the available
 * dates and times so the users can make reservations.
 *
 * It is implemented according to the SDD Report
 * inside the reservation subsystem.
 *
 * It has the contracts
 * C9: Check available dates and times
 * C10: Make reservation
 * C11: Cancel reservation
 * C12: Cancel resource reservations
 * C13: View reservations
 *
 * It uses the contracts from other classes, like
 * C2: Check User Role (AuthenticationManager)
 * C7: Check Availability (ResourceManager), and
 * C15: Store and Retrieve Data (DataManager),
 */

import { randomUUID } from 'node:crypto';

import dataManager from '#lib/server/DataManager.js';

// For user role checking
import authenticationManager from '#lib/server/auth/AuthenticationManager.js';
import Roles from '#lib/server/auth/Roles.js';

// For the reserved resources and reservations
import ResourceManager from '#lib/server/ResourceManager.js';
import Reservation, {
	ReservationStatus
} from '#lib/server/reservations/Reservation.js';

import {
	formatHour,
	isPast,
	getCampusDateTime,
	addDays,
	isValidDateString,
	formatDate
} from '#lib/utils/datetime.js';
import NotificationManager from '#lib/server/notifications/NotificationManager.js';

const CONSTANTS = {
	RESERVATIONS_COLLECTION: 'reservations',
	RESOURCES_COLLECTION: 'resources',
	CAMPUS_TIME_ZONE: 'America/Denver',
	BOOKING_WINDOW_DAYS: 30,
	HOURS_IN_DAY: 24
};

// The slots may have already been booked or are in the past,
// so the user wouldn't be able to book those. The status helps
// to show that clearly.
export const SlotStatus = Object.freeze({
	AVAILABLE: 'available',
	BOOKED: 'booked',
	PAST: 'past'
});

// Used whenever the reservations fail
export class ReservationError extends Error {
	constructor(message) {
		super(message);
		this.name = 'ReservationError';
	}
}

export class ReservationManager {
	#dataManager;
	#resourceManager;
	#authenticationManager;
	#notificationManager;

	constructor({
		data = dataManager,
		resources = new ResourceManager(),
		authentication = authenticationManager,
		notifications = new NotificationManager()
	} = {}) {
		this.#dataManager = data;
		this.#resourceManager = resources;
		this.#authenticationManager = authentication;
		this.#notificationManager = notifications;
	}

	// Loads all the confirmed reservations for the resource on the given date
	async #getConfirmedReservations(resourceId, date) {
		const reservations = await this.#dataManager.load({
			collection: CONSTANTS.RESERVATIONS_COLLECTION,
			filters: [
				{ field: 'resourceId', operator: '==', value: resourceId },
				{ field: 'date', operator: '==', value: date },
				{ field: 'status', operator: '==', value: ReservationStatus.CONFIRMED }
			]
		});

		return reservations;
	}

	// Checks if the user has the administrator role
	#isAdministrator(user) {
		return this.#authenticationManager.hasRole(user, Roles.ROLES.ADMINISTRATOR);
	}

	// Notifications should never stop a reservation from being made or cancelled
	// since they're just for user experience
	async #sendNotification(userId, message) {
		try {
			await this.#notificationManager.notify(userId, message);
		} catch  {
			// Ignored since the notification is only UX 
		}
	}

	/**
	 * Only students and faculty members can make reservations
	 *
	 * @param {User} user The user whose role will be checked.
	 * @returns {boolean} True if the user has a role that supports reservations
	 */
	canReserve(user) {
		const isStudent = this.#authenticationManager.hasRole(
			user,
			Roles.ROLES.STUDENT
		);

		const isFaculty = this.#authenticationManager.hasRole(
			user,
			Roles.ROLES.FACULTY
		);

		return isStudent || isFaculty;
	}

	/**
	 * Gets the first and last dates that can be booked
	 * starting from the current day on the campus.
	 *
	 * @returns {object} { firstDate, lastDate }, where each date is in "YYYY-MM-DD" format
	 */
	getBookingWindow() {
		const now = getCampusDateTime(CONSTANTS.CAMPUS_TIME_ZONE);
		return {
			firstDate: now.date,
			lastDate: addDays(now.date, CONSTANTS.BOOKING_WINDOW_DAYS)
		};
	}

	/**
	 * Checks that the date is valid and inside the booking window
	 *
	 * @param {string} date The date in "YYYY-MM-DD" format.
	 * @returns {boolean} True if the date can be booked.
	 */
	isWithinBookingWindow(date) {
		if (!isValidDateString(date)) {
			return false;
		}

		const { firstDate, lastDate } = this.getBookingWindow();
		return date >= firstDate && date <= lastDate;
	}

	/**
	 *
	 * Returns a list of 1 hour slots available
	 * for booking a resource on the given date.
	 *
	 * Some slots may not be allowed on the resource,
	 * so we don't include those. The ones that remain
	 * are labeled as available, booked, or past.
	 *
	 * @param {object} resource The resource document
	 * @param {string} date The date in "YYYY-MM-DD" format.
	 * @returns {Promise<object[]>} A list of slots, where each slot
	 * is in the format { startHour, endHour, label, status }.
	 */
	async getAvailableSlots(resource, date) {
		if (!this.isWithinBookingWindow(date)) {
			return [];
		}

    // Get the existing reservations and their hours
		const reservations = await this.#getConfirmedReservations(
			resource.id,
			date
		);
		const bookedHours = new Set(
			reservations.map((reservation) => reservation.startHour)
		);

    // Get current datetime
		const now = getCampusDateTime(CONSTANTS.CAMPUS_TIME_ZONE);
		const slots = [];
		for (let hour = 0; hour < CONSTANTS.HOURS_IN_DAY; hour++) {
			const period = {
				date,
				startHour: hour,
				endHour: hour + Reservation.DURATION_HOURS
			};

      // The resource is taken on this period so we just move on
			if (!this.#resourceManager.isAvailable(resource, period)) {
				continue;
			}

      // Assume available until we check if its booked or in the past
			let status = SlotStatus.AVAILABLE;
			if (isPast(period, now)) {
				status = SlotStatus.PAST;
			} else if (bookedHours.has(hour)) {
				status = SlotStatus.BOOKED;
			}

      // Add it to the returned slots with a readable datetime
			slots.push({
				startHour: period.startHour,
				endHour: period.endHour,
				label: `${formatHour(period.startHour)}-${formatHour(period.endHour)}`,
				status
			});
		}

		return slots;
	}

	/**
	 *
	 * Checks the booking rules and saves a reservation for the owner.
	 *
	 * @param {User} owner The student or faculty member the reservation is for.
	 * @param {string} resourceId The id of the resource to book.
	 * @param {string} date The date in "YYYY-MM-DD" format
	 * @param {number} startHour The starting hour in 24-hour time
	 * @returns {Promise<Reservation>} The saved reservation.
	 * @throws {ReservationError} If the reservation is not allowed.
	 */
	async #createReservation(owner, resourceId, date, startHour) {
		// Cannot be past the 30 days of the booking window
		if (!this.isWithinBookingWindow(date)) {
			throw new ReservationError(
				`Please choose a date within the next ${CONSTANTS.BOOKING_WINDOW_DAYS} days.`
			);
		}

		// Checks that the date is not in the past
		const period = {
			date,
			startHour,
			endHour: startHour + Reservation.DURATION_HOURS
		};
		if (isPast(period, getCampusDateTime(CONSTANTS.CAMPUS_TIME_ZONE))) {
			throw new ReservationError('This time has already passed.');
		}

		// Find the resource just in case the user found an invalid one
		const resource = await this.#resourceManager.getResource(resourceId);
		if (!resource) {
			throw new ReservationError('This resource does not exist.');
		}

		// The resource may not be bookable for the given period
		if (!this.#resourceManager.isAvailable(resource, period)) {
			throw new ReservationError(
				'This resource cannot be booked at the selected time.'
			);
		}

		// Avoids double booking
		const reservations = await this.#getConfirmedReservations(resourceId, date);
		const isSlotTaken = reservations.some(
			(reservation) => reservation.startHour === startHour
		);
		if (isSlotTaken) {
			throw new ReservationError(
				'This time slot has already been booked. Please choose another time.'
			);
		}

		// Save the reservation to the database by id
		const reservation = new Reservation({
			reservationId: randomUUID(),
			userId: owner.getUserId(),
			resourceId,
			date,
			startHour,
			status: ReservationStatus.CONFIRMED,
			createdAt: new Date()
		});
		await this.#dataManager.save({
			collection: CONSTANTS.RESERVATIONS_COLLECTION,
			id: reservation.getReservationId(),
			documentData: reservation.toDocument()
		});

		// Send confirmation notification
		await this.#sendNotification(
			owner.getUserId(),
			`Your reservation for ${resource.name} on ${formatDate(reservation.getDate())}, ${reservation.getTimeLabel()} has been confirmed.`
		);

		return reservation;
	}

	/**
	 *
	 * Books a 1 hour slot of a resource for the user.
	 *
	 * @param {User} user The user making the reservation.
	 * @param {string} resourceId The id of the resource to book.
	 * @param {string} date The date in "YYYY-MM-DD" format
	 * @param {number} startHour The starting hour in 24-hour time
	 * @returns {Promise<Reservation>} The saved reservation.
	 * @throws {ReservationError} If the reservation is not allowed.
	 */
	async makeReservation(user, resourceId, date, startHour) {
		// Check the user role
		if (!this.canReserve(user)) {
			throw new ReservationError(
				'Only students and faculty members can make reservations.'
			);
		}

		// The reservation helper is extracted since
		// admins use it in their reservations for other users as well
		return this.#createReservation(user, resourceId, date, startHour);
	}

	/**
	 * Allows administrators to make a reservation
	 * for a student or faculty member.
	 *
	 * @param {User} administrator The logged in administrator.
	 * @param {string} userId The id of the student or faculty member.
	 * @param {string} resourceId The id of the resource to book.
	 * @param {string} date The date in "YYYY-MM-DD" format
	 * @param {number} startHour The starting hour in 24-hour time
	 * @returns {Promise<Reservation>} The saved reservation.
	 * @throws {ReservationError} If the reservation is not allowed.
	 */
	async makeReservationForUser(
		administrator,
		userId,
		resourceId,
		date,
		startHour
	) {
		if (!this.#isAdministrator(administrator)) {
			throw new ReservationError(
				'Only administrators can make reservations for other users.'
			);
		}

		// The user has to exist in the database
		const owner = await this.#authenticationManager.getUserById(userId);
		if (!owner) {
			throw new ReservationError('This user does not exist.');
		}

		// User must be student or faculty
		if (!this.canReserve(owner)) {
			throw new ReservationError(
				'Reservations can only be made for students and faculty members.'
			);
		}

		return this.#createReservation(owner, resourceId, date, startHour);
	}

	// Loads the reservation or throws if it doesn't exist
	async #requireReservation(reservationId) {
		const reservation = await this.#dataManager.load({
			collection: CONSTANTS.RESERVATIONS_COLLECTION,
			id: reservationId
		});

		if (!reservation) {
			throw new ReservationError('Reservation not found.');
		}

		return reservation;
	}

	// The resource may have been removed after it was booked,
	// so the name changes to indicate the removal 
	#getResourceName(resource, document) {
		if (resource) {
			return resource.name;
		}

		if (document.deletedResourceName) {
			return `${document.deletedResourceName} (removed)`;
		}

		return 'Unknown resource';
	}

	/**
	 * Cancels a confirmed reservation that has not started yet
	 * and notifies the owner of the reservation.
	 *
	 * @param {object} reservation The reservation document.
	 * @param {string} cancellationNotice The end of the notification message (e.g., "has been cancelled.")
	 * @returns {Promise<object>} The cancelled reservation document.
	 * @throws {ReservationError} If the reservation is already cancelled or has started.
	 */
	async #cancel(reservation, cancellationNotice) {
		// Check if the reservation has already been cancelled
		if (reservation.status !== ReservationStatus.CONFIRMED) {
			throw new ReservationError(
				'This reservation has already been cancelled.'
			);
		}

		// Check if the reservation has already started
		const period = {
			date: reservation.date,
			startHour: reservation.startHour,
			endHour: reservation.startHour + Reservation.DURATION_HOURS
		};
		if (isPast(period, getCampusDateTime(CONSTANTS.CAMPUS_TIME_ZONE))) {
			throw new ReservationError(
				'This reservation has already started and cannot be cancelled.'
			);
		}

		// Update the reservation status to cancelled
		await this.#dataManager.update({
			collection: CONSTANTS.RESERVATIONS_COLLECTION,
			id: reservation.id,
			updatedFields: {
				status: ReservationStatus.CANCELLED
			}
		});

		// Send cancellation notification to the owner
		const resource = await this.#resourceManager.getResource(
			reservation.resourceId
		);
		const resourceName = this.#getResourceName(resource, reservation);
		await this.#sendNotification(
			reservation.userId,
			`Your reservation for ${resourceName} on ${formatDate(reservation.date)}, ${formatHour(period.startHour)} - ${formatHour(period.endHour)} ${cancellationNotice}`
		);

		return {
			...reservation,
			status: ReservationStatus.CANCELLED
		};
	}

	/**
	 * Cancels a reservation for a student or faculty member.
	 *
	 * @param {User} user The user cancelling the reservation.
	 * @param {string} reservationId The id of the reservation.
	 * @returns {Promise<object>} The cancelled reservation document.
	 * @throws {ReservationError} If cancellation is not allowed.
	 */
	async cancelReservation(user, reservationId) {
		// Only students and faculty members can cancel reservations
		if (!this.canReserve(user)) {
			throw new ReservationError(
				'Only students and faculty members can cancel reservations.'
			);
		}

		// Find the reservation in the database or throw if it doesn't exist
		const reservation = await this.#requireReservation(reservationId);

		// Check if the reservation belongs to the user
		if (reservation.userId !== user.getUserId()) {
			throw new ReservationError(
				'You are not authorized to cancel this reservation.'
			);
		}

		return this.#cancel(reservation, 'has been cancelled.');
	}

	/**
	 * Allows administrators to cancel reservations for other users.
	 *
	 * @param {User} administrator The logged in administrator.
	 * @param {string} reservationId The id of the reservation.
	 * @returns {Promise<object>} The cancelled reservation document.
	 * @throws {ReservationError} If cancellation is not allowed.
	 */
	async cancelReservationForUser(administrator, reservationId) {
		// We check to make 100% sure the user is an admin, since
		// cancelling a reservation is very important
		if (!this.#isAdministrator(administrator)) {
			throw new ReservationError(
				'Only administrators can cancel reservations for other users.'
			);
		}

		// Makes sure the reservation exists
		const reservation = await this.#requireReservation(reservationId);

		// Cancel and send notification to owner
		return this.#cancel(reservation, 'has been cancelled by an administrator.');
	}

	/**
	 * Allows the administrator to cancel all reservations
	 * for the given resource document. This is used
	 * when the administrator deletes a resource.
	 *
	 * The reservations keep the resource name so
	 * the past reservations and notifications can still show its name.
	 *
	 * @param {object} resource The resource document being removed.
	 */
	async cancelReservationsFor(resource) {
		const reservations = await this.#dataManager.load({
			collection: CONSTANTS.RESERVATIONS_COLLECTION,
			filters: [
				{
					field: 'resourceId',
					operator: '==',
					value: resource.id
				}
			]
		});

		const now = getCampusDateTime(CONSTANTS.CAMPUS_TIME_ZONE);
		// Cancel each upcoming reservation 
		for (const reservation of reservations) {
			const period = {
				date: reservation.date,
				startHour: reservation.startHour,
				endHour: reservation.startHour + Reservation.DURATION_HOURS
			};

			// The deleted resource name is included
			// regardless of the reservation date 
			const updatedFields = { deletedResourceName: resource.name };

			const isUpcoming =
				reservation.status === ReservationStatus.CONFIRMED &&
				!isPast(period, now);
			if (isUpcoming) {
				updatedFields.status = ReservationStatus.CANCELLED;
			}

			// Save edits in the database
			await this.#dataManager.update({
				collection: CONSTANTS.RESERVATIONS_COLLECTION,
				id: reservation.id,
				updatedFields
			});

			if (isUpcoming) {
				await this.#sendNotification(
					reservation.userId,
					`Your reservation for ${resource.name} on ${formatDate(period.date)}, ${formatHour(period.startHour)} - ${formatHour(period.endHour)} has been cancelled because the resource was removed.`
				);
			}
		}
	}

	/**
	 * C13: View Reservations - Return my reservations
	 *
	 * Pre-condition: the user is logged in.
	 * Post-condition: the current user's reservations are returned.
	 *
	 * @param {User} user The logged in user.
	 * @returns {Promise<object>} { upcoming, past } (see #toReservationViews)
	 * @throws {ReservationError} If the user is not logged in.
	 */
	async getMyReservations(user) {
		if (!user) {
			throw new ReservationError(
				'You must be logged in to view your reservations.'
			);
		}

		const documents = await this.#dataManager.load({
			collection: CONSTANTS.RESERVATIONS_COLLECTION,
			filters: [{ field: 'userId', operator: '==', value: user.getUserId() }]
		});

		return this.#toReservationViews(documents);
	}

	/**
	 * C13: View Reservations - Return all reservations
	 *
	 * Pre-condition: the user is an administrator.
	 * Post-condition: all reservations are returned.
	 *
	 * @param {User} user The logged in user.
	 * @returns {Promise<object>} { upcoming, past } (see #toReservationViews)
	 * @throws {ReservationError} If the user is not an administrator.
	 */
	async getAllReservations(user) {
		if (!this.#isAdministrator(user)) {
			throw new ReservationError(
				'Only administrators can view all reservations.'
			);
		}

		const documents = await this.#dataManager.load({
			collection: CONSTANTS.RESERVATIONS_COLLECTION
		});

		return this.#toReservationViews(documents);
	}

	/**
	 * Converts reservation documents into plain objects for the browser.
	 *
	 * The reservations are split into upcoming ones (confirmed and not
	 * started yet) and past ones (already started or cancelled).
	 * Upcoming reservations are sorted soonest first, and past
	 * reservations are sorted most recent first.
	 *
	 * @param {object[]} documents The reservation documents from the database.
	 * @returns {Promise<object>} { upcoming, past }, where each reservation
	 * is in the format { id, userId, resourceId, resourceName, building,
	 * room, date, startHour, timeLabel, status }.
	 */
	async #toReservationViews(documents) {
		// Look up each resource only once, even if it was booked many times
		const resourceIds = [
			...new Set(documents.map((document) => document.resourceId))
		];
		const resources = new Map(
			await Promise.all(
				resourceIds.map(async (resourceId) => [
					resourceId,
					await this.#dataManager.load({
						collection: CONSTANTS.RESOURCES_COLLECTION,
						id: resourceId
					})
				])
			)
		);

		const now = getCampusDateTime(CONSTANTS.CAMPUS_TIME_ZONE);
		const upcoming = [];
		const past = [];
		for (const document of documents) {
			const reservation = new Reservation({
				reservationId: document.id,
				userId: document.userId,
				resourceId: document.resourceId,
				date: document.date,
				startHour: document.startHour,
				status: document.status,
				createdAt: document.createdAt
			});

			// The resource may have been deleted after it was booked
			const resource = resources.get(reservation.getResourceId());

			// Plain object so it can be sent to the browser
			const reservationView = {
				id: reservation.getReservationId(),
				userId: reservation.getUserId(),
				resourceId: reservation.getResourceId(),
				resourceName: this.#getResourceName(resource, document),
				building: resource?.building ?? null,
				room: resource?.room ?? null,
				date: reservation.getDate(),
				startHour: reservation.getStartHour(),
				timeLabel: reservation.getTimeLabel(),
				status: reservation.getStatus()
			};

			const period = {
				date: reservation.getDate(),
				startHour: reservation.getStartHour()
			};
			if (reservation.isConfirmed() && !isPast(period, now)) {
				upcoming.push(reservationView);
			} else {
				past.push(reservationView);
			}
		}

		// Sort by date first, then by hour
		const byDateAndHour = (a, b) =>
			a.date.localeCompare(b.date) || a.startHour - b.startHour;
		upcoming.sort(byDateAndHour);
		past.sort((a, b) => byDateAndHour(b, a));

		return { upcoming, past };
	}
}

const reservationManager = new ReservationManager();
export default reservationManager;
