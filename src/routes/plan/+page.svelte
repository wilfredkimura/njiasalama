<script>
    import Map from "$lib/components/Map.svelte";
    import VibeCheckPrompt from "$lib/components/VibeCheckPrompt.svelte";
    import LocationInput from "$lib/components/LocationInput.svelte";
    import WeatherWidget from "$lib/components/WeatherWidget.svelte";
    import { onMount } from "svelte";
    import { mapInstance } from "$lib/stores/mapStore";
    import { hazards } from "$lib/stores/hazardStore";
    import { routeState } from "$lib/stores/routeStore";
    import { get } from "svelte/store";

    /** @type {Map} */
    let mapComponent;
    let pinDropMode = "none"; // 'none' | 'start' | 'end'
    import UserMenu from "$lib/components/UserMenu.svelte";

    /**
     * @param {any} updates
     */
    function updateStore(updates) {
        routeState.update((s) => ({ ...s, ...updates }));
    }

    /**
     * @param {CustomEvent} e
     * @param {'start' | 'end'} type
     */
    function handleSelect(e, type) {
        const val = e.detail;
        if (type === "start") {
            updateStore({
                startLocation: { ...$routeState.startLocation, ...val },
            });
        } else {
            updateStore({
                endLocation: { ...$routeState.endLocation, ...val },
            });
        }
    }

    async function planRoute() {
        const { startLocation, endLocation, bikeType } = $routeState;

        if (startLocation.name && endLocation.name) {
            try {
                const response = await fetch(
                    `https://router.project-osrm.org/route/v1/bike/${startLocation.lng},${startLocation.lat};${endLocation.lng},${endLocation.lat}?overview=full&geometries=geojson&alternatives=3`,
                );
                const data = await response.json();

                if (data.routes && data.routes.length > 0) {
                    const processedRoutes = data.routes.map(
                        (/** @type {any} */ r, /** @type {number} */ i) => ({
                            id: i,
                            coordinates: r.geometry.coordinates.map(
                                (/** @type {number[]} */ c) => [c[1], c[0]],
                            ), // [lat, lng]
                            distance: r.distance,
                            duration: r.duration,
                        }),
                    );

                    updateStore({
                        routes: processedRoutes,
                        routeFound: true,
                        isCollapsed: true,
                        showVibeCheck: true,
                    });

                    selectRoute(0, processedRoutes);
                }
            } catch (error) {
                console.error("Error fetching route:", error);
            }
        }
    }

    let lastPlannedStart = { lat: 0, lng: 0 };
    let lastPlannedEnd = { lat: 0, lng: 0 };

    $: if (
        $routeState.startLocation.lat &&
        $routeState.startLocation.lng &&
        $routeState.endLocation.lat &&
        $routeState.endLocation.lng
    ) {
        const startChanged =
            Math.abs($routeState.startLocation.lat - lastPlannedStart.lat) >
                0.000001 ||
            Math.abs($routeState.startLocation.lng - lastPlannedStart.lng) >
                0.000001;
        const endChanged =
            Math.abs($routeState.endLocation.lat - lastPlannedEnd.lat) >
                0.000001 ||
            Math.abs($routeState.endLocation.lng - lastPlannedEnd.lng) >
                0.000001;

        if (startChanged || endChanged) {
            lastPlannedStart = {
                lat: $routeState.startLocation.lat,
                lng: $routeState.startLocation.lng,
            };
            lastPlannedEnd = {
                lat: $routeState.endLocation.lat,
                lng: $routeState.endLocation.lng,
            };
            planRoute();
        }
    }

    /**
     * @param {number} index
     * @param {any[]} [routesOverride]
     */
    function selectRoute(index, routesOverride) {
        const routes = routesOverride || $routeState.routes;
        const selectedRoute = routes[index];

        if (selectedRoute) {
            const speedKmh = $routeState.bikeType === "road" ? 25 : 18;
            const distanceKm = selectedRoute.distance / 1000;
            const durationMin = Math.round((distanceKm / speedKmh) * 60);

            const analysis = analyzeRouteHazards(selectedRoute);

            updateStore({
                selectedRouteIndex: index,
                routeDistance: (selectedRoute.distance / 1000).toFixed(1),
                routeDuration: durationMin,
                avgSpeed: speedKmh,
                confidenceScore: analysis.score,
                hazardsOnRoute: analysis.hazards,
            });

            if (mapComponent) {
                mapComponent.drawRoutes(routes, index);
            }
        }
    }

    /**
     * @param {CustomEvent} e
     */
    function handleRouteSelected(e) {
        selectRoute(e.detail.index);
    }

    /**
     * @param {CustomEvent} e
     */
    function handlePinDropped(e) {
        const { type, lat, lng, name } = e.detail;
        if (type === "start") {
            updateStore({
                startLocation: {
                    name,
                    lat,
                    lng,
                },
            });
            pinDropMode = "none";
        } else if (type === "end") {
            updateStore({
                endLocation: {
                    name,
                    lat,
                    lng,
                },
            });
            pinDropMode = "none";
        }
    }

    /**
     * @param {{parsedLat: number, parsedLng: number}} h
     */
    function focusHazard(h) {
        if (h.parsedLat && h.parsedLng && $mapInstance) {
            $mapInstance.flyTo([h.parsedLat, h.parsedLng], 18, {
                animate: true,
                duration: 1.5,
            });
        }
    }

    /**
     * @param {{coordinates: number[][]}} route
     */
    function analyzeRouteHazards(route) {
        let hazardScore = 0;
        const currentHazards = get(hazards);
        const routeCoords = route.coordinates;
        /** @type {any[]} */
        const detectedHazards = [];

        currentHazards.forEach((h) => {
            let hLat = 0,
                hLng = 0;
            if (
                typeof h.location === "string" &&
                h.location.startsWith("POINT")
            ) {
                const parts = h.location
                    .replace("POINT(", "")
                    .replace(")", "")
                    .split(" ");
                hLng = parseFloat(parts[0]);
                hLat = parseFloat(parts[1]);
            } else if (h.location && typeof h.location === "object") {
                // @ts-ignore
                hLng = h.location.coordinates[0];
                // @ts-ignore
                hLat = h.location.coordinates[1];
            }

            const isNear = routeCoords.some(([rLat, rLng]) => {
                return (
                    Math.abs(rLat - hLat) < 0.0005 &&
                    Math.abs(rLng - hLng) < 0.0005
                );
            });

            if (isNear) {
                hazardScore += (h.severity_rating || 1) * 5;
                // @ts-ignore
                detectedHazards.push({
                    ...h,
                    parsedLat: hLat,
                    parsedLng: hLng,
                });
            }
        });

        return {
            score: Math.max(0, 100 - hazardScore),
            hazards: detectedHazards,
        };
    }

    onMount(() => {
        if ($routeState.routeFound && $routeState.routes.length > 0) {
            setTimeout(() => {
                if (mapComponent) {
                    mapComponent.drawRoutes(
                        $routeState.routes,
                        $routeState.selectedRouteIndex,
                    );
                }
            }, 100);
        }
    });
