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

/**
 * A project's year for display: "2024", or "2024–Present" while it is ongoing.
 */
export function projectYear(p: { date?: Date; ongoing?: boolean }): string {
	const year = p.date ? String(p.date.getFullYear()) : '';
	return year && p.ongoing ? `${year}–Present` : year;
}
