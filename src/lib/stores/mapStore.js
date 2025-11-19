import { writable } from 'svelte/store';

/** @type {import('svelte/store').Writable<any>} */
export const mapInstance = writable(null);
export const userLocation = writable(null);
export const mapCenter = writable({ lat: -1.2921, lng: 36.8219 }); // Default to Nairobi
export const mapZoom = writable(13);
