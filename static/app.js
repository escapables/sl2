/**
 * Svensk Pendeldashboard - Frontend JavaScript
 * Säker API-nyckellagring med förvrängning
 */

// DOM Elements - API Key Modal
const apiKeyModal = document.getElementById("api-key-modal");
const apiKeyInput = document.getElementById("api-key-input");
const rememberKeyCheckbox = document.getElementById("remember-key");
const closeModalBtn = document.getElementById("close-modal");
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

// Transporttypsikoner - utökad för alla svenska transporttyper
const transportIcons = {
  // Tåg
  JRE: "🚆",
  JIC: "🚄",
  JBL: "🚅",
  JLT: "🚃",
  JLX: "🚂",
  JEX: "🚄",
  // Busssar
  BUS: "🚌",
  TLB: "🚌",
  COACH: "🚌",
  BLT: "🚌",
  // Spårvagnar/Lätt räls
  TRM: "🚊",
  HST: "🚊",
  SLT: "🚊",
  // Tunnelbana
  MET: "🚇",
  URB: "🚇",
  ULT: "🚉",
  // Övrigt
  FOT: "🚶",
  WALK: "🚶",
  TRSF: "⏱️",
  BOAT: "⛴️",
  SHIP: "🚢",
  FLY: "✈️",
  TAXI: "🚕",
  FUN: "🚡",
  FERRY: "⛴️",
};

const transportNames = {
  JRE: "Regionaltåg",
  JIC: "InterCity",
  JBL: "Snabbtåg",
  JLT: "Lokaltåg",
  JLX: "Nattåg",
  JEX: "Expresståg",
  BUS: "Bus",
  TLB: "Bus",
  COACH: "Långfärdsbuss",
  BLT: "Bus",
  TRM: "Spårvagn",
  HST: "Spårvagn",
  SLT: "Spårvagn",
  MET: "Tunnelbana",
  URB: "Pendeltåg",
  ULT: "Tunnelbana",
  FOT: "Promenad",
  WALK: "Promenad",
  TRSF: "Byte",
  BOAT: "Färja",
  SHIP: "Fartyg",
  FLY: "Flyg",
  TAXI: "Taxi",
  FUN: "Linbana",
  FERRY: "Färja",
};

// ==================== API-NYCKELSÄKERHET ====================

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
    console.log("Avförvrängd nyckel, längd:", result.length);
    return result;
  } catch (e) {
    console.error("Kunde inte avförvränga nyckel:", e);
    return "";
  }
}

function saveApiKey(key, remember) {
  console.log("saveApiKey anropad, remember:", remember);
  currentApiKey = key;
  if (remember) {
    const obfuscated = obfuscateKey(key);
    console.log("Sparar nyckel till localStorage, längd:", obfuscated.length);
    try {
      localStorage.setItem("trafiklab_api_key", obfuscated);
      localStorage.setItem("trafiklab_key_saved", "true");
      console.log("Nyckel sparad framgångsrikt");
    } catch (e) {
      console.error("Kunde inte spara till localStorage:", e);
    }
  } else {
    console.log("Sparar inte nyckel (remember är false)");
    localStorage.removeItem("trafiklab_api_key");
    localStorage.removeItem("trafiklab_key_saved");
  }
  updateKeyStatus();
}

function loadApiKey() {
  const saved = localStorage.getItem("trafiklab_api_key");
  console.log("localStorage har nyckel:", !!saved);
  if (saved) {
    currentApiKey = deobfuscateKey(saved);
    console.log(
      "Deobfuscated key length:",
      currentApiKey ? currentApiKey.length : 0,
    );
    if (currentApiKey) {
      console.log("API-nyckel laddad från localStorage");
    } else {
      console.warn("Kunde inte avförvränga nyckel, rensar lagring");
      localStorage.removeItem("trafiklab_api_key");
      localStorage.removeItem("trafiklab_key_saved");
    }
    return !!currentApiKey;
  }
  console.log("Ingen API-nyckel hittades i localStorage");
  return false;
}

function getApiKey() {
  return currentApiKey;
}

function updateKeyStatus() {
  if (currentApiKey) {
    keyStatus.classList.remove("hidden");
    const saved = localStorage.getItem("trafiklab_api_key");
    keyStatus.textContent = saved
      ? "🔒 Nyckel sparad"
      : "🔒 Nyckel aktiv (session)";
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
  console.log("hideApiKeyModal anropad");
  apiKeyModal.classList.add("hidden");
}

function canCloseModal() {
  // Only allow closing if we have a valid API key
  return !!currentApiKey;
}

async function validateAndSaveApiKey() {
  const key = apiKeyInput.value.trim();
  if (!key) {
    showApiKeyError("Vänligen ange en API-nyckel");
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
      console.log(
        "Key validated, checkbox checked:",
        rememberKeyCheckbox.checked,
      );
      saveApiKey(key, rememberKeyCheckbox.checked);
      hideApiKeyModal();
    } else {
      const data = await resp.json();
      showApiKeyError(data.error || "Ogiltig API-nyckel");
    }
  } catch (e) {
    showApiKeyError("Kunde inte validera nyckel. Vänligen försök igen.");
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
    throw new Error("API-nyckel inte konfigurerad");
  }

  const resp = await fetch(url, {
    headers: { "X-API-Key": key },
  });

  if (resp.status === 401) {
    showApiKeyModal();
    throw new Error("API-nyckel ogiltig");
  }

  return resp;
}

