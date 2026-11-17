
import { fail, redirect } from '@sveltejs/kit';
import ResourceManager, { ResourceError } from '#lib/server/ResourceManager.js';
import Roles from '#lib/server/auth/Roles.js';
import authenticationManager from '#lib/server/auth/AuthenticationManager.js';

export async function load({ locals }) {
    if (!locals.user) {
        redirect(303, '/auth/login');
    }

    if (!authenticationManager.hasRole(locals.user, Roles.ROLES.ADMINISTRATOR)) {
        redirect(303, '/');
    }

    const resourceManager = new ResourceManager();
    const resources = await resourceManager.getResources();

    return { resources };
}

export const actions = {
    addResource: async ({ request, locals }) => {
        if (!locals.user) {
            return fail(401, { error: 'You must be logged in.' });
        }

        if (!authenticationManager.hasRole(locals.user, Roles.ROLES.ADMINISTRATOR)) {
            return fail(403, { error: 'Only administrators can add resources.' });
        }

        const formData = await request.formData();

        const name = String(formData.get('name') ?? '').trim();
        const type = String(formData.get('type') ?? '').trim();
        const building = String(formData.get('building') ?? '').trim();
        const description = String(formData.get('description') ?? '').trim();
        const room = String(formData.get('room') ?? '').trim();
        const capacityInput = String(formData.get('capacity') ?? '').trim();

        const details = {
            name,
            type,
            building,
            description,
            room,
            availability: formData.get('availability') === 'true'
        };

        if (capacityInput !== '') {
            details.capacity = Number(capacityInput);
        }

        try {
            const resourceManager = new ResourceManager();
            const resourceId = await resourceManager.addResource(locals.user, details);

            return {
                success: true,
                message: 'Resource added successfully!',
                resourceId
            };
        } catch (error) {
            if (error instanceof ResourceError) {
                return fail(400, { error: error.message });
            }

            console.error('Failed to add resource:', error);
            return fail(500, { error: 'Unable to add resource. Please try again.' });
        }
    }
};
