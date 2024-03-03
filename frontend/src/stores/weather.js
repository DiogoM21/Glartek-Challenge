import { defineStore } from 'pinia';
import { useMainStore } from './main';
import { useToast } from 'vue-toast-notification';
import axios from 'axios';
import { ref } from 'vue';

const mainStore = useMainStore();
const $toast = useToast();

// Back-End API URL
const backendUrl = 'http://localhost:3000';

export const useWeatherStore = defineStore('weather', () => {
    // Weather unit
    const unit = ref('metric');

    // Current weather
    const weather = ref(null);

    // Check if city is already in storage
    function checkStorage(cityId, unit, lang) {
        // Get storage
        const storage = JSON.parse(localStorage.getItem('OW-weather')) || {};
        const key = `${cityId}-${unit}-${lang}`;
        const storedWeather = storage[key];

        // Check if city is already in storage
        if (storedWeather) {
            try {
                const now = new Date().getTime();
                const diff = now - storedWeather.info.dt * 1000;

                // If data is not older than 30 minute, return it
                if (diff < 1800000) {
                    return (weather.value = storedWeather);
                }
            } catch (error) {
                $toast.error('Erro ao carregar dados da memória.');
            }
        }

        return false;
    }

    // Save data to storage
    function storeWeather(cityId, unit, lang, data) {
        // Get storage
        const storage = JSON.parse(localStorage.getItem('OW-weather')) || {};
        const key = `${cityId}-${unit}-${lang}`;

        // Save data to storage
        storage[key] = data;
        localStorage.setItem('OW-weather', JSON.stringify(storage));
    }

    // Get current weather form city
    async function getCurrentWeather(cityId, unit, lang) {
        $toast.clear();

        // Check if city is already in storage
        const storage = checkStorage(cityId, unit, lang);
        if (storage) {
            return storage;
        }

        try {
            // Get data from API
            const apiResponse = await axios.get(`${backendUrl}/cities/${cityId}/current?unit=${unit}&lang=${lang}`);

            // Save data to storage
            storeWeather(cityId, unit, lang, apiResponse.data);

            return (weather.value = apiResponse.data);
        } catch (error) {
            switch (mainStore.lang) {
                case 'pt':
                    console.error(`Erro ao carregar dados da API: `, error);
                    $toast.error('Erro ao carregar dados da API.');
                    break;
                default:
                    console.error('Error loading API data: ', error);
                    $toast.error('Error loading API data.');
            }
        }
    }

    return {
        unit,
        getCurrentWeather,
    };
});
