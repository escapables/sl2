/**
 * Swedish Commute Dashboard - Frontend JavaScript
 * Secure API Key Storage with Obfuscation
 */

// DOM Elements - API Key Modal
const apiKeyModal = document.getElementById("api-key-modal");
const apiKeyInput = document.getElementById("api-key-input");
const rememberKeyCheckbox = document.getElementById("remember-key");
const saveApiKeyBtn = document.getElementById("save-api-key");
const apiKeyError = document.getElementById("api-key-error");
const settingsBtn = document.getElementById("settings-btn");
const keyStatus = document.getElementById("key-status");

// DOM Elements - Search
const fromInput = document.getElementById("from-location");
const toInput = document.getElementById("to-location");
const fromIdInput = document.getElementById("from-id");
const toIdInput = document.getElementById("to-id");
const fromSuggestions = document.getElementById("from-suggestions");
const toSuggestions = document.getElementById("to-suggestions");
const fromCurrentBtn = document.getElementById("from-current");
const toCurrentBtn = document.getElementById("to-current");
const swapBtn = document.getElementById("swap-locations");
const dateInput = document.getElementById("travel-date");
const timeInput = document.getElementById("travel-time");
const searchBtn = document.getElementById("search-btn");
const loadingSection = document.getElementById("loading");
const resultsSection = document.getElementById("results");
const tripsList = document.getElementById("trips-list");
const noResultsSection = document.getElementById("no-results");
const errorResultsSection = document.getElementById("error-results");
const errorMessageEl = document.getElementById("error-message");

// Track current suggestions for auto-select
let currentFromSuggestions = [];
let currentToSuggestions = [];

// State
let searchTimeout = null;
let selectedFrom = null;
let selectedTo = null;
let currentApiKey = null;

// Transport type icons - extended for all Swedish transport types
const transportIcons = {
  // Trains
  JRE: "🚆",
  JIC: "🚄",
  JBL: "🚅",
  JLT: "🚃",
  JLX: "🚂",
  JEX: "🚄",
  // Buses
  BUS: "🚌",
  TLB: "🚌",
  COACH: "🚌",
  // Trams/Light rail
  TRM: "🚊",
  HST: "🚊",
  // Metro
  MET: "🚇",
  URB: "🚇",
  // Other
  FOT: "🚶",
  WALK: "🚶",
  BOAT: "⛴️",
  SHIP: "🚢",
  FLY: "✈️",
  TAXI: "🚕",
  FUN: "🚡",
  FERRY: "⛴️",
};

const transportNames = {
  JRE: "Regional Train",
  JIC: "InterCity",
  JBL: "High Speed Train",
  JLT: "Local Train",
  JLX: "Night Train",
  JEX: "Express Train",
  BUS: "Bus",
  TLB: "Bus",
  COACH: "Coach",
  TRM: "Tram",
  HST: "Tram",
  MET: "Metro",
  URB: "Urban Rail",
  FOT: "Walk",
  WALK: "Walk",
  BOAT: "Ferry",
  SHIP: "Ship",
  FLY: "Flight",
  TAXI: "Taxi",
  FUN: "Cable Car",
  FERRY: "Ferry",
};

// ==================== API KEY SECURITY ====================

function obfuscateKey(key) {
  if (!key) return "";
  const pattern = [0x47, 0x82, 0xa1, 0x3f, 0xe5, 0x19, 0x6b, 0xcd];
  let result = "";
  for (let i = 0; i < key.length; i++) {
    const charCode = key.charCodeAt(i) ^ pattern[i % pattern.length];
    result += String.fromCharCode(charCode);
  }
  return btoa(result);
}

