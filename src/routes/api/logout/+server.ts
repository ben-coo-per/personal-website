import { json } from '@sveltejs/kit';

export const POST = async ({ cookies }) => {
	cookies.set('restrictedAccess', '', { path: '/', maxAge: 0 });
	return json({ success: true });
};
