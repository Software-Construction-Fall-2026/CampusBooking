import { expect, test } from '@playwright/test';
import { ADMIN, logIn, logOut, signUp } from './helpers.js';

// Signs up then logs in and out
// Also checks that the dashboard shows for each role
test.describe('System Test 1: Authentication and dashboard', () => {
	test('signs up, logs out, and logs back in', async ({ page }) => {
		const email = await signUp(page, 'Ana Lopez');
		await expect(page.getByText('Welcome back, Ana')).toBeVisible();

		await logOut(page);
		await logIn(page, email);

		await expect(page).toHaveURL('/');
		await expect(page.getByText('Welcome back, Ana')).toBeVisible();
	});

	test('rejects an incorrect password', async ({ page }) => {
		await logIn(page, ADMIN.email, 'Admin', 'wrong-password');

		await expect(page.getByText('Incorrect email or password.')).toBeVisible();
		await expect(page).toHaveURL('/auth/login');
	});

	test('each role sees its own dashboard', async ({ browser }) => {
		const student = await browser.newPage();
		const faculty = await browser.newPage();
		const admin = await browser.newPage();

		await signUp(student, 'Sam Student');
		await signUp(faculty, 'Fay Faculty', 'Faculty');
		await logIn(admin, ADMIN.email, 'Admin');
		await expect(admin).toHaveURL('/');

		// The sidebar shows the user's role
		await expect(
			student.locator('aside').getByText(/^student$/i)
		).toBeVisible();
		await expect(
			faculty.locator('aside').getByText(/^faculty$/i)
		).toBeVisible();
		await expect(admin.locator('aside').getByText(/^admin$/i)).toBeVisible();

		// Only students and faculty see reservations on their dashboard
		const upcoming = { name: 'Upcoming reservations' };
		await expect(student.getByRole('heading', upcoming)).toBeVisible();
		await expect(faculty.getByRole('heading', upcoming)).toBeVisible();
		await expect(admin.getByRole('heading', upcoming)).toBeHidden();
	});

	test('protects pages by login and role', async ({ page }) => {
		// Logged out users are sent to the login page
		await page.goto('/');
		await expect(page).toHaveURL('/auth/login');

		// Administrators can't open the student or faculty reservation pages
		await logIn(page, ADMIN.email, 'Admin');
		await expect(page).toHaveURL('/');
		await page.goto('/reservations');
		await expect(
			page.getByText('Only students and faculty members can view reservations.')
		).toBeVisible();

		// Log out of admin acc
		await logOut(page);

		// Student can't access administrator page so they just get redirected
		await signUp(page, 'Fake Admin');
		await page.goto('/administrator');
		await expect(page).toHaveURL('/');
	});
});
