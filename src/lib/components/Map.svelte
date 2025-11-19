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
    /** @type {import('leaflet').Marker | null} */
    let hazardMarker = null;
    /** @type {import('svelte/store').Unsubscriber} */
    let unsubscribeHazards;

    // Props for pin dropping
    export let pinDropMode = "none"; // 'none' | 'start' | 'end' | 'hazard'
    /** @type {{name: string, lat: number, lng: number} | null} */
    export let startLocation = null;
    /** @type {{name: string, lat: number, lng: number} | null} */
    export let endLocation = null;
    /** @type {{lat: number, lng: number} | null} */
    export let hazardLocation = null;

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

            // Get user location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        // Only set view if no route is being displayed
                        if (routeLayers.length === 0) {
                            map.setView([latitude, longitude], 15);
                        }

                        // Add user location marker
                        const userIcon = L.divIcon({
                            html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                            className: "",
                            iconSize: [16, 16],
                            iconAnchor: [8, 8],
                        });

                        L.marker([latitude, longitude], {
                            icon: userIcon,
                        }).addTo(map);
                    },
                    (error) => {
                        console.warn("Geolocation failed:", error);
                    },
                );
            }

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
            unsubscribeHazards = hazards.subscribe((currentHazards) => {
                if (!map) return;

                // Clear existing hazard markers only
                map.eachLayer(
                    (/** @type {import('leaflet').Layer} */ layer) => {
                        // @ts-ignore
                        if (
                            layer instanceof L.Marker &&
                            !layer._isLocationMarker &&
                            // @ts-ignore
                            !layer._isUserLocation // Don't remove user marker
                        ) {
                            map.removeLayer(layer);
                        }
                    },
                );

                currentHazards.forEach((h) => {
                    let lat, lng;
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

                    if (!isNaN(lat) && !isNaN(lng)) {
                        const icon = L.divIcon({
                            html: `<div style="background-color: #f97316; width: 100%; height: 100%; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                            className: "",
                            iconSize: [12, 12],
                            iconAnchor: [6, 6],
                        });

                        const marker = L.marker([lat, lng], { icon }).addTo(
                            map,
                        );
                        marker.on("click", () => {
                            selectedHazard.set(h);
                        });
                    }
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

    $: if (map && browser && hazardLocation) {
        updateHazardMarker();
    }

    async function updateStartMarker() {
        const L = await import("leaflet");

        if (startLocation && startLocation.lat && startLocation.lng) {
            if (startMarker) {
                // Update existing marker position
                const curPos = startMarker.getLatLng();
                // Only update if position is different (to avoid interfering with drag)
                if (
                    curPos.lat !== startLocation.lat ||
                    curPos.lng !== startLocation.lng
                ) {
                    startMarker.setLatLng([
                        startLocation.lat,
                        startLocation.lng,
                    ]);
                }
            } else {
                // Create new marker
                const icon = L.divIcon({
                    html: `<div style="background: #22c55e; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.4); cursor: grab;"></div>`,
                    className: "",
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                });

                startMarker = L.marker([startLocation.lat, startLocation.lng], {
                    icon,
                    draggable: true,
                    zIndexOffset: 1000,
                }).addTo(map);

                // @ts-ignore
                startMarker._isLocationMarker = true;

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
        } else if (startMarker) {
            map.removeLayer(startMarker);
            startMarker = null;
        }
    }

    async function updateEndMarker() {
        const L = await import("leaflet");

        if (endLocation && endLocation.lat && endLocation.lng) {
            if (endMarker) {
                // Update existing marker position
                const curPos = endMarker.getLatLng();
                if (
                    curPos.lat !== endLocation.lat ||
                    curPos.lng !== endLocation.lng
                ) {
                    endMarker.setLatLng([endLocation.lat, endLocation.lng]);
                }
            } else {
                // Create new marker
                const icon = L.divIcon({
                    html: `<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.4); cursor: grab;"></div>`,
                    className: "",
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                });

                endMarker = L.marker([endLocation.lat, endLocation.lng], {
                    icon,
                    draggable: true,
                    zIndexOffset: 1000,
                }).addTo(map);

                // @ts-ignore
                endMarker._isLocationMarker = true;

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
        } else if (endMarker) {
            map.removeLayer(endMarker);
            endMarker = null;
        }
    }

    async function updateHazardMarker() {
        const L = await import("leaflet");

        if (hazardLocation && hazardLocation.lat && hazardLocation.lng) {
            if (hazardMarker) {
                const curPos = hazardMarker.getLatLng();
                if (
                    curPos.lat !== hazardLocation.lat ||
                    curPos.lng !== hazardLocation.lng
                ) {
                    hazardMarker.setLatLng([
                        hazardLocation.lat,
                        hazardLocation.lng,
                    ]);
                }
            } else {
                const icon = L.divIcon({
                    html: `<div style="background: #f97316; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.4); cursor: grab;"></div>`,
                    className: "",
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                });

                hazardMarker = L.marker(
                    [hazardLocation.lat, hazardLocation.lng],
                    {
                        icon,
                        draggable: true,
                        zIndexOffset: 1000,
                    },
                ).addTo(map);

                // @ts-ignore
                hazardMarker._isLocationMarker = true;

                hazardMarker.on("dragend", () => {
                    if (hazardMarker) {
                        const pos = hazardMarker.getLatLng();
                        dispatch("pinDropped", {
                            type: "hazard",
                            lat: pos.lat,
                            lng: pos.lng,
                            name: `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`,
                        });
                    }
                });
            }
        } else if (hazardMarker) {
            map.removeLayer(hazardMarker);
            hazardMarker = null;
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
                const color = isActive ? "#2563eb" : "#4b5563"; // blue-600 : gray-600 (darker)
                const opacity = isActive ? 0.9 : 0.7;
                const weight = isActive ? 6 : 5;
                const zIndex = isActive ? 1000 : 500;

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
                } else {
                    polyline.bringToBack();
                }

                routeLayers.push(polyline);
            });
        });
    }

    onDestroy(() => {
        if (unsubscribeHazards) unsubscribeHazards();
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
