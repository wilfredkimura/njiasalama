import { writable } from 'svelte/store';

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
    showVibeCheck: false
});
