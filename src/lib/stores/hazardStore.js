import { writable } from 'svelte/store';
import { supabase } from '../supabaseClient';

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

/** @type {import('svelte/store').Writable<Hazard[]>} */
export const hazards = writable([]);

/** @type {import('svelte/store').Writable<Hazard | null>} */
export const selectedHazard = writable(null);

export const fetchHazards = async () => {
    const { data, error } = await supabase
        .from('hazards')
        .select('*')
        .eq('is_active', true);

    if (error) {
        console.error('Error fetching hazards:', error);
    } else if (data) {
        hazards.set(data);
    }
};

/**
 * @param {Hazard} hazard
 */
export const addHazard = async (hazard) => {
    const { data, error } = await supabase
        .from('hazards')
        .insert([hazard])
        .select();

    if (error) {
        console.error('Error adding hazard:', error);
        return null;
    } else if (data) {
        hazards.update(current => [...current, data[0]]);
        return data[0];
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
