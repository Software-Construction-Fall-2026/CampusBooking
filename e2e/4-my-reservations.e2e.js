import { expect, test } from '@playwright/test';
import { book, open, signUp } from './helpers.js';

// View my reservations and cancel reservation
test('System Test 4: views and cancels my reservation', async ({ browser }) => {
	const carla = await browser.newPage();
	const dan = await browser.newPage();
	await signUp(carla, 'Carla Student');
	await signUp(dan, 'Dan Student');

	await book(carla, 'room-202', '11:00 AM');
	await book(dan, 'room-202', '1:00 PM');

	// The user carla only sees their reservation and not the one dan made
	await open(carla, '/reservations');
	await expect(carla.locator('article')).toHaveCount(1);
	await expect(carla.getByText('11:00 AM - 12:00 PM')).toBeVisible();

	// Cancel carla reservation
	carla.once('dialog', (dialog) => dialog.accept());
	await carla.getByRole('button', { name: 'Cancel', exact: true }).click();
	await expect(carla.getByText('Cancelled', { exact: true })).toBeVisible();

	await open(carla, '/notifications');
	await expect(
		carla.getByText(/Room 202 .* has been cancelled\./)
	).toBeVisible();

	// Now dan can book it since carla cancelled
	await book(dan, 'room-202', '11:00 AM');
});
