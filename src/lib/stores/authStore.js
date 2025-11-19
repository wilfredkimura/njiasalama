import { writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';

/**
 * @typedef {import('@supabase/supabase-js').User} User
 * @typedef {import('@supabase/supabase-js').AuthError} AuthError
 */

/** @type {import('svelte/store').Writable<User|null>} */
export const user = writable(null);

/** @type {import('svelte/store').Writable<{loading: boolean, error: AuthError|null|string}>} */
export const authState = writable({
    loading: true,
    error: null
});

export const checkSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (session) {
        user.set(session.user);
    } else {
        user.set(null);
    }
    authState.update(s => ({ ...s, loading: false, error }));
};

export const signOut = async () => {
    await supabase.auth.signOut();
    user.set(null);
};
