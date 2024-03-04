import { defineStore } from 'pinia';
import { useToast } from 'vue-toast-notification';
import { useMainStore } from '@/stores/main';
import axios from 'axios';

const $toast = useToast();

// Back-End API URL
const backendUrl = 'http://localhost:3000';

const mainStore = useMainStore();

export const useCityStore = defineStore('city', () => {
    // Check if cities is already in storage
    function checkCities() {
        // Get storage
        const storage = JSON.parse(localStorage.getItem('OW-cities')) || {};
        const storedCities = storage['cities'];

        // If data is in storage, return it
        if (storedCities && storedCities.length > 0) {
            try {
                const now = new Date().getTime();
                const diff = now - storage['lastUpdate'];

                // If data is not older than 1 hour, return it
                if (diff < 3600000) {
                    return storedCities;
                }
            } catch (error) {
                switch (mainStore.lang) {
                    case 'pt':
                        $toast.error('Erro ao carregar cidades da memória.');
                        break;
                    default:
                        $toast.error('Error loading cidades from memory.');
                }
            }
        }

        return false;
    }

    // Save data to storage
    function storeCities(data) {
        // Get storage
        const storage = JSON.parse(localStorage.getItem('OW-cities')) || {};

        // Save data to storage
        const now = new Date().getTime();
        storage['cities'] = data;
        storage['lastUpdate'] = now;
        localStorage.setItem('OW-cities', JSON.stringify(storage));
    }

    // Get current weather form city
    async function getCities(force) {
        if (!force) {
            // Check if city is already in storage
            const storage = checkCities();
            if (storage) {
                return storage;
            }
        }

        try {
            // Get data from API and save it to storage
            const apiResponse = await axios.get(`${backendUrl}/cities?lang=${mainStore.lang}`);
            if (apiResponse.data.cities && apiResponse.data.cities.length > 0) {
                storeCities(apiResponse.data.cities);
            }

            return apiResponse.data.cities;
        } catch (error) {
            handleError(error);
        }
    }

    // Handle error from API
    function handleError(error) {
        let errorMsg;
        switch (mainStore.lang) {
            case 'pt':
                errorMsg = 'Erro ao carregar dados da API Back-End.';
                break;
            default:
                errorMsg = 'Error loading Back-End API data.';
        }
        try {
            $toast.error(errorMsg + ' ' + error.response.data.message);
        } catch {
            $toast.error(errorMsg + ' ' + error);
        }
    }

    return {
        getCities,
    };
});
