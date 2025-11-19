import { writable, get } from 'svelte/store';
import { supabase } from '../supabaseClient';
import { browser } from '$app/environment';

/**
 * @typedef {Object} Hazard
 * @property {string} [id]
 * @property {string} hazard_type
 * @property {number} severity_rating
 * @property {string} location
 * @property {string} [created_at]
 * @property {string} [created_by]
 * @property {boolean} [is_active]
 */

// Initialize from LocalStorage if available
const storedHazards = browser ? JSON.parse(localStorage.getItem('hazards') || '[]') : [];

/** @type {import('svelte/store').Writable<Hazard[]>} */
export const hazards = writable(storedHazards);

// Subscribe to changes and save to LocalStorage
if (browser) {
    hazards.subscribe(value => {
        localStorage.setItem('hazards', JSON.stringify(value));
    });
}

/** @type {import('svelte/store').Writable<Hazard | null>} */
export const selectedHazard = writable(null);

export const fetchHazards = async () => {
    try {
        const { data, error } = await supabase
            .from('hazards')
            .select('*')
            .eq('is_active', true);

        if (error) throw error;
        if (data) {
            hazards.set(data);
        }
    } catch (error) {
        console.warn('Supabase connection failed, falling back to local data:', error);
        // If LocalStorage is empty, seed with mock data
        if (get(hazards).length === 0) {
            hazards.set([
                {
                    id: 'mock-1',
                    hazard_type: 'pothole',
                    severity_rating: 4,
                    location: 'POINT(36.8219 -1.2921)', // Nairobi
                    created_at: new Date().toISOString(),
                    is_active: true
                },
                {
                    id: 'mock-2',
                    hazard_type: 'no_light',
                    severity_rating: 3,
                    location: 'POINT(36.8250 -1.2950)',
                    created_at: new Date().toISOString(),
                    is_active: true
                }
            ]);
        }
    }
};

/**
 * @param {Hazard} hazard
 */
export const addHazard = async (hazard) => {
    // Optimistic update (add to store immediately)
    const tempId = `temp-${Date.now()}`;
    const tempHazard = { ...hazard, id: tempId, created_at: new Date().toISOString(), is_active: true };
    hazards.update(current => [...current, tempHazard]);

    try {
        const { data, error } = await supabase
            .from('hazards')
            .insert([hazard])
            .select();

        if (error) throw error;
        if (data) {
            // Replace temp hazard with real one
            hazards.update(current => current.map(h => h.id === tempId ? data[0] : h));
            return data[0];
        }
    } catch (error) {
        console.warn('Supabase connection failed, keeping local data');
        // We keep the temp hazard in the store (and thus LocalStorage)
        return tempHazard;
    }
    return null;
};

/**
 * @param {string} hazardId
 * @param {string} userId
 * @param {string} voteType
 */
export const voteHazard = async (hazardId, userId, voteType) => {
    // Optimistic update could go here
    const { data, error } = await supabase
        .from('hazard_votes')
        .insert([{ hazard_id: hazardId, user_id: userId, vote_type: voteType }]);

    if (error) {
        console.error('Error voting:', error);
    }
};
