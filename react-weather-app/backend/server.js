const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

const GEOCODING_API_KEY = '65a2c015744a8957259296ehn9052f3';

// Rate limiter
const limiter = rateLimit({
    windowMs: 60000, // 1 minute window
    max: 30, // 30 requests per minute (from an IP)
    message: "Too many requests from this IP, try again in a minute"
});

// Apply the rate limiter to the weather route
app.use('/weather/:zipcode', limiter);

app.get('/weather/:zipcode', async (req, res) => {
    const zipcode = req.params.zipcode;
    
    // Sanitize the zip code
    if (!/^[0-9]{5}$/.test(zipcode)) {
        return res.status(400).json({ error: 'Invalid zip code format' });
    }

    try {
        const { zipcode } = req.params;

        // Get coordinates based on the zip code
        const geocodingApiUrl = `https://geocode.maps.co/search?postalcode=${zipcode}&country=US&api_key=${GEOCODING_API_KEY}`;
        const geoResponse = await axios.get(geocodingApiUrl);
        const { lat, lon } = geoResponse.data[0];

        // Then use these coordinates to get the weather data
        const weatherApiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,snowfall,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America%2FNew_York`;
        const weatherResponse = await axios.get(weatherApiUrl);

        res.json(weatherResponse.data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error fetching weather data' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));