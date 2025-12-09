const APIKEY = "83e42cf5b4c1601a10eee854e16fd8bd";
// DOM elements for city input and search functionality
const cityInput = document.getElementById("city-input");
const suggestionsList = document.getElementById("suggestions-list");
const search = document.getElementById("search-form-btn");

// Convert weather condition codes to Material Icons with color styling
function getWeatherIcon(weatherCode, size = "7rem") {
  const code = weatherCode.toLowerCase();

  // Map OpenWeatherMap codes to [iconName, colorClass]
  const iconMap = {
    "01d": ["clear_day", "text-warning"],
    "01n": ["clear_night", "text-primary"],
    "02d": ["partly_cloudy_day", "text-primary"],
    "02n": ["partly_cloudy_night", "text-primary"],
    "03d": ["cloudy", "text-secondary"],
    "03n": ["cloudy", "text-secondary"],
    "04d": ["cloudy", "text-secondary"],
    "04n": ["cloudy", "text-secondary"],
    "09d": ["rainy", "text-primary"],
    "09n": ["rainy", "text-primary"],
    "10d": ["rainy", "text-primary"],
    "10n": ["rainy", "text-primary"],
    "11d": ["thunderstorm", "text-danger"],
    "11n": ["thunderstorm", "text-danger"],
    "13d": ["ac_unit", "text-info"],
    "13n": ["ac_unit", "text-info"],
    "50d": ["foggy", "text-secondary"],
    "50n": ["foggy", "text-secondary"],
  };

  // Get icon or use default
  const [iconName, colorClass] = iconMap[code] || [
    "partly_cloudy_day",
    "text-primary",
  ];

  return `<span class="material-symbols-outlined ${colorClass}" style="font-size: ${size};">${iconName}</span>`;
}

// Suggest cities as the user types
cityInput.addEventListener("input", async function () {
  const query = cityInput.value;
  if (query.length < 2) {
    suggestionsList.innerHTML = "";
    suggestionsList.style.display = "none";
    return;
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${APIKEY}`
    );
    const data = await response.json();
    suggestionsList.innerHTML = "";

    data.forEach((city) => {
      const li = document.createElement("li");
      li.className = "list-group-item list-group-item-action cursor-pointer";
      li.textContent = `${city.name}, ${city.country}`;
      li.style.cursor = "pointer";

      li.addEventListener("click", function () {
        cityInput.value = `${city.name}, ${city.country}`;
        suggestionsList.innerHTML = "";
        suggestionsList.style.display = "none";
      });
      suggestionsList.appendChild(li);
    });
    if (data.length > 0) {
      suggestionsList.style.display = "block";
    } else {
      suggestionsList.style.display = "none";
    }
  } catch (error) {
    console.error("Error fetching city suggestions:", error);
    suggestionsList.innerHTML = "";
    suggestionsList.style.display = "none";
  }
});

// Fetch weather data when the search button is clicked
search.addEventListener("click", function (event) {
  event.preventDefault();
  const city = cityInput.value;
  if (city) {
    fetchWeatherData(city);
  }
});

// Fetch weather data for a given city
async function fetchWeatherData(city) {
  try {
    const geoResponse = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${APIKEY}`
    );
    const geoData = await geoResponse.json();

    if (!geoData || geoData.length === 0) {
      alert("City not found");
      return;
    }

    const { lat, lon } = geoData[0];

    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${APIKEY}&units=metric`
    );
    const weatherData = await weatherResponse.json();

    // Display weather
    displayWeatherData(weatherData);

    // Update weather icon
    const iconContainer = document.getElementById("weather-icon");
    if (iconContainer) {
      iconContainer.innerHTML = getWeatherIcon(
        weatherData.weather[0].icon,
        "7rem"
      );
    }

    // **Fetch and display 5-day forecast for this city**
    fetchFiveDayForecast(lat, lon);
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

// Fetch weather data by geographic coordinates
async function fetchWeatherByCoords(lat, lon) {
  try {
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${APIKEY}&units=metric`
    );
    const weatherData = await weatherResponse.json();

    displayWeatherData(weatherData);

    // Update weather icon with Google Material Icon
    const iconContainer = document.getElementById("weather-icon");
    if (iconContainer) {
      iconContainer.innerHTML = getWeatherIcon(
        weatherData.weather[0].icon,
        "7rem"
      );
    }

    // Fetch and display 5-day forecast
    fetchFiveDayForecast(lat, lon);
  } catch (error) {
    console.error("Error fetching weather by coordinates:", error);
  }
}

// Display weather data in the DOM
function displayWeatherData(weatherData) {
  document.getElementById("city-name").textContent =
    weatherData.name + ", " + (weatherData.sys.country || "");
  document.getElementById("weather-desc").textContent =
    weatherData.weather[0].description.toUpperCase();
  document.getElementById("temperature").textContent =
    Math.round(weatherData.main.temp) + "°C";
  document.getElementById("feels-like").textContent =
    Math.round(weatherData.main.feels_like) + "°C";
  document.getElementById("humidity").textContent =
    weatherData.main.humidity + "%";
  document.getElementById("wind-speed").textContent =
    Math.round(weatherData.wind.speed * 3.6) + " km/h";
}

// Get user location on page load
window.addEventListener("load", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeatherByCoords(lat, lon);
      },
      (error) => {
        console.warn(
          "Geolocation denied or unavailable, defaulting to New York."
        );
        fetchWeatherData("New York");
      }
    );
  } else {
    console.warn("Geolocation not supported, defaulting to New York.");
    fetchWeatherData("New York");
  }
});

// Fetch and display 5-day weather forecast
async function fetchFiveDayForecast(lat, lon) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${APIKEY}&units=metric`
    );
    const data = await response.json();

    const forecastContainer = document.getElementById("forecast-container");
    forecastContainer.innerHTML = "";

    // Group forecasts by date and calculate min/max temps
    const dailyForecastMap = {};
    data.list.forEach((item) => {
      const date = item.dt_txt.split(" ")[0];
      if (!dailyForecastMap[date]) {
        dailyForecastMap[date] = {
          temps: [],
          icon: item.weather[0].icon,
          description: item.weather[0].description,
          dt: item.dt,
        };
      }
      dailyForecastMap[date].temps.push(item.main.temp);
    });

    // Get first 5 days and calculate min/max temps
    const dailyForecasts = Object.values(dailyForecastMap)
      .slice(0, 5)
      .map((day) => ({
        ...day,
        temp_max: Math.max(...day.temps),
        temp_min: Math.min(...day.temps),
      }));

    // Create a Bootstrap row to hold columns
    const row = document.createElement("div");
    row.className = "row text-center g-3";

    dailyForecasts.forEach((day) => {
      const date = new Date(day.dt * 1000);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const weatherIcon = getWeatherIcon(day.icon, "3.5rem");

      const col = document.createElement("div");
      col.className = "col";

      col.innerHTML = `
        <div class="card p-3 shadow-sm h-100">
          <h6 class="mb-2">${dayName}</h6>
          <div class="mb-2">${weatherIcon}</div>
          <p class="mb-0"><strong>${Math.round(day.temp_max)}° / ${Math.round(
        day.temp_min
      )}°</strong></p>
          <p class="text-muted">${day.description.toUpperCase()}</p>
        </div>
      `;

      row.appendChild(col);
    });

    forecastContainer.appendChild(row);
  } catch (error) {
    console.error("Error fetching 5-day forecast:", error);
  }
}
