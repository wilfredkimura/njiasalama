<script>
    import Map from "$lib/components/Map.svelte";
    import UserMenu from "$lib/components/UserMenu.svelte";
    import { onMount } from "svelte";
    import { fly, fade, slide } from "svelte/transition";
    import { browser } from "$app/environment";
    import { hazards, selectedHazard } from "$lib/stores/hazardStore";

    let showWelcome = true; // Show by default
    let showHazardList = true; // Show hazard list by default
    /** @type {{lat: number, lng: number} | null} */
    let userLocation = null;
    /** @type {any[]} */
    let nearbyHazards = [];

    /**
     * Calculate distance between two points using Haversine formula
     * @param {number} lat1
     * @param {number} lon1
     * @param {number} lat2
     * @param {number} lon2
     * @returns {number} Distance in kilometers
     */
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Parse PostGIS POINT format
     * @param {string | any} location
     * @returns {{lat: number, lng: number} | null}
     */
    function parseLocation(location) {
        if (!location || typeof location !== "string") return null;
        const match = location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
        if (match) {
            return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
        }
        return null;
    }

    function getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    console.log("User location obtained:", userLocation);
                    filterNearbyHazards();
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    // Set a default location (Nairobi CBD) if geolocation fails
                    userLocation = {
                        lat: -1.2864,
                        lng: 36.8172,
                    };
                    console.log(
                        "Using default location (Nairobi CBD):",
                        userLocation,
                    );
                    filterNearbyHazards();
                },
            );
        } else {
            console.warn("Geolocation not supported, using default location");
            // Set default location if geolocation is not supported
            userLocation = {
                lat: -1.2864,
                lng: 36.8172,
            };
            filterNearbyHazards();
        }
    }

    function filterNearbyHazards() {
        if (!userLocation) {
            console.warn("Cannot filter hazards: userLocation is null");
            return;
        }

        if (!$hazards || $hazards.length === 0) {
            console.warn("Cannot filter hazards: no hazards available");
            nearbyHazards = [];
            return;
        }

        console.log(
            `Filtering ${$hazards.length} hazards for location:`,
            userLocation,
        );

        nearbyHazards = $hazards
            .map((h) => {
                const loc = parseLocation(h.location);
                if (!loc) {
                    console.warn("Could not parse location for hazard:", h.id);
                    return null;
                }

                const distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    loc.lat,
                    loc.lng,
                );

                return {
                    ...h,
                    distance: distance,
                    parsedLocation: loc,
                };
            })
            .filter((h) => h && h.distance <= 100) // Within 100km
            .sort((a, b) => (a?.distance || 0) - (b?.distance || 0)); // Sort by distance

        console.log(`Found ${nearbyHazards.length} hazards within 100km`);
    }

    $: if ($hazards && userLocation) {
        console.log("Reactive update triggered - hazards or location changed");
        filterNearbyHazards();
    }

    onMount(() => {
        // Only hide if user has permanently dismissed it
        const permanentlyDismissed =
            browser && localStorage.getItem("welcomeDismissed") === "permanent";
        if (permanentlyDismissed) {
            showWelcome = false;
        }

        // Get user location for hazard filtering
        getUserLocation();
    });

    function closeWelcomeTemporary() {
        showWelcome = false;
        // Don't save to localStorage - will show again on next reload
    }

    function closeWelcomePermanent() {
        showWelcome = false;
        if (browser) {
            localStorage.setItem("welcomeDismissed", "permanent");
        }
    }

    /**
     * @param {any} hazard
     */
    function viewHazard(hazard) {
        selectedHazard.set(hazard);
    }

    // Weather state
    /** @type {{temp: number, condition: string, icon: string} | null} */
    let weather = null;

    async function fetchWeather() {
        if (!userLocation) return;

        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${userLocation.lat}&longitude=${userLocation.lng}&current_weather=true`,
            );
            const data = await response.json();

            if (data.current_weather) {
                const temp = Math.round(data.current_weather.temperature);
                const weatherCode = data.current_weather.weathercode;

                // Weather code to icon mapping
                /** @type {Record<number, string>} */
                const weatherIcons = {
                    0: "☀️", // Clear sky
                    1: "🌤️", // Mainly clear
                    2: "⛅", // Partly cloudy
                    3: "☁️", // Overcast
                    45: "🌫️", // Fog
                    48: "🌫️", // Depositing rime fog
                    51: "🌦️", // Light drizzle
                    53: "🌦️", // Moderate drizzle
                    55: "🌦️", // Dense drizzle
                    61: "🌧️", // Slight rain
                    63: "🌧️", // Moderate rain
                    65: "🌧️", // Heavy rain
                    71: "🌨️", // Slight snow
                    73: "🌨️", // Moderate snow
                    75: "🌨️", // Heavy snow
                    77: "❄️", // Snow grains
                    80: "🌦️", // Slight rain showers
                    81: "🌧️", // Moderate rain showers
                    82: "⛈️", // Violent rain showers
                    85: "🌨️", // Slight snow showers
                    86: "🌨️", // Heavy snow showers
                    95: "⛈️", // Thunderstorm
                    96: "⛈️", // Thunderstorm with slight hail
                    99: "⛈️", // Thunderstorm with heavy hail
                };

                weather = {
                    temp,
                    condition: data.current_weather.weathercode.toString(),
                    icon: weatherIcons[weatherCode] || "🌤️",
                };
            }
        } catch (error) {
            console.error("Error fetching weather:", error);
        }
    }

    $: if (userLocation && !weather) {
        fetchWeather();
    }
</script>

<div class="w-full h-screen relative overflow-hidden">
    <Map />

    <!-- Floating Action Button for Reporting -->
    <a
        href="/add"
        class="fixed bottom-8 right-6 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-xl z-[500] active:scale-90 transition-transform hover:scale-105"
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="w-8 h-8"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
            />
        </svg>
    </a>

    <!-- Navigation Bar (Glassmorphic) -->
    <div
        class="fixed top-4 left-4 right-4 bg-white/70 backdrop-blur-xl p-2 rounded-full shadow-lg z-[500] flex justify-between items-center px-4 border border-white/40"
    >
        <span class="font-bold text-lg tracking-tight text-gray-900"
            >Njia Salama</span
        >

        <!-- Weather Display (Subtle) -->
        {#if weather}
            <div
                class="hidden md:flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50/50 px-3 py-1.5 rounded-full"
            >
                <span class="text-base">{weather.icon}</span>
                <span class="font-medium">{weather.temp}°C</span>
            </div>
        {/if}

        <div class="flex items-center gap-3">
            <a
                href="/plan"
                class="text-sm font-medium bg-black/5 hover:bg-black/10 px-4 py-2 rounded-full transition-colors"
            >
                Plan Route
            </a>
            <UserMenu />
        </div>
    </div>

    <!-- Mobile Weather Widget (Floating) -->
    {#if weather}
        <div
            class="md:hidden fixed top-20 right-4 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg z-[500] border border-white/40 px-4 py-2 flex items-center gap-2"
        >
            <span class="text-2xl">{weather.icon}</span>
            <div class="flex flex-col">
                <span class="text-lg font-bold text-gray-900"
                    >{weather.temp}°C</span
                >
                <span class="text-xs text-gray-500">Current</span>
            </div>
        </div>
    {/if}

    <!-- Nearby Hazards List (Floating) -->
    {#if showHazardList}
        <div
            transition:slide={{ duration: 300 }}
            class="fixed top-20 left-4 w-80 max-h-[60vh] bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl z-[500] border border-white/40 overflow-hidden flex flex-col"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-4 border-b border-gray-200/50"
            >
                <div class="flex items-center gap-2">
                    <span class="text-lg font-bold text-gray-900"
                        >Nearby Hazards</span
                    >
                    <span
                        class="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium"
                    >
                        {nearbyHazards.length}
                    </span>
                </div>
                <button
                    on:click={() => (showHazardList = false)}
                    class="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close hazard list"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="2"
                        stroke="currentColor"
                        class="w-5 h-5"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            <!-- Hazard List -->
            <div class="overflow-y-auto flex-1">
                {#if !userLocation}
                    <div class="p-4 text-center text-gray-500 text-sm">
                        <p>📍 Getting your location...</p>
                    </div>
                {:else if nearbyHazards.length === 0}
                    <div class="p-4 text-center text-gray-500 text-sm">
                        <p>✅ No hazards within 100km</p>
                        <p class="text-xs mt-1">You're in a safe area!</p>
                    </div>
                {:else}
                    {#each nearbyHazards as hazard}
                        <button
                            on:click={() => viewHazard(hazard)}
                            class="w-full p-3 hover:bg-white/50 transition-colors border-b border-gray-100/50 last:border-0 text-left"
                        >
                            <div class="flex items-start gap-3">
                                <!-- Icon -->
                                <div
                                    class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5"
                                >
                                    <span class="text-sm">⚠️</span>
                                </div>

                                <!-- Content -->
                                <div class="flex-1 min-w-0">
                                    <div
                                        class="flex items-center justify-between gap-2 mb-1"
                                    >
                                        <h4
                                            class="font-semibold text-sm text-gray-900 capitalize truncate"
                                        >
                                            {hazard.hazard_type.replace(
                                                "_",
                                                " ",
                                            )}
                                        </h4>
                                        <span
                                            class="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded shrink-0"
                                        >
                                            {hazard.severity_rating}/5
                                        </span>
                                    </div>

                                    <div
                                        class="flex items-center gap-2 text-xs text-gray-500"
                                    >
                                        <span
                                            >📏 {hazard.distance.toFixed(1)} km away</span
                                        >
                                        <span>•</span>
                                        <span
                                            >{new Date(
                                                hazard.created_at,
                                            ).toLocaleDateString()}</span
                                        >
                                    </div>

                                    {#if hazard.description}
                                        <p
                                            class="text-xs text-gray-600 mt-1 line-clamp-1"
                                        >
                                            {hazard.description}
                                        </p>
                                    {/if}
                                </div>
                            </div>
                        </button>
                    {/each}
                {/if}
            </div>

            <!-- Footer -->
            <div class="p-3 border-t border-gray-200/50 bg-gray-50/50">
                <p class="text-xs text-gray-500 text-center">
                    Showing hazards within 100km radius
                </p>
            </div>
        </div>
    {:else}
        <!-- Toggle button when list is hidden -->
        <button
            on:click={() => (showHazardList = true)}
            transition:fade
            class="fixed top-20 left-4 bg-white/80 backdrop-blur-xl rounded-full shadow-lg z-[500] border border-white/40 px-4 py-2 hover:bg-white transition-colors flex items-center gap-2"
        >
            <span class="text-sm font-medium">Nearby Hazards</span>
            <span
                class="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium"
            >
                {nearbyHazards.length}
            </span>
        </button>
    {/if}

    <!-- Welcome Popup -->
    {#if showWelcome}
        <!-- Backdrop -->
        <div
            transition:fade={{ duration: 200 }}
            class="fixed inset-0 bg-black/30 backdrop-blur-sm z-[900]"
            on:click={closeWelcomeTemporary}
            role="button"
            tabindex="0"
            on:keydown={(e) => e.key === "Escape" && closeWelcomeTemporary()}
        ></div>

        <!-- Popup -->
        <div
            on:click|stopPropagation
            transition:fly={{ y: 50, duration: 300 }}
            class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 z-[1000] border border-white/40"
        >
            <!-- Close Button -->
            <button
                on:click={closeWelcomeTemporary}
                class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors"
                aria-label="Close"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    class="w-5 h-5"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>

            <!-- Content -->
            <div class="space-y-6">
                <div class="text-center">
                    <h2 class="text-3xl font-bold text-gray-900 mb-2">
                        Welcome to Njia Salama! 🚴
                    </h2>
                    <p class="text-gray-600">
                        Your safer cycling companion in Kenya
                    </p>
                </div>

                <div class="space-y-4">
                    <div class="flex gap-4 items-start">
                        <div
                            class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0"
                        >
                            <span class="text-xl">🗺️</span>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900">
                                View Hazards
                            </h3>
                            <p class="text-sm text-gray-600">
                                See reported road hazards on the map as orange
                                dots. Click them for details.
                            </p>
                        </div>
                    </div>

                    <div class="flex gap-4 items-start">
                        <div
                            class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0"
                        >
                            <span class="text-xl">🛣️</span>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900">
                                Plan Safe Routes
                            </h3>
                            <p class="text-sm text-gray-600">
                                Click "Plan Route" to find the safest path
                                between two locations.
                            </p>
                        </div>
                    </div>

                    <div class="flex gap-4 items-start">
                        <div
                            class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0"
                        >
                            <span class="text-xl">⚠️</span>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900">
                                Report Hazards
                            </h3>
                            <p class="text-sm text-gray-600">
                                Use the + button to report new hazards and help
                                the community.
                            </p>
                        </div>
                    </div>

                    <div class="flex gap-4 items-start">
                        <div
                            class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0"
                        >
                            <span class="text-xl">💬</span>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900">
                                Vote & Comment
                            </h3>
                            <p class="text-sm text-gray-600">
                                Keep data accurate by voting if hazards are
                                still there or fixed.
                            </p>
                        </div>
                    </div>
                </div>

                <div class="flex gap-3">
                    <button
                        on:click={closeWelcomeTemporary}
                        class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
                    >
                        Close for now
                    </button>
                    <button
                        on:click={closeWelcomePermanent}
                        class="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg"
                    >
                        Don't show again
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>