</script>

<div class="w-full h-screen relative">
    <Map
        bind:this={mapComponent}
        on:routeSelected={handleRouteSelected}
        on:pinDropped={handlePinDropped}
        {pinDropMode}
        startLocation={$routeState.startLocation}
        endLocation={$routeState.endLocation}
    />

    {#if !$routeState.isCollapsed}
        <div
            class="fixed top-4 left-4 right-4 bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-lg z-[500] transition-all duration-300 ease-in-out max-h-[90vh] overflow-y-auto border border-white/40"
        >
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                    <a
                        href="/"
                        class="p-2 hover:bg-black/5 rounded-full transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-6 h-6"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                            />
                        </svg>
                    </a>
                    <h1 class="font-bold text-xl">Plan Ride</h1>
                </div>
                <div class="flex items-center gap-2">
                    <UserMenu />
                    {#if $routeState.routeFound}
                        <button
                            on:click={() => updateStore({ isCollapsed: true })}
                            class="p-2 hover:bg-black/5 rounded-full text-gray-500 transition-colors"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                class="w-6 h-6"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M4.5 15.75l7.5-7.5 7.5 7.5"
                                />
                            </svg>
                        </button>
                    {/if}
                </div>
            </div>

            <div class="space-y-3">
                <!-- Bike Type Selector -->
                <div class="flex bg-gray-100 p-1 rounded-xl mb-2">
                    <button
                        class={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${$routeState.bikeType === "road" ? "bg-white shadow-sm text-black" : "text-gray-500"}`}
                        on:click={() => {
                            updateStore({ bikeType: "road" });
                            if ($routeState.routeFound)
                                selectRoute($routeState.selectedRouteIndex);
                        }}
                    >
                        Road Bike
                    </button>
                    <button
                        class={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${$routeState.bikeType === "mtb" ? "bg-white shadow-sm text-black" : "text-gray-500"}`}
                        on:click={() => {
                            updateStore({ bikeType: "mtb" });
                            if ($routeState.routeFound)
                                selectRoute($routeState.selectedRouteIndex);
                        }}
                    >
                        Mountain Bike
                    </button>
                </div>

                <div class="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                    <div
                        class="w-3 h-3 rounded-full bg-green-500 shrink-0"
                    ></div>
                    <LocationInput
                        placeholder="Start Location (or lat,lng)"
                        bind:value={$routeState.startLocation.name}
                        on:select={(e) => handleSelect(e, "start")}
                    />
                    <button
                        on:click={() =>
                            (pinDropMode =
                                pinDropMode === "start" ? "none" : "start")}
                        class={`p-2 rounded-lg transition-colors shrink-0 ${pinDropMode === "start" ? "bg-green-500 text-white" : "bg-white hover:bg-gray-100"}`}
                        title="Drop pin on map"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-5 h-5"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                            />
                        </svg>
                    </button>
                </div>
                <div class="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                    <div class="w-3 h-3 rounded-full bg-red-500 shrink-0"></div>
                    <LocationInput
                        placeholder="End Location (or lat,lng)"
                        bind:value={$routeState.endLocation.name}
                        on:select={(e) => handleSelect(e, "end")}
                    />
                    <button
                        on:click={() =>
                            (pinDropMode =
                                pinDropMode === "end" ? "none" : "end")}
                        class={`p-2 rounded-lg transition-colors shrink-0 ${pinDropMode === "end" ? "bg-red-500 text-white" : "bg-white hover:bg-gray-100"}`}
                        title="Drop pin on map"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-5 h-5"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                            />
                        </svg>
                    </button>
                </div>

                {#if $routeState.startLocation.lat && $routeState.startLocation.lng}
                    <div class="mt-2">
                        <h3
                            class="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider"
                        >
                            Start Weather
                        </h3>
                        <WeatherWidget
                            lat={$routeState.startLocation.lat}
                            lng={$routeState.startLocation.lng}
                        />
                    </div>
                {/if}

                {#if $routeState.endLocation.lat && $routeState.endLocation.lng}
                    <div class="mt-2">
                        <h3
                            class="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider"
                        >
                            Destination Weather
                        </h3>
                        <WeatherWidget
                            lat={$routeState.endLocation.lat}
                            lng={$routeState.endLocation.lng}
                        />
                    </div>
                {/if}

                <button
                    on:click={planRoute}
                    class="w-full bg-black text-white py-4 rounded-xl font-bold text-lg mt-4 shadow-lg active:scale-95 transition-transform"
                >
                    {$routeState.routeFound ? "Update Route" : "Find Safe Path"}
                </button>

                {#if $routeState.routeFound}
                    <div
                        class="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100"
                    >
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-gray-500 text-sm">Distance</span>
                            <span class="font-bold"
                                >{$routeState.routeDistance} km</span
                            >
                        </div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-gray-500 text-sm">Est. Time</span>
                            <span class="font-bold"
                                >{$routeState.routeDuration} min</span
                            >
                        </div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-gray-500 text-sm">Est. Speed</span
                            >
                            <span class="font-bold"
                                >{$routeState.avgSpeed || 0} km/h</span
                            >
                        </div>
                        <div
                            class="flex justify-between items-center pt-2 border-t border-gray-200"
                        >
                            <span class="text-gray-500 text-sm"
                                >Safety Score</span
                            >
                            <span
                                class={`font-bold ${$routeState.confidenceScore > 80 ? "text-green-600" : $routeState.confidenceScore > 50 ? "text-yellow-600" : "text-red-600"}`}
                            >
                                {$routeState.confidenceScore}%
                            </span>
                        </div>
                        <p class="text-xs text-gray-400 mt-2 text-center">
                            {$routeState.confidenceScore > 80
                                ? "Route looks clear!"
                                : "Hazards detected. Ride with caution."}
                        </p>

                        {#if $routeState.hazardsOnRoute && $routeState.hazardsOnRoute.length > 0}
                            <details class="mt-3 group">
                                <summary
                                    class="flex justify-between items-center cursor-pointer text-sm font-medium text-orange-600 list-none bg-orange-50 p-2 rounded-lg hover:bg-orange-100 transition-colors"
                                >
                                    <div class="flex items-center gap-2">
                                        <span>⚠️</span>
                                        <span
                                            >{$routeState.hazardsOnRoute.length}
                                            Hazards Detected</span
                                        >
                                    </div>
                                    <span
                                        class="transition-transform group-open:rotate-180 text-xs"
                                        >▼</span
                                    >
                                </summary>
                                <div
                                    class="mt-2 space-y-2 pl-2 max-h-40 overflow-y-auto"
                                >
                                    {#each $routeState.hazardsOnRoute as h}
                                        <button
                                            class="w-full text-left text-xs text-gray-600 flex items-center justify-between p-1 border-b border-gray-100 last:border-0 hover:bg-orange-50 cursor-pointer transition-colors"
                                            on:click={() =>
                                                focusHazard(
                                                    /** @type {any} */ (h),
                                                )}
                                        >
                                            <span class="font-bold capitalize"
                                                >{h.hazard_type.replace(
                                                    "_",
                                                    " ",
                                                )}</span
                                            >
                                            <span
                                                class="text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full"
                                                >Sev: {h.severity_rating}/5</span
                                            >
                                        </button>
                                    {/each}
                                </div>
                            </details>
                        {/if}
                        {#if $routeState.routes.length > 1}
                            <p
                                class="text-xs text-blue-500 mt-2 text-center font-medium"
                            >
                                {$routeState.routes.length} routes found. Tap map
                                to switch.
                            </p>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
    {:else}
        <!-- Collapsed View -->
        <div
            class="fixed top-4 left-4 right-4 bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-lg z-[500] flex items-center justify-between cursor-pointer border border-white/40"
            role="button"
            tabindex="0"
            on:click={() => updateStore({ isCollapsed: false })}
            on:keydown={(e) =>
                e.key === "Enter" && updateStore({ isCollapsed: false })}
        >
            <div class="flex flex-col overflow-hidden mr-4">
                <div class="flex items-center gap-2 text-sm font-bold truncate">
                    <span class="truncate"
                        >{$routeState.startLocation.name.split(",")[0]}</span
                    >
                    <span class="text-gray-400">→</span>
                    <span class="truncate"
                        >{$routeState.endLocation.name.split(",")[0]}</span
                    >
                </div>
                <div class="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span>{$routeState.routeDistance} km</span>
                    <span>•</span>
                    <span>{$routeState.routeDuration} min</span>
                    <span>•</span>
                    <span
                        class={`${$routeState.confidenceScore > 80 ? "text-green-600" : $routeState.confidenceScore > 50 ? "text-yellow-600" : "text-red-600"} font-bold`}
                    >
                        {$routeState.confidenceScore}% Safe
                    </span>
                </div>
            </div>
            <button
                class="p-2 hover:bg-gray-100 rounded-full text-gray-500 shrink-0"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-6 h-6"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                </svg>
            </button>
        </div>
    {/if}

    {#if $routeState.showVibeCheck}
        <VibeCheckPrompt routeId="mock-route-id" />
    {/if}
</div>