function deobfuscateKey(obfuscatedKey) {
  if (!obfuscatedKey) return "";
  try {
    const pattern = [0x47, 0x82, 0xa1, 0x3f, 0xe5, 0x19, 0x6b, 0xcd];
    const decoded = atob(obfuscatedKey);
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ pattern[i % pattern.length];
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (e) {
    console.error("Failed to deobfuscate key:", e);
    return "";
  }
}

function saveApiKey(key, remember) {
  currentApiKey = key;
  if (remember) {
    const obfuscated = obfuscateKey(key);
    localStorage.setItem("trafiklab_api_key", obfuscated);
    localStorage.setItem("trafiklab_key_saved", "true");
  } else {
    localStorage.removeItem("trafiklab_api_key");
    localStorage.removeItem("trafiklab_key_saved");
  }
  updateKeyStatus();
}

function loadApiKey() {
  const saved = localStorage.getItem("trafiklab_api_key");
  console.log("localStorage has key:", !!saved);
  if (saved) {
    currentApiKey = deobfuscateKey(saved);
    console.log(
      "Deobfuscated key length:",
      currentApiKey ? currentApiKey.length : 0,
    );
    return !!currentApiKey;
  }
  return false;
}

function getApiKey() {
  return currentApiKey;
}

function updateKeyStatus() {
  if (currentApiKey) {
    keyStatus.classList.remove("hidden");
    keyStatus.textContent = "🔒 Key Active";
  } else {
    keyStatus.classList.add("hidden");
  }
}

function showApiKeyModal() {
  apiKeyModal.classList.remove("hidden");
  apiKeyInput.value = "";
  apiKeyError.classList.add("hidden");
  apiKeyInput.focus();
}

function hideApiKeyModal() {
  apiKeyModal.classList.add("hidden");
}

async function validateAndSaveApiKey() {
  const key = apiKeyInput.value.trim();
  if (!key) {
    showApiKeyError("Please enter an API key");
    return;
  }

  saveApiKeyBtn.disabled = true;
  saveApiKeyBtn.textContent = "Validating...";

  try {
    const resp = await fetch("/api/validate-key", {
      method: "POST",
      headers: { "X-API-Key": key },
    });

    if (resp.ok) {
      saveApiKey(key, rememberKeyCheckbox.checked);
      hideApiKeyModal();
    } else {
      const data = await resp.json();
      showApiKeyError(data.error || "Invalid API key");
    }
  } catch (e) {
    showApiKeyError("Failed to validate key. Please try again.");
  } finally {
    saveApiKeyBtn.disabled = false;
    saveApiKeyBtn.textContent = "Start Using Dashboard";
  }
}

function showApiKeyError(message) {
  apiKeyError.textContent = message;
  apiKeyError.classList.remove("hidden");
}

async function apiFetch(url) {
  const key = getApiKey();
  if (!key) {
    showApiKeyModal();
    throw new Error("API key not configured");
  }

  const resp = await fetch(url, {
    headers: { "X-API-Key": key },
  });

  if (resp.status === 401) {
    showApiKeyModal();
    throw new Error("API key invalid");
  }

  return resp;
}

// ==================== INITIALIZATION ====================

document.addEventListener("DOMContentLoaded", () => {
  console.log("Dashboard initializing...");
  initializeDateTime();
  setupEventListeners();

  const hasKey = loadApiKey();
  console.log("API key loaded:", hasKey);
  if (!hasKey) {
    showApiKeyModal();
  } else {
    updateKeyStatus();
    console.log("API key active, ready to search");
  }
});

function initializeDateTime() {
  const now = new Date();
  dateInput.value = formatDate(now);
  timeInput.value = formatTime(now);
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function formatTime(date) {
  return date.toTimeString().slice(0, 5);
}

function setupEventListeners() {
  saveApiKeyBtn.addEventListener("click", validateAndSaveApiKey);
  settingsBtn.addEventListener("click", showApiKeyModal);
  apiKeyInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") validateAndSaveApiKey();
  });

  fromInput.addEventListener("input", (e) => {
    fromIdInput.value = "";
    selectedFrom = null;
    fromInput.classList.remove("selected");
    debouncedSearch(e.target.value, "from");
  });
  toInput.addEventListener("input", (e) => {
    toIdInput.value = "";
    selectedTo = null;
    toInput.classList.remove("selected");
    debouncedSearch(e.target.value, "to");
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".input-group")) {
      hideAllSuggestions();
    }
  });

  fromCurrentBtn.addEventListener("click", () => getCurrentLocation("from"));
  toCurrentBtn.addEventListener("click", () => getCurrentLocation("to"));
  swapBtn.addEventListener("click", swapLocations);
  searchBtn.addEventListener("click", searchRoutes);

  fromInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (currentFromSuggestions.length > 0 && !fromIdInput.value) {
        selectLocation("from", currentFromSuggestions[0]);
      } else {
        searchRoutes();
      }
    }
  });
  toInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (currentToSuggestions.length > 0 && !toIdInput.value) {
        selectLocation("to", currentToSuggestions[0]);
      } else {
        searchRoutes();
      }
    }
  });
}

