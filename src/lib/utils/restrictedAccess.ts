// utility function for the restricted access feature

export function hasRestrictedAccess() {
	// Check if the session storage has the restricted access flag set
	return sessionStorage.getItem('restrictedAccess') === 'true';
}

export function clearRestrictedAccess() {
	// Clear the restricted access flag from session storage
	sessionStorage.removeItem('restrictedAccess');
}

export function setRestrictedAccess() {
	// Set the restricted access flag in session storage
	sessionStorage.setItem('restrictedAccess', 'true');
}
