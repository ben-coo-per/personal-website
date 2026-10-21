/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});
}

const STATUS_TZ = 'America/New_York';

/**
 * Compact status timestamp, e.g. "21 oct · 18:30" (year appended when not the current one).
 * Always rendered in New York time so server and client agree.
 */
export function formatStatusTime(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	const parts = Object.fromEntries(
		new Intl.DateTimeFormat('en-GB', {
			timeZone: STATUS_TZ,
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hourCycle: 'h23'
		})
			.formatToParts(d)
			.map((p) => [p.type, p.value])
	);
	const thisYear = new Intl.DateTimeFormat('en-GB', { timeZone: STATUS_TZ, year: 'numeric' }).format(
		new Date()
	);
	const day = `${parts.day} ${parts.month.toLowerCase()}`;
	const year = parts.year === thisYear ? '' : ` ${parts.year}`;
	return `${day}${year} · ${parts.hour}:${parts.minute}`;
}
