// Converts the 24-hour format time to regular time
export const formatHour = (hour) => {
	// Get AM or PM time
	let timeOfDay;
	if (hour % 24 < 12) {
		timeOfDay = 'AM';
	} else {
		timeOfDay = 'PM';
	}

	// Get readable hour
	let displayHour = hour % 12;
	if (displayHour === 0) {
		displayHour = 12;
	}

	return `${displayHour}:00 ${timeOfDay}`;
};

// Gets the date and hour on our campus
// so it doesn't rely on the server's time
export const getCampusDateTime = (campusTimeZone) => {
	const formatter = new Intl.DateTimeFormat('en-CA', {
		timeZone: campusTimeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		hourCycle: 'h23'
	});

	const parts = {};
	for (const part of formatter.formatToParts(new Date())) {
		parts[part.type] = part.value;
	}

	const campusDateTime = {
		date: `${parts.year}-${parts.month}-${parts.day}`,
		hour: Number(parts.hour)
	};
	return campusDateTime;
};

// Check if a period already passed
// the period just needs to have the form { date, startHour }
export const isPast = (period, now) => {
	if (period.date < now.date) {
		return true;
	}
	return period.date === now.date && period.startHour <= now.hour;
};

// Adds a number of days to the date string
// the date should be format like "YYYY-MM-DD"
export const addDays = (date, days) => {
	const result = new Date(`${date}T00:00:00Z`);
	result.setUTCDate(result.getUTCDate() + days);
	return result.toISOString().slice(0, 10);
};

// Just checks that the date matches like "2026-02-31"
// with 4 digits, 2 digits, then 2 digits
export const isValidDateString = (date) => {
	if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		return false;
	}
	const parsed = new Date(`${date}T00:00:00Z`);
	if (Number.isNaN(parsed.getTime())) {
		return false;
	}
	return parsed.toISOString().slice(0, 10) === date;
};

// Formats a string from "YYYY-MM-DD" to a more readable format like
// "Thu, Nov 6, 2026"
export const formatDate = (date) => {
	const [year, month, day] = date.split('-').map(Number);
	return new Date(year, month - 1, day).toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
};

// Makes a "YYYY-MM-DD" string
export const toDateString = (year, month, day) => {
	const paddedMonth = String(month + 1).padStart(2, '0');
	const paddedDay = String(day).padStart(2, '0');
	return `${year}-${paddedMonth}-${paddedDay}`;
};
