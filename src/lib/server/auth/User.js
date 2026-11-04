/**
 * Represents a person who can log in to the
 * system (student, faculty, or administrator).
 *
 * It is implemented according to the SDD Report,
 * specifically with Contract 3: Provide User Information.
 */
export default class User {
	#userId;
	#email;
	#name;
	#role;
	#passwordHash;

	constructor({ userId, email, name, role, passwordHash }) {
		this.#userId = userId;
		this.#email = email;
		this.#name = name;
		this.#role = role;
		this.#passwordHash = passwordHash;
	}

	// Converts the user to a plain object
	// that can be uploaded to the database
	toDocument() {
		return {
			id: this.#userId,
			email: this.#email,
			name: this.#name,
			role: this.#role,
			passwordHash: this.#passwordHash
		};
	}

	getUserId() {
		return this.#userId;
	}

	getEmail() {
		return this.#email;
	}

	getName() {
		return this.#name;
	}

	getRole() {
		return this.#role;
	}

	getPasswordHash() {
		return this.#passwordHash;
	}
}
