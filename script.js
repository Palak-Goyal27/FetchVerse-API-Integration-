const apiKeyWeather = "c9dc4ccc04ba3d455f38a5498d6daf5a";
const apiKeyNews = "03b9a14079a047649264675dcbcc2e69";

function handleAPISelection() {
  const selected = document.getElementById("apiSelect").value;
  const customContainer = document.getElementById("customUrlContainer");
  const searchBox = document.getElementById("searchInputBox");

  document.getElementById("outputBox").innerHTML = `<p><i>API response will appear here...</i></p>`;
  document.getElementById("searchQuery").value = "";
  document.getElementById("customApiUrl").value = "";

  if (selected === "custom") {
    customContainer.classList.remove("hidden");
    searchBox.classList.add("hidden");
  } else if (selected === "weather" || selected === "news") {
    searchBox.classList.remove("hidden");
    customContainer.classList.add("hidden");
  } else {
    customContainer.classList.add("hidden");
    searchBox.classList.add("hidden");
  }
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.innerText = msg;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

async function fetchAPI() {
  const selected = document.getElementById("apiSelect").value;
  const searchQuery = document.getElementById("searchQuery").value.trim();
  let url = "";

  switch (selected) {
    case "weather":
      if (!searchQuery) return showToast("Enter a city name.");
      url = `https://api.openweathermap.org/data/2.5/weather?q=${searchQuery}&appid=${apiKeyWeather}&units=metric`;
      break;

    case "news":
      if (!searchQuery) return showToast("Enter a search keyword.");
      url = `https://newsapi.org/v2/everything?q=${searchQuery}&apiKey=${apiKeyNews}`;
      break;

    case "crypto":
      url = `https://api.coindesk.com/v1/bpi/currentprice/BTC.json`;
      break;

    case "custom":
      url = document.getElementById("customApiUrl").value.trim();
      if (!url) return showToast("Enter a valid custom API URL.");
      break;

    default:
      return showToast("Select a valid API.");
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    window.latestJSON = data;
    window.latestAPIType = selected;
    window.latestView = "card";

    if (selected === "weather") {
      renderWeatherCard(data);
    } else if (selected === "news") {
      renderNewsCards(data);
    } else {
      document.getElementById("outputBox").textContent = JSON.stringify(data, null, 2);
      window.latestView = "json";
    }
  } catch (err) {
    showToast("❌ " + err.message);
    document.getElementById("outputBox").textContent = "Error: " + err.message;
  }
}

function renderWeatherCard(data) {
  const html = `
    <div class="weather-card">
      <div class="weather-header">
        <h2>📍 ${data.name}, ${data.sys?.country}</h2>
        <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}" />
      </div>
      <p>🌤️ <strong>${data.weather[0].main}</strong> (${data.weather[0].description})</p>
      <p>🌡️ Temperature: <strong>${data.main.temp}°C</strong></p>
      <p>🥵 Feels Like: <strong>${data.main.feels_like}°C</strong></p>
      <p>💧 Humidity: <strong>${data.main.humidity}%</strong></p>
      <p>🌬️ Wind Speed: <strong>${data.wind.speed} m/s</strong></p>
    </div>
  `;
  document.getElementById("outputBox").innerHTML = html;
}

function renderNewsCards(data) {
  const articles = data.articles?.slice(0, 3) || [];
  if (articles.length === 0) return (document.getElementById("outputBox").innerHTML = "No articles found.");

  const cards = articles.map((a, i) => `
    <div class="news-card">
      <img src="${a.urlToImage || ''}" alt="news-img" />
      <h3>${a.title}</h3>
      <p>${a.description || ''}</p>
      <a href="${a.url}" target="_blank">🔗 Read More</a>
    </div>
  `).join("");

  document.getElementById("outputBox").innerHTML = cards;
}

function copyJSON() {
  if (!window.latestJSON) return showToast("Nothing to copy!");
  navigator.clipboard.writeText(JSON.stringify(window.latestJSON, null, 2));
  showToast("📋 JSON copied!");
}

function toggleView() {
  if (!window.latestJSON || !window.latestAPIType) return showToast("No data!");
  if (window.latestView === "json") {
    if (window.latestAPIType === "weather") renderWeatherCard(window.latestJSON);
    else if (window.latestAPIType === "news") renderNewsCards(window.latestJSON);
    window.latestView = "card";
  } else {
    document.getElementById("outputBox").textContent = JSON.stringify(window.latestJSON, null, 2);
    window.latestView = "json";
  }
}

function toggleTheme() {
  document.body.classList.toggle("dark");
}

function downloadFormattedData() {
  if (!window.latestJSON || !window.latestAPIType) return showToast("Nothing to download!");

  let content = "";
  const type = window.latestAPIType;
  const data = window.latestJSON;

  if (type === "weather") {
    content = `
📍 City: ${data.name}, ${data.sys?.country}
🌤️ Weather: ${data.weather[0].main} (${data.weather[0].description})
🌡️ Temperature: ${data.main.temp}°C
🥵 Feels Like: ${data.main.feels_like}°C
💧 Humidity: ${data.main.humidity}%
🌬️ Wind Speed: ${data.wind.speed} m/s
    `.trim();
  } else if (type === "news") {
    const articles = data.articles?.slice(0, 3) || [];
    content = articles.map((article, i) => `
📰 Article ${i + 1}
🧾 Title: ${article.title}
📝 Description: ${article.description || "N/A"}
🔗 Link: ${article.url}
    `.trim()).join("\n\n");
  } else {
    content = "📦 This API is not supported for card download.";
  }

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `${type}_data.txt`;
  anchor.click();
}