// ==================== LOCATION SEARCH ====================

function debouncedSearch(query, type) {
  clearTimeout(searchTimeout);
  if (query.length < 2) {
    hideSuggestions(type);
    return;
  }
  console.log(`[${type}] Debounced search for: "${query}"`);
  searchTimeout = setTimeout(() => searchLocations(query, type), 400);
}

async function searchLocations(query, type) {
  const container = type === "from" ? fromSuggestions : toSuggestions;

  const key = getApiKey();
  if (!key) {
    console.log(`[${type}] No API key configured, showing modal`);
    showApiKeyModal();
    return;
  }

  console.log(`[${type}] Searching for: "${query}"`);
  container.innerHTML =
    '<div class="suggestion-item"><span class="loading-text">Searching...</span></div>';
  container.classList.add("active");

  try {
    const url = `/api/search?q=${encodeURIComponent(query)}`;
    console.log(`[${type}] Fetching:`, url);

    const resp = await fetch(url, {
      headers: { "X-API-Key": key },
    });

    console.log(`[${type}] Response status:`, resp.status);

    if (resp.status === 401) {
      showApiKeyModal();
      throw new Error("API key invalid");
    }

    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }

    const data = await resp.json();
    console.log(`[${type}] Response data:`, data);

    let locations = null;
    if (data.StopLocation) {
      locations = Array.isArray(data.StopLocation)
        ? data.StopLocation
        : [data.StopLocation];
    } else if (data.stopLocationOrCoordLocation) {
      locations = data.stopLocationOrCoordLocation.map(
        (item) => item.StopLocation || item,
      );
    }

    console.log(`[${type}] Parsed locations:`, locations);

    displaySuggestions(locations, type);
  } catch (e) {
    console.error(`[${type}] Search error:`, e);
    container.innerHTML =
      '<div class="suggestion-item error"><span class="error-text">Search failed. Check console.</span></div>';
    setTimeout(() => hideSuggestions(type), 2000);
  }
}

function displaySuggestions(locations, type) {
  console.log(
    `[${type}] Displaying ${locations ? locations.length : 0} suggestions`,
  );
  const container = type === "from" ? fromSuggestions : toSuggestions;
  container.innerHTML = "";

  if (type === "from") {
    currentFromSuggestions = locations || [];
  } else {
    currentToSuggestions = locations || [];
  }

  if (!locations || locations.length === 0) {
    container.innerHTML =
      '<div class="suggestion-item no-results"><span class="no-results-text">No stations found</span></div>';
    setTimeout(() => hideSuggestions(type), 2000);
    return;
  }

  locations.slice(0, 8).forEach((loc) => {
    if (!loc || !loc.name) {
      console.log("Skipping location without name:", loc);
      return;
    }

    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.tabIndex = 0;

    const icon = document.createElement("span");
    icon.className = "icon";
    const locType = loc.type || "";
    if (locType === "ST") {
      icon.textContent = "🚏";
    } else if (locType === "ADR") {
      icon.textContent = "📍";
    } else if (locType === "POI") {
      icon.textContent = "🏢";
    } else {
      icon.textContent = "🚏";
    }

    const nameEl = document.createElement("span");
    nameEl.className = "name";
    nameEl.textContent = formatLocationName(loc.name);

    const typeEl = document.createElement("span");
    typeEl.className = "type";
    typeEl.textContent = loc.dist
      ? `${loc.dist}m away`
      : locType === "ST"
        ? "Station"
        : "Address";

    item.appendChild(icon);
    item.appendChild(nameEl);
    item.appendChild(typeEl);

    item.addEventListener("click", () => selectLocation(type, loc));
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter") selectLocation(type, loc);
    });

    container.appendChild(item);
  });

  container.classList.add("active");
}

