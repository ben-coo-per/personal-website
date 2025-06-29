import { json } from '@sveltejs/kit';

export const POST = async ({ cookies }) => {
	cookies.set('restrictedAccess', 'true', {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 60 * 24 // 1 day
	});
	return json({ success: true });
};
