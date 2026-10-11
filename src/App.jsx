
import { useState } from "react";
import "./index.css";

export default function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [place, setPlace] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchWeather(e) {
    e.preventDefault();
    if (!city.trim()) return;

    setLoading(true);
    setError("");
    setWeather(null);

    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&language=en&format=json`
      );
      if (!geoResponse.ok) throw new Error("Location search failed");

      const geo = await geoResponse.json();
      const location = geo.results?.[0];
      if (!location) throw new Error("City nahi mili. Spelling check karo.");

      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.search = new URLSearchParams({
        latitude: location.latitude,
        longitude: location.longitude,
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code",
        daily: "weather_code,temperature_2m_max,temperature_2m_min",
        timezone: "auto",
        forecast_days: "7",
      });

      const response = await fetch(url);
      if (!response.ok) throw new Error("Weather data unavailable");

      const data = await response.json();
      setWeather(data);
      setPlace(`${location.name}, ${location.country}`);
    } catch (err) {
      setError(err.message || "Weather fetch nahi hua.");
    } finally {
      setLoading(false);
    }
  }

  const condition = (code) => {
    if (code === 0) return "Clear sky ☀️";
    if ([1, 2, 3].includes(code)) return "Cloudy ☁️";
    if ([45, 48].includes(code)) return "Fog 🌫️";
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "Rain 🌧️";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow ❄️";
    if ([95, 96, 99].includes(code)) return "Thunderstorm ⛈️";
    return "Weather update";
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <p className="text-sm font-semibold text-sky-400">LIVE WEATHER</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            WeatherNow 🌦️
          </h1>
          <p className="mt-2 text-slate-400">
            Search a city to see its weather forecast.
          </p>
        </header>

        <form onSubmit={searchWeather} className="mb-6 flex gap-2">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city, e.g. Patna"
            className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-sky-500"
          />
          <button
            disabled={loading}
            className="rounded-xl bg-sky-600 px-5 py-3 font-semibold hover:bg-sky-500 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Search"}
          </button>
        </form>

        {error && <p className="mb-5 text-red-400">{error}</p>}

        {weather && (
          <>
            <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-6 sm:p-9">
              <p className="text-slate-400">{place}</p>
              <p className="mt-4 text-5xl">
                {condition(weather.current.weather_code)}
              </p>
              <h2 className="mt-4 text-6xl font-bold">
                {Math.round(weather.current.temperature_2m)}°C
              </h2>
              <p className="mt-3 text-slate-300">
                Feels like {Math.round(weather.current.apparent_temperature)}°C
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-950/60 p-4">
                  <p className="text-sm text-slate-400">Humidity</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {weather.current.relative_humidity_2m}%
                  </p>
                </div>
                <div className="rounded-xl bg-slate-950/60 p-4">
                  <p className="text-sm text-slate-400">Wind speed</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {weather.current.wind_speed_10m} km/h
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="mb-4 text-xl font-bold">7-Day Forecast</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {weather.daily.time.map((day, i) => (
                  <article
                    key={day}
                    className="rounded-xl border border-slate-800 bg-slate-900 p-4"
                  >
                    <p className="text-sm text-slate-400">
                      {new Date(`${day}T12:00:00`).toLocaleDateString("en", {
                        weekday: "short",
                        timeZone: "UTC",
                      })}
                    </p>
                    <p className="my-3 text-2xl">
                      {condition(weather.daily.weather_code[i]).split(" ").at(-1)}
                    </p>
                    <p className="font-semibold">
                      {Math.round(weather.daily.temperature_2m_max[i])}°
                    </p>
                    <p className="text-sm text-slate-400">
                      {Math.round(weather.daily.temperature_2m_min[i])}°
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