function formatLocationName(name) {
  if (!name || typeof name !== "string") {
    return "Unknown location";
  }
  return name.replace(
    /\b([A-ZÅÄÖ]{3,})\b/g,
    (match) => match.charAt(0) + match.slice(1).toLowerCase(),
  );
}

function selectLocation(type, location) {
  if (!location || !location.name) {
    console.error("Cannot select location without name:", location);
    return;
  }

  const input = type === "from" ? fromInput : toInput;
  const idInput = type === "from" ? fromIdInput : toIdInput;

  input.value = formatLocationName(location.name);
  idInput.value = location.extId || location.id;
  input.classList.add("selected");

  if (type === "from") {
    selectedFrom = location;
    currentFromSuggestions = [];
  } else {
    selectedTo = location;
    currentToSuggestions = [];
  }

  hideSuggestions(type);
}

function hideSuggestions(type) {
  const container = type === "from" ? fromSuggestions : toSuggestions;
  container.classList.remove("active");
  setTimeout(() => {
    if (type === "from") currentFromSuggestions = [];
    else currentToSuggestions = [];
  }, 200);
}

function hideAllSuggestions() {
  fromSuggestions.classList.remove("active");
  toSuggestions.classList.remove("active");
}

function getCurrentLocation(type) {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  }

  const input = type === "from" ? fromInput : toInput;
  input.placeholder = "Locating...";

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const resp = await apiFetch(
          `/api/nearby?lat=${latitude}&lon=${longitude}`,
        );
        const data = await resp.json();

        if (data.stopLocationOrCoordLocation?.length > 0) {
          const stop = data.stopLocationOrCoordLocation[0].StopLocation;
          selectLocation(type, stop);
        } else {
          input.placeholder = "No nearby stops found";
        }
      } catch (e) {
        console.error("Failed to get nearby stops:", e);
        input.placeholder = "Error finding location";
      }
    },
    (error) => {
      console.error("Geolocation error:", error);
      input.placeholder = "Location access denied";
    },
  );
}

// ==================== ROUTE SEARCH ====================

function swapLocations() {
  const fromVal = fromInput.value;
  const toVal = toInput.value;
  const fromId = fromIdInput.value;
  const toId = toIdInput.value;

  fromInput.value = toVal;
  toInput.value = fromVal;
  fromIdInput.value = toId;
  toIdInput.value = fromId;

  [selectedFrom, selectedTo] = [selectedTo, selectedFrom];
}

async function searchRoutes() {
  const fromId = fromIdInput.value;
  const toId = toIdInput.value;
  const fromText = fromInput.value.trim();
  const toText = toInput.value.trim();

  if (!fromText || !toText) {
    alert("Please enter both origin and destination locations");
    return;
  }

  if (!fromId && !toId) {
    alert(
      "Please select valid locations from the dropdown for both origin and destination",
    );
    return;
  }

  if (!fromId) {
    alert(
      `Please select a valid origin location from the dropdown\n"${fromText}" was not recognized`,
    );
    return;
  }

  if (!toId) {
    alert(
      `Please select a valid destination location from the dropdown\n"${toText}" was not recognized`,
    );
    return;
  }

  showLoading();

  try {
    let url = `/api/route?from=${encodeURIComponent(fromId)}&to=${encodeURIComponent(toId)}`;
    const dateVal = dateInput.value;
    const timeVal = timeInput.value;

    if (dateVal) {
      url += `&date=${dateVal}`;
      console.log(`Route date: ${dateVal}`);
    }

    if (timeVal) {
      url += `&time=${timeVal}`;
    }

    console.log(`Route request: ${url}`);

    const resp = await apiFetch(url);
    const data = await resp.json();

    console.log("Route response:", data);

    if (data.error) {
      console.error("Route API error:", data);
      showError(
        `Route search failed: ${data.error}${data.details ? " - " + data.details : ""}`,
      );
    } else if (data.Trip?.length > 0) {
      displayTrips(data.Trip);
    } else {
      showNoResults();
    }
  } catch (e) {
    console.error("Route search error:", e);
    hideLoading();
    showError(`Route search failed: ${e.message}`);
  }
}

