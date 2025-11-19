<script>
    import { onMount, onDestroy, createEventDispatcher } from "svelte";
    import { browser } from "$app/environment";
    import { mapInstance, mapCenter, mapZoom } from "../stores/mapStore";
    import { hazards, selectedHazard } from "../stores/hazardStore";
    import HazardIcon from "./HazardIcon.svelte";

    const dispatch = createEventDispatcher();

    /** @type {HTMLElement} */
    let mapElement;
    /** @type {import('leaflet').Map} */
    let map;
    /** @type {import('leaflet').Polyline[]} */
    let routeLayers = [];
    /** @type {import('leaflet').Marker | null} */
    let startMarker = null;
    /** @type {import('leaflet').Marker | null} */
    let endMarker = null;

    // Props for pin dropping
    export let pinDropMode = "none"; // 'none' | 'start' | 'end'
    /** @type {{name: string, lat: number, lng: number} | null} */
    export let startLocation = null;
    /** @type {{name: string, lat: number, lng: number} | null} */
    export let endLocation = null;

    onMount(async () => {
        if (browser) {
            const L = await import("leaflet");
            await import("leaflet/dist/leaflet.css");

            map = L.map(mapElement, {
                zoomControl: false,
                attributionControl: false,
            }).setView([$mapCenter.lat, $mapCenter.lng], $mapZoom);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
                attribution: "© OpenStreetMap",
            }).addTo(map);

            mapInstance.set(map);

            // Handle map clicks for pin dropping
            map.on("click", (/** @type {any} */ e) => {
                if (pinDropMode !== "none") {
                    const { lat, lng } = e.latlng;
                    dispatch("pinDropped", {
                        type: pinDropMode,
                        lat,
                        lng,
                        name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                    });
                }
            });

            // Subscribe to hazards and update markers
            hazards.subscribe((currentHazards) => {
                // Clear existing hazard markers only
                map.eachLayer(
                    (/** @type {import('leaflet').Layer} */ layer) => {
                        // @ts-ignore
                        if (
                            layer instanceof L.Marker &&
                            !layer._isLocationMarker
                        ) {
                            map.removeLayer(layer);
                        }
                    },
                );

                currentHazards.forEach((h) => {
                    // Parse PostGIS point if needed, or assume lat/lng columns
                    // For this mock, let's assume h.location is an object or we parse it
                    // Real implementation needs PostGIS parsing
                    // Mock parsing for demo: "POINT(lng lat)"
                    let lat = -1.2921;
                    let lng = 36.8219;

                    if (
                        typeof h.location === "string" &&
                        h.location.startsWith("POINT")
                    ) {
                        const parts = h.location
                            .replace("POINT(", "")
                            .replace(")", "")
                            .split(" ");
                        lng = parseFloat(parts[0]);
                        lat = parseFloat(parts[1]);
                    } else if (h.location && typeof h.location === "object") {
                        // @ts-ignore
                        lng = h.location.coordinates[0];
                        // @ts-ignore
                        lat = h.location.coordinates[1];
                    }

                    const icon = L.divIcon({
                        html: `<div class="marker-pin"></div>`,
                        className: "custom-div-icon",
                        iconSize: [30, 42],
                        iconAnchor: [15, 42],
                    });

                    const marker = L.marker([lat, lng]).addTo(map);
                    marker.on("click", () => {
                        selectedHazard.set(h);
                    });
                });
            });
        }
    });

    // Update location markers when props change
    $: if (map && browser && startLocation) {
        updateStartMarker();
    }

    $: if (map && browser && endLocation) {
        updateEndMarker();
    }

    async function updateStartMarker() {
        const L = await import("leaflet");

        if (startMarker) {
            map.removeLayer(startMarker);
        }

        if (startLocation && startLocation.lat && startLocation.lng) {
            const icon = L.divIcon({
                html: `<div style="background: #22c55e; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                className: "",
                iconSize: [18, 18],
                iconAnchor: [9, 9],
            });

            startMarker = L.marker([startLocation.lat, startLocation.lng], {
                icon,
                draggable: true,
            }).addTo(map);

            // @ts-ignore
            startMarker._isLocationMarker = true;

            // Handle drag end event
            startMarker.on("dragend", () => {
                if (startMarker) {
                    const pos = startMarker.getLatLng();
                    dispatch("pinDropped", {
                        type: "start",
                        lat: pos.lat,
                        lng: pos.lng,
                        name: `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`,
                    });
                }
            });
        }
    }

    async function updateEndMarker() {
        const L = await import("leaflet");

        if (endMarker) {
            map.removeLayer(endMarker);
        }

        if (endLocation && endLocation.lat && endLocation.lng) {
            const icon = L.divIcon({
                html: `<div style="background: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                className: "",
                iconSize: [18, 18],
                iconAnchor: [9, 9],
            });

            endMarker = L.marker([endLocation.lat, endLocation.lng], {
                icon,
                draggable: true,
            }).addTo(map);

            // @ts-ignore
            endMarker._isLocationMarker = true;

            // Handle drag end event
            endMarker.on("dragend", () => {
                if (endMarker) {
                    const pos = endMarker.getLatLng();
                    dispatch("pinDropped", {
                        type: "end",
                        lat: pos.lat,
                        lng: pos.lng,
                        name: `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`,
                    });
                }
            });
        }
    }

    /**
     * @param {Array<{coordinates: number[][], id: number}>} routes
     * @param {number} activeIndex
     */
    export function drawRoutes(routes, activeIndex = 0) {
        if (!map || !browser) return;

        import("leaflet").then((L) => {
            // Clear existing route polylines
            routeLayers.forEach((layer) => map.removeLayer(layer));
            routeLayers = [];

            routes.forEach((route, index) => {
                const isActive = index === activeIndex;
                const color = isActive ? "#2563eb" : "#9ca3af"; // blue-600 : gray-400
                const opacity = isActive ? 0.9 : 0.6;
                const weight = isActive ? 6 : 5;

                const polyline = L.polyline(route.coordinates, {
                    color: color,
                    weight: weight,
                    opacity: opacity,
                    lineCap: "round",
                    lineJoin: "round",
                }).addTo(map);

                // Add interaction
                polyline.on("click", () => {
                    dispatch("routeSelected", { index });
                });

                if (isActive) {
                    polyline.bringToFront();
                    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
                }

                routeLayers.push(polyline);
            });
        });
    }

    onDestroy(() => {
        if (map) {
            map.remove();
        }
    });
</script>

<div bind:this={mapElement} class="w-full h-full z-0"></div>

<style>
    :global(.leaflet-container) {
        background: #f8f9fa;
    }
</style>
