const PROJECT_ID = 'campusbooking-8fa37';
const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;

if (!EMULATOR_HOST) {
	throw new Error(
		'Error: not using the emulator so just use npm run test:integration'
	);
}

// Deletes every document in the emulated firestore for each test
export const clearEmulator = async () => {
	await fetch(
		`http://${EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
		{ method: 'DELETE' }
	);
};