// ==================== DISPLAY RESULTS ====================

function displayTrips(trips) {
  hideLoading();
  noResultsSection.classList.add("hidden");
  errorResultsSection.classList.add("hidden");
  resultsSection.classList.remove("hidden");
  tripsList.innerHTML = "";

  trips.forEach((trip) => {
    const card = createTripCard(trip);
    tripsList.appendChild(card);
  });
}

function createTripCard(trip) {
  const legs = trip.LegList?.Leg || [];
  const firstLeg = legs[0];
  const lastLeg = legs[legs.length - 1];

  const depTime = formatTimeString(firstLeg.Origin.time);
  const arrTime = formatTimeString(lastLeg.Destination.time);
  const duration = calculateDuration(firstLeg.Origin, lastLeg.Destination);

  const card = document.createElement("div");
  card.className = "trip-card";
  card.innerHTML = `
        <div class="trip-header">
            <div class="trip-time">${depTime} → ${arrTime}</div>
            <div class="trip-duration">${duration}</div>
        </div>
        <div class="trip-details">
            <div class="legs-summary">${getLegsSummary(legs)}</div>
            <div class="transfers">${getTransfersText(legs)}</div>
        </div>
        <div class="trip-legs">${getLegsDetail(legs)}</div>
    `;

  card.addEventListener("click", () => card.classList.toggle("expanded"));
  return card;
}

function formatTimeString(timeStr) {
  return timeStr ? timeStr.slice(0, 5) : "";
}

