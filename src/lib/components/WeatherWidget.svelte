<script>
    import { onMount } from "svelte";

    /** @type {number} */
    export let lat;
    /** @type {number} */
    export let lng;

    /** @type {{temperature: number, weathercode: number} | null} */
    let weather = null;
    let loading = false;
    let error = null;

    $: if (lat && lng) {
        fetchWeather();
    }

    async function fetchWeather() {
        loading = true;
        error = null;
        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`,
            );
            const data = await response.json();
            weather = data.current_weather;
        } catch (e) {
            error = "Failed to load weather";
            console.error(e);
        } finally {
            loading = false;
        }
    }

    /**
     * @param {number} code
     */
    function getWeatherDescription(code) {
        /** @type {Object.<number, string>} */
        const codes = {
            0: "Clear sky",
            1: "Mainly clear",
            2: "Partly cloudy",
            3: "Overcast",
            45: "Fog",
            48: "Depositing rime fog",
            51: "Light drizzle",
            53: "Moderate drizzle",
            55: "Dense drizzle",
            61: "Slight rain",
            63: "Moderate rain",
            65: "Heavy rain",
            71: "Slight snow",
            73: "Moderate snow",
            75: "Heavy snow",
            95: "Thunderstorm",
            96: "Thunderstorm with slight hail",
            99: "Thunderstorm with heavy hail",
        };
        return codes[code] || "Unknown";
    }

    /**
     * @param {number} temp
     * @param {number} code
     */
    function getGearRecommendation(temp, code) {
        let recommendations = [];

        // Temperature based
        if (temp < 10) {
            recommendations.push(
                "Thermal base layer",
                "Winter gloves",
                "Shoe covers",
            );
        } else if (temp < 15) {
            recommendations.push("Light jacket or gilet", "Arm warmers");
        } else if (temp < 20) {
            recommendations.push("Short sleeves", "Maybe a windbreaker");
        } else {
            recommendations.push(
                "Lightweight jersey",
                "Sunscreen",
                "Sunglasses",
            );
        }

        // Condition based
        if (code >= 51 && code <= 67) {
            // Rain/Drizzle
            recommendations.push("Waterproof jacket", "Fenders recommended");
        } else if (code >= 71 && code <= 77) {
            // Snow
            recommendations.push("Thermal jacket", "Winter tires");
        }

        return recommendations;
    }
</script>

{#if loading}
    <div class="animate-pulse bg-gray-100 rounded-xl p-4 h-24"></div>
{:else if weather}
    <div class="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
                <span class="text-2xl font-bold">{weather.temperature}°C</span>
                <span class="text-sm text-gray-600"
                    >{getWeatherDescription(weather.weathercode)}</span
                >
            </div>
            <!-- Simple Icon Logic based on code -->
            <div class="text-2xl">
                {#if weather.weathercode === 0}☀️
                {:else if weather.weathercode <= 3}⛅
                {:else if weather.weathercode <= 48}🌫️
                {:else if weather.weathercode <= 67}🌧️
                {:else if weather.weathercode <= 77}❄️
                {:else}⛈️{/if}
            </div>
        </div>

        <div class="text-xs text-gray-600">
            <span class="font-bold text-blue-800">Gear Check:</span>
            {getGearRecommendation(
                weather.temperature,
                weather.weathercode,
            ).join(" • ")}
        </div>
    </div>
{/if}
