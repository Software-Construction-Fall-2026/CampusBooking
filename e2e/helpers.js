import { expect } from '@playwright/test';
import { addDays, getCampusDateTime } from '#lib/utils/datetime.js';

export const PASSWORD = 'secret123';

export const ADMIN = {
	id: 'admin-1',
	email: 'admin@utep.edu',
	name: 'Ada Admin',
	password: PASSWORD
};

export const RESOURCES = [
	{
		id: 'room-101',
		name: 'Room 101',
		type: 'Classroom',
		building: 'CCSB'
	},
	{
		id: 'room-202',
		name: 'Room 202',
		type: 'Classroom',
		building: 'Library'
	},
	{
		id: 'projector-1',
		name: 'Projector',
		type: 'Equipment',
		building: 'Library'
	}
];

// Strings because they are used to fill a form
// Also availability here is a text not a boolean for the same form reason
export const ADMIN_RESOURCE = {
	id: 'room-303',
	name: 'Room 303',
	type: 'Classroom',
	building: 'CCSB',
	room: '303',
	capacity: '45',
	availability: 'Available',
	description: 'CS collaboration room'
};

export const TOMORROW = addDays(getCampusDateTime('America/Denver').date, 1);

// Opens a page and waits for it to finish loading
export const open = async (page, url) => {
	await page.goto(url);
	await page.waitForLoadState('networkidle');
};

// Signs up a new user with a unique email and returns the email
export const signUp = async (page, name, role = 'Student') => {
	const email = `${name.replace(' ', '.').toLowerCase()}.${Date.now()}@miners.utep.edu`;
	await open(page, '/auth/signup');
	await page.locator(`label[for="role-${role}"]`).click();
	await page.getByLabel('Full name').fill(name);
	await page.getByLabel('Email address').fill(email);
	await page.getByLabel('Password').fill(PASSWORD);
	await page.getByRole('button', { name: `Sign up as ${role}` }).click();
	await expect(page).toHaveURL('/');
	return email;
};

export const logIn = async (
	page,
	email,
	role = 'Student',
	password = PASSWORD
) => {
	await open(page, '/auth/login');
	await page.locator(`label[for="role-${role}"]`).click();
	await page.getByLabel('Email address').fill(email);
	await page.getByLabel('Password').fill(password);
	await page.getByRole('button', { name: `Log in as ${role}` }).click();
};

export const logOut = async (page) => {
	await page.getByRole('button', { name: 'Log out' }).click();
	await expect(page).toHaveURL('/auth/login');
};

// The time slot buttons are in the format like "10:00AM-11:00AM"
export const slot = (page, time) => {
	return page.getByRole('button', { name: new RegExp(`^${time}-`) });
};

// Books one slot of a resource for tomorrow
export const book = async (page, resourceId, time) => {
	await open(page, `/resources/${resourceId}/reserve?date=${TOMORROW}`);
	await slot(page, time).click();
	await page.getByRole('button', { name: 'Confirm reservation' }).click();
	await expect(page.getByText('Reservation confirmed')).toBeVisible();
};
