const axios = require('axios');

// Import environment variables
const weatherApiName = 'OpenWeather';
const weatherApiUrl = 'https://api.openweathermap.org/data/2.5';
const weatherApiKey = '519af113678c353b1ae6ef8ce8c10803';

// Check if city is already in database
function checkDatabase(cityCode, unit, lang, db, callback) {
    // Check if city is already in database and if it's not older than 30 minutes
    const query = `SELECT * FROM weather JOIN cities ON weather.city_id = cities.id WHERE cities.code = ? AND weather.unit = ? AND weather.lang = ? 
    AND weather.created_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)`;
    db.query(query, [cityCode, unit, lang], (error, results) => {
        if (error) {
            switch (lang) {
                case 'pt':
                    callback({ message: 'Erro ao carregar tempo!' }, null);
                    break;
                default:
                    callback({ message: 'Error loading weather!' }, null);
            }
        } else if (results.length > 0) {
            callback(null, {
                values: {
                    temp: results[0].temp,
                    humidity: results[0].humidity,
                    wind: results[0].wind,
                    deg: results[0].deg,
                },
                info: {
                    name: results[0].name,
                    description: results[0].description,
                    icon: results[0].icon,
                    dt: results[0].dt,
                    created_at: new Intl.DateTimeFormat(lang === 'pt' ? 'pt-PT' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                    }).format(new Date(results[0].created_at)),
                },
            });
        } else {
            callback(null, null);
        }
    });
}

// Delete old weather data from database
function deleteOldWeatherData(cityCode, unit, lang, db) {
    const query = `DELETE weather FROM weather JOIN cities ON weather.city_id = cities.id WHERE cities.code = ? AND weather.unit = ? AND weather.lang = ?`;
    db.query(query, [cityCode, unit, lang], (error) => {
        if (error) {
            switch (lang) {
                case 'pt':
                    console.error('Erro ao apagar tempo antigo:', error);
                    break;
                default:
                    console.error('Error deleting old weather:', error);
            }
        }
    });
}

// Save weather data to database
function saveWeatherData(cityCode, unit, lang, weather, db) {
    // Get city id
    const query = 'SELECT id FROM cities WHERE code = ?';
    db.query(query, [cityCode], (error, results) => {
        if (error) {
            switch (lang) {
                case 'pt':
                    console.error('Erro ao carregar cidade:', error);
                    break;
                default:
                    console.error('Error loading city:', error);
            }
        } else {
            const cityId = results[0].id;
            // Save weather data
            const insertQuery =
                'INSERT INTO weather (city_id, unit, lang, temp, humidity, wind, deg, description, icon, dt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            db.query(
                insertQuery,
                [
                    cityId,
                    unit,
                    lang,
                    weather.values.temp,
                    weather.values.humidity,
                    weather.values.wind,
                    weather.values.deg,
                    weather.info.description,
                    weather.info.icon,
                    weather.info.dt,
                ],
                (error) => {
                    if (error) {
                        switch (lang) {
                            case 'pt':
                                console.error('Erro ao guardar tempo:', error);
                                break;
                            default:
                                console.error('Error saving weather:', error);
                        }
                    }
                },
            );
        }
    });
}

// Current weather method
async function getCurrentWeather(cityCode, unit, lang, res, db) {
    try {
        const externalApiResponse = await axios.get(
            `${weatherApiUrl}/weather?id=${cityCode}&appid=${weatherApiKey}&units=${unit}&lang=${lang}`,
        );
        const weather = {
            values: {
                temp: externalApiResponse.data.main.temp,
                humidity: externalApiResponse.data.main.humidity,
                wind: externalApiResponse.data.wind.speed,
                deg: externalApiResponse.data.wind.deg,
            },
            info: {
                name: externalApiResponse.data.name,
                description:
                    externalApiResponse.data.weather[0].description.charAt(0).toUpperCase() +
                    externalApiResponse.data.weather[0].description.slice(1),
                icon: externalApiResponse.data.weather[0].icon,
                dt: externalApiResponse.data.dt,
                created_at: new Intl.DateTimeFormat(lang === 'pt' ? 'pt-PT' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                }).format(new Date(externalApiResponse.data.dt * 1000)),
            },
        };

        // Delete old data from database
        deleteOldWeatherData(cityCode, unit, lang, db);
        // Save data to database
        saveWeatherData(cityCode, unit, lang, weather, db);
        return res.json(weather);
    } catch (error) {
        console.error(`Error fetching data from ${weatherApiName} API:`, error);
        return res.status(500).json({ error: `Error fetching data ${weatherApiName} API.` });
    }
}

module.exports = {
    checkDatabase,
    getCurrentWeather,
};
