import { writable } from 'svelte/store';

/**
 * @typedef {Object} RouteState
 * @property {{name: string, lat: number, lng: number}} startLocation
 * @property {{name: string, lat: number, lng: number}} endLocation
 * @property {any[]} routes
 * @property {number} selectedRouteIndex
 * @property {boolean} routeFound
 * @property {'road' | 'mtb'} bikeType
 * @property {boolean} isCollapsed
 * @property {number} confidenceScore
 * @property {string} routeDistance
 * @property {number} routeDuration
 * @property {number} avgSpeed
 * @property {boolean} showVibeCheck
 * @property {import('./hazardStore').Hazard[]} hazardsOnRoute
 */

/** @type {import('svelte/store').Writable<RouteState>} */
export const routeState = writable({
    startLocation: { name: "", lat: 0, lng: 0 },
    endLocation: { name: "", lat: 0, lng: 0 },
    routes: [],
    selectedRouteIndex: 0,
    routeFound: false,
    bikeType: 'road',
    isCollapsed: false,
    confidenceScore: 100,
    routeDistance: "0",
    routeDuration: 0,
    avgSpeed: 0,
    showVibeCheck: false,
    hazardsOnRoute: []
});