// ==================== INITIERING ====================

document.addEventListener("DOMContentLoaded", () => {
  console.log("Dashboard initieras...");
  console.log("localStorage-innehåll:", { ...localStorage });
  console.log(
    "Modal initial hidden state:",
    apiKeyModal.classList.contains("hidden"),
  );
  initializeDateTime();
  setupEventListeners();

  const hasKey = loadApiKey();
  console.log(
    "API key loaded result:",
    hasKey,
    "currentApiKey present:",
    !!currentApiKey,
  );
  if (!hasKey) {
    console.log("Ingen giltig nyckel, visar modal");
    showApiKeyModal();
  } else {
    console.log("Nyckel hittad, döljer modal");
    hideApiKeyModal();
    updateKeyStatus();
    console.log("API-nyckel aktiv, redo att söka");
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

  // Close modal button
  closeModalBtn.addEventListener("click", () => {
    if (canCloseModal()) {
      hideApiKeyModal();
    } else {
      // Shake animation or error message could go here
      apiKeyError.textContent = "Vänligen ange en API-nyckel för att fortsätta";
      apiKeyError.classList.remove("hidden");
    }
  });

  // Click outside modal to close
  apiKeyModal.addEventListener("click", (e) => {
    if (e.target === apiKeyModal) {
      if (canCloseModal()) {
        hideApiKeyModal();
      } else {
        apiKeyError.textContent = "Please enter an API key to continue";
        apiKeyError.classList.remove("hidden");
      }
    }
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

// ==================== PLATSSÖKNING ====================

function debouncedSearch(query, type) {
  clearTimeout(searchTimeout);
  if (query.length < 2) {
    hideSuggestions(type);
    return;
  }
  console.log(`[${type}] Fördröjd sökning efter: "${query}"`);
  searchTimeout = setTimeout(() => searchLocations(query, type), 400);
}

async function searchLocations(query, type) {
  const container = type === "from" ? fromSuggestions : toSuggestions;

  const key = getApiKey();
  if (!key) {
    console.log(`[${type}] Ingen API-nyckel konfigurerad, visar modal`);
    showApiKeyModal();
    return;
  }

  console.log(`[${type}] Söker efter: "${query}"`);
  container.innerHTML =
    '<div class="suggestion-item"><span class="loading-text">Söker...</span></div>';
  container.classList.add("active");

  try {
    const url = `/api/search?q=${encodeURIComponent(query)}`;
    console.log(`[${type}] Hämtar:`, url);

    const resp = await fetch(url, {
      headers: { "X-API-Key": key },
    });

    console.log(`[${type}] Svarstatus:`, resp.status);

    if (resp.status === 401) {
      showApiKeyModal();
      throw new Error("API key invalid");
    }

    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }

    const data = await resp.json();
    console.log(`[${type}] Svarsdata:`, data);

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

    console.log(`[${type}] Tolkade platser:`, locations);

    displaySuggestions(locations, type);
  } catch (e) {
    console.error(`[${type}] Sökfel:`, e);
    container.innerHTML =
      '<div class="suggestion-item error"><span class="error-text">Sökning misslyckades. Kontrollera konsolen.</span></div>';
    setTimeout(() => hideSuggestions(type), 2000);
  }
}

function displaySuggestions(locations, type) {
  console.log(`[${type}] Visar ${locations ? locations.length : 0} förslag`);
  const container = type === "from" ? fromSuggestions : toSuggestions;
  container.innerHTML = "";

  if (type === "from") {
    currentFromSuggestions = locations || [];
  } else {
    currentToSuggestions = locations || [];
  }

  if (!locations || locations.length === 0) {
    container.innerHTML =
      '<div class="suggestion-item no-results"><span class="no-results-text">Inga stationer hittades</span></div>';
    setTimeout(() => hideSuggestions(type), 2000);
    return;
  }

  locations.slice(0, 8).forEach((loc) => {
    if (!loc || !loc.name) {
      console.log("Hoppar över plats utan namn:", loc);
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
      ? `${loc.dist}m bort`
      : locType === "ST"
        ? "Station"
        : "Adress";

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
    console.error("Kan inte välja plats utan namn:", location);
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

async function getCurrentLocation(type) {
  if (!navigator.geolocation) {
    alert("Geolokalisering stöds inte av din webbläsare");
    return;
  }

  const input = type === "from" ? fromInput : toInput;
  input.placeholder = "Lokalisera...";

  // Check permission state if available
  if (navigator.permissions) {
    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      console.log("Geolokaliseringsbehörighetstillstånd:", result.state);
      if (result.state === "denied") {
        input.placeholder = "Platsbehörighet nekad i webbläsarinställningar";
        return;
      }
    } catch (e) {
      console.log("Kunde inte fråga om behörighet:", e);
    }
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      console.log(
        "Geolocation success:",
        position.coords.latitude,
        position.coords.longitude,
      );
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
          input.placeholder = "Inga närliggande hållplatser hittades";
        }
      } catch (e) {
        console.error("Kunde inte hämta närliggande hållplatser:", e);
        input.placeholder = "Fel vid lokalisering";
      }
    },
    (error) => {
      console.error(
        "Geolocation error code:",
        error.code,
        "message:",
        error.message,
      );
      let errorMsg = "Location error";
      switch (error.code) {
        case 1:
          errorMsg = "Platsåtkomst nekad";
          break;
        case 2:
          errorMsg = "Plats otillgänglig";
          break;
        case 3:
          errorMsg = "Plats timeout";
          break;
      }
      input.placeholder = errorMsg;
    },
    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60000,
    },
  );
}

// ==================== RuttsÖKNING ====================

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
    alert("Vänligen ange både ursprung och destination");
    return;
  }

  if (!fromId && !toId) {
    alert(
      "Vänligen välj giltiga platser från dropdown för både ursprung och destination",
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

  if (fromId === toId) {
    alert(
      "Origin and destination cannot be the same. Please select different locations.",
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
      console.log(`Ruttdatum: ${dateVal}`);
    }

    if (timeVal) {
      url += `&time=${timeVal}`;
    }

    console.log(`Route request: ${url}`);

    const resp = await apiFetch(url);
    const data = await resp.json();

    console.log("Ruttsvar:", data);

    if (data.error) {
      console.error("Rutt API-fel:", data);
      showError(
        `Ruttsökning misslyckades: ${data.error}${data.details ? " - " + data.details : ""}`,
      );
    } else if (data.Trip?.length > 0) {
      displayTrips(data.Trip);
    } else {
      showNoResults();
    }
  } catch (e) {
    console.error("Ruttsökningsfel:", e);
    hideLoading();
    showError(`Ruttsökning misslyckades: ${e.message}`);
  }
}

// ==================== VISA RESULTAT ====================

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

  // Handle transfer/waiting legs
  if (leg.type === "TRSF") {
    return "TRSF";
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
    console.log("Använder transportCategory:", leg.transportCategory);
    return leg.transportCategory;
  }

  // Check product.catOutS
  if (product?.catOutS) {
    console.log("Använder product.catOutS:", product.catOutS);
    // Map codes for icon consistency
    if (product.catOutS === "SLT") return "TRM";
    if (product.catOutS === "BLT") return "BUS";
    return product.catOutS;
  }

  // Check product.catOutL (long name)
  if (product?.catOutL) {
    const longName = product.catOutL.toLowerCase();
    console.log("Kontrollerar product.catOutL:", longName);

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
    console.log("Kontrollerar leg.name:", name);
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
    console.log("Kontrollerar product.name:", prodName);
    if (prodName.includes("tunnelbana")) return "MET";
    if (prodName.includes("buss")) return "BUS";
    if (prodName.includes("spårv")) return "TRM";
    if (prodName.includes("pendeltåg")) return "JLT";
    if (prodName.includes("tvärbana")) return "TRM";
  }

  console.log("Återgår till JRE");
  return "JRE";
}

function getTransportClass(type) {
  if (!type) return "walk";
  if (type.startsWith("J")) return "train";
  if (type === "BUS" || type === "TLB" || type === "COACH" || type === "BLT")
    return "bus";
  if (type === "TRM" || type === "HST" || type === "SLT") return "tram";
  if (type === "MET" || type === "URB" || type === "ULT") return "subway";
  if (type === "FOT" || type === "WALK") return "walk";
  if (type === "TRSF") return "transfer";
  if (type === "BOAT" || type === "SHIP" || type === "FERRY") return "boat";
  if (type === "FLY") return "flight";
  return "train";
}

function getTransfersText(legs) {
  const transportLegs = legs.filter((l) => l.type === "JNY");
  return transportLegs.length <= 1
    ? "Direkt"
    : `${transportLegs.length - 1} byte${transportLegs.length > 2 ? "n" : ""}`;
}

function getLegsDetail(legs) {
  return legs
    .map((leg) => {
      const type = getTransportType(leg);
      const icon = transportIcons[type] || "🚆";
      // Product is an array
      const product = Array.isArray(leg.Product) ? leg.Product[0] : leg.Product;
      let name = product?.name || transportNames[type] || "Gång";

      // Lägg till operatörsprefix för icke-SL/Länstrafik-operatörer
      const operator = product?.operator || product?.operatorInfo?.name;
      if (operator && operator !== "SL" && !operator.includes("Länstrafik")) {
        name = `${operator} ${name}`;
      }

      return `
            <div class="leg-detail">
                <div class="leg-time-line">
                    <span class="leg-dep-time">${formatTimeString(leg.Origin.time)}</span>
                    <span class="time-line"></span>
                    <span class="leg-arr-time">${formatTimeString(leg.Destination.time)}</span>
                </div>
                <div class="leg-info">
                    <div class="leg-station">${icon} ${formatLocationName(leg.Origin.name)}</div>
                    <div class="leg-line">→ ${name} till ${formatLocationName(leg.Destination.name)}</div>
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
