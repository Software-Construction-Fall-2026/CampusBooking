/**
 * Defines pseudo-enums for the
 * different roles in the system.
 *
 *
 * Preferrably, import Roles as an object such as
 *
 * @example
 * import Roles from "path/to/roles"
 *
 * Use it fully qualified, such as
 *
 * @example
 * Roles.SIGNUP_ROLES
 */

/**
 * All roles
 */
const ROLES = Object.freeze({
	STUDENT: 'student',
	FACULTY: 'faculty',
	ADMINISTRATOR: 'admin'
});

// Only students and faculty can sign up
const SIGNUP_ROLES = Object.freeze({
	STUDENT: 'student',
	FACULTY: 'faculty'
});

const isValidSignupRole = (role) => {
	return Object.values(SIGNUP_ROLES).includes(role.toLowerCase().trim());
};

export default {
	ROLES,
	SIGNUP_ROLES,
	isValidSignupRole
};
