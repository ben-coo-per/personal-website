import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { verifyPasscode } from '$lib/utils/content';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { passcode } = await request.json();

		if (!passcode) {
			return json({ valid: false, error: 'Passcode required' }, { status: 400 });
		}

		const isValid = verifyPasscode(passcode);

		return json({ valid: isValid });
	} catch (error) {
		console.error('Error verifying passcode:', error);
		return json({ valid: false, error: 'Server error' }, { status: 500 });
	}
};
