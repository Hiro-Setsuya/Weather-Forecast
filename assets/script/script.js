const APIKEY = "83e42cf5b4c1601a10eee854e16fd8bd";
const cityInput = document.getElementById("city-input");
const suggestionsList = document.getElementById("suggestions-list");
const search = document.getElementById("search-form-btn");

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
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

async function fetchWeatherByCoords(lat, lon) {
  try {
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${APIKEY}&units=metric`
    );
    const weatherData = await weatherResponse.json();

    displayWeatherData(weatherData);

    // Update weather icon
    const iconContainer = document.getElementById("weather-icon");
    if (iconContainer) {
      iconContainer.innerHTML = `<img src="https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png" alt="Weather icon" style="width:100%; height:100%;">`;
    }
  } catch (error) {
    console.error("Error fetching weather by coordinates:", error);
  }
}

function displayWeatherData(weatherData) {
  document.getElementById("city-name").textContent =
    weatherData.name + ", " + (weatherData.sys.country || "");
  document.getElementById("weather-desc").textContent =
    weatherData.weather[0].description;
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
        fetchWeatherData("New York"); // fallback city
      }
    );
  } else {
    console.warn("Geolocation not supported, defaulting to New York.");
    fetchWeatherData("New York"); // fallback city
  }
});