function calculateDuration(origin, destination) {
  const dep = new Date(`${origin.date}T${origin.time}`);
  const arr = new Date(`${destination.date}T${destination.time}`);
  const diffMins = Math.floor((arr - dep) / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
}

function getLegsSummary(legs) {
  return legs
    .map((leg) => {
      const type = getTransportType(leg);
      const iconClass = getTransportClass(type);
      const icon = transportIcons[type] || "🚆";
      return `<span class="leg-icon ${iconClass}">${icon}</span>`;
    })
    .join('<span class="leg-arrow">→</span>');
}

/**
 * Extract transport type from leg data
 */
function getTransportType(leg) {
  // Handle walk legs
  if (!leg || leg.type === "WALK" || leg.type === "FOT") {
    return "WALK";
  }

  // Product is an array - get the first item
  const product = Array.isArray(leg.Product) ? leg.Product[0] : leg.Product;

  // DEBUG
  console.log("=== getTransportType DEBUG ===");
  console.log("leg.type:", leg.type);
  console.log("leg.name:", leg.name);
  console.log("leg.transportCategory:", leg.transportCategory);
  console.log("product:", product ? JSON.stringify(product, null, 2) : "null");
  console.log("==============================");

  // Check transportCategory
  if (leg.transportCategory) {
    console.log("Using transportCategory:", leg.transportCategory);
    return leg.transportCategory;
  }

  // Check product.catOutS
  if (product?.catOutS) {
    console.log("Using product.catOutS:", product.catOutS);
    return product.catOutS;
  }

  // Check product.catOutL (long name)
  if (product?.catOutL) {
    const longName = product.catOutL.toLowerCase();
    console.log("Checking product.catOutL:", longName);

    if (longName.includes("buss")) return "BUS";
    if (longName.includes("spårvagn") || longName.includes("spårv"))
      return "TRM";
    if (longName.includes("tunnelbana")) return "MET";
    if (longName.includes("pendeltåg")) return "JLT";
    if (longName.includes("lokalbana")) return "JLT";
    if (longName.includes("tvärbana")) return "TRM";
    if (longName.includes("båt")) return "BOAT";
    if (longName.includes("flyg")) return "FLY";
    if (longName.includes("tåg")) return "JRE";
    if (longName.includes("regional")) return "JRE";
  }

  // Check leg.name FIRST (it usually has the most descriptive name)
  if (leg.name) {
    const name = leg.name.toLowerCase();
    console.log("Checking leg.name:", name);
    if (name.includes("tunnelbana")) return "MET";
    if (name.includes("buss")) return "BUS";
    if (name.includes("spårv")) return "TRM";
    if (name.includes("pendeltåg")) return "JLT";
    if (name.includes("lokalbana")) return "JLT";
    if (name.includes("tvärbana")) return "TRM";
    if (name.includes("nockebybanan")) return "TRM";
    if (name.includes("lidingöbanan")) return "TRM";
    if (name.includes("roslagsbanan")) return "JLT";
    if (name.includes("saltsjöbanan")) return "JLT";
    if (name.includes("båt")) return "BOAT";
    if (name.includes("flyg")) return "FLY";
    if (name.includes("tåg") || name.includes("tag")) return "JRE";
  }

  // Check product.name
  if (product?.name) {
    const prodName = product.name.toLowerCase();
    console.log("Checking product.name:", prodName);
    if (prodName.includes("tunnelbana")) return "MET";
    if (prodName.includes("buss")) return "BUS";
    if (prodName.includes("spårv")) return "TRM";
    if (prodName.includes("pendeltåg")) return "JLT";
    if (prodName.includes("tvärbana")) return "TRM";
  }

  console.log("Defaulting to JRE");
  return "JRE";
}

function getTransportClass(type) {
  if (!type) return "walk";
  if (type.startsWith("J")) return "train";
  if (type === "BUS" || type === "TLB" || type === "COACH") return "bus";
  if (type === "TRM" || type === "HST") return "tram";
  if (type === "MET" || type === "URB") return "subway";
  if (type === "FOT" || type === "WALK") return "walk";
  if (type === "BOAT" || type === "SHIP" || type === "FERRY") return "boat";
  if (type === "FLY") return "flight";
  return "train";
}

function getTransfersText(legs) {
  const transportLegs = legs.filter((l) => l.type === "JNY");
  return transportLegs.length <= 1
    ? "Direct"
    : `${transportLegs.length - 1} transfer${transportLegs.length > 2 ? "s" : ""}`;
}

function getLegsDetail(legs) {
  return legs
    .map((leg) => {
      const type = getTransportType(leg);
      const icon = transportIcons[type] || "🚆";
      // Product is an array
      const product = Array.isArray(leg.Product) ? leg.Product[0] : leg.Product;
      const name = product?.name || transportNames[type] || "Walk";

      return `
            <div class="leg-detail">
                <div class="leg-time-line">
                    <span class="leg-dep-time">${formatTimeString(leg.Origin.time)}</span>
                    <span class="time-line"></span>
                    <span class="leg-arr-time">${formatTimeString(leg.Destination.time)}</span>
                </div>
                <div class="leg-info">
                    <div class="leg-station">${icon} ${formatLocationName(leg.Origin.name)}</div>
                    <div class="leg-line">→ ${name} to ${formatLocationName(leg.Destination.name)}</div>
                </div>
            </div>
        `;
    })
    .join("");
}

function showLoading() {
  resultsSection.classList.add("hidden");
  noResultsSection.classList.add("hidden");
  errorResultsSection.classList.add("hidden");
  loadingSection.classList.remove("hidden");
  searchBtn.disabled = true;
}

function hideLoading() {
  loadingSection.classList.add("hidden");
  searchBtn.disabled = false;
}

function showNoResults() {
  hideLoading();
  resultsSection.classList.add("hidden");
  errorResultsSection.classList.add("hidden");
  noResultsSection.classList.remove("hidden");
}

function showError(message) {
  hideLoading();
  resultsSection.classList.add("hidden");
  noResultsSection.classList.add("hidden");
  errorMessageEl.textContent = message;
  errorResultsSection.classList.remove("hidden");
}
