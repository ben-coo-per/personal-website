import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { client } from '$lib/utils/sanity';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { passcode } = await request.json();

		if (!passcode) {
			return json({ valid: false, error: 'Passcode required' }, { status: 400 });
		}

		// Query Sanity for valid passcodes
		const validPasscodes = await client.fetch(
			`
			*[_type == "passcode" && 
			  code == $passcode && 
			  isActive == true && 
			  expiresAt > now()
			]
		`,
			{ passcode }
		);

		const isValid = validPasscodes.length > 0;

		return json({ valid: isValid });
	} catch (error) {
		console.error('Error verifying passcode:', error);
		return json({ valid: false, error: 'Server error' }, { status: 500 });
	}
};
