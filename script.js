// script.js - Level 400
// Assumes index.html contains:
//  - <input id="search-input">, <span id="search-count">, <select id="episode-selector">
//  - <main id="root"></main>
//  - <template id="episode-card"> ... </template>

// -----------------------------
// Caching (never fetch same URL more than once per visit)
let cachedShows = null; // array of show objects
const cachedEpisodesByShowId = {}; // map showId -> episodes array

// -----------------------------
// Boot
window.onload = () => {
  const root = document.getElementById("root");
  root.innerHTML = '<p id="loading-message">Loading shows list...</p>';

  fetchShows()
    .then((shows) => {
      // loaded shows; create show selector UI
      document.getElementById("loading-message")?.remove();
      createShowSelector(shows);
      // Optionally: select first show automatically, or wait for user selection.
      // We'll wait for user selection to avoid extra fetches.
    })
    .catch((err) => {
      console.error(err);
      document.getElementById("loading-message")?.remove();
      showError("Failed to load shows. Please try again later.");
    });
};

// -----------------------------
// Fetch helpers
function fetchShows() {
  if (cachedShows) return Promise.resolve(cachedShows);

  return fetch("https://api.tvmaze.com/shows")
    .then((res) => {
      if (!res.ok) throw new Error(`Shows fetch failed: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      // Cache and return, but sort alphabetically case-insensitive for selector usage
      cachedShows = data.slice().sort((a, b) => {
        const an = (a.name || "").toLowerCase();
        const bn = (b.name || "").toLowerCase();
        if (an < bn) return -1;
        if (an > bn) return 1;
        return 0;
      });
      return cachedShows;
    });
}

function fetchEpisodesForShow(showId) {
  if (cachedEpisodesByShowId[showId]) {
    return Promise.resolve(cachedEpisodesByShowId[showId]);
  }
  const url = `https://api.tvmaze.com/shows/${showId}/episodes`;
  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Episodes fetch failed: ${res.status}`);
      return res.json();
    })
    .then((episodes) => {
      cachedEpisodesByShowId[showId] = episodes;
      return episodes;
    });
}

// -----------------------------
// UI: show selector creation
function createShowSelector(shows) {
  // create a top area above root for show selection if not already present
  let showSelector = document.getElementById("show-selector");
  if (!showSelector) {
    // put show selector before header elements if header exists, else at top of body
    const header = document.querySelector("header");
    const container = document.createElement("div");
    container.className = "show-selector-container";
    container.style.textAlign = "center";
    container.style.marginBottom = "1rem";

    const label = document.createElement("label");
    label.htmlFor = "show-selector";
    label.style.marginRight = "0.5rem";
    label.textContent = "Choose show:";

    showSelector = document.createElement("select");
    showSelector.id = "show-selector";

    container.appendChild(label);
    container.appendChild(showSelector);

    if (header && header.parentNode) {
      header.parentNode.insertBefore(container, header);
    } else {
      document.body.insertBefore(container, document.body.firstChild);
    }
  }

  // Populate options: default + shows from cachedShows (already sorted)
  showSelector.innerHTML = ""; // clear
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "Select a show...";
  showSelector.appendChild(defaultOpt);

  shows.forEach((show) => {
    const opt = document.createElement("option");
    opt.value = show.id; // value is show id for fetching episodes
    opt.textContent = show.name;
    showSelector.appendChild(opt);
  });

  // Listen for selection
  showSelector.addEventListener("change", (e) => {
    const showId = e.target.value;
    // reset UI placeholders
    clearRootAndControls();
    if (!showId) {
      // no show selected; nothing to display
      return;
    }

    // Show loading while fetching episodes for this show
    const root = document.getElementById("root");
    const loading = document.createElement("p");
    loading.id = "loading-episodes";
    loading.textContent = "Loading episodes for selected show...";
    root.appendChild(loading);

    fetchEpisodesForShow(showId)
      .then((episodes) => {
        document.getElementById("loading-episodes")?.remove();
        // Initialize the page for these episodes (render UI + search + dropdown + show all)
        initializeEpisodesPage(episodes);
      })
      .catch((err) => {
        console.error(err);
        document.getElementById("loading-episodes")?.remove();
        showError("Failed to load episodes for this show. Please try again later.");
      });
  });
}

// -----------------------------
// clear previous UI controls / root but keep show selector
function clearRootAndControls() {
  const root = document.getElementById("root");
  root.innerHTML = ""; // remove episode cards, any search UI created earlier
  // reset search-count and episode-selector if present
  const searchCount = document.getElementById("search-count");
  if (searchCount) searchCount.textContent = "";
  const epSelector = document.getElementById("episode-selector");
  if (epSelector) epSelector.innerHTML = '<option value="all">All episodes</option>';
  // remove any footer to be re-added by renderEpisodeUI
  const oldFooter = document.querySelector("footer");
  if (oldFooter) oldFooter.remove();
}

// Show user-facing error message in root area
function showError(message) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = `<p style="color:red;">${message}</p>`;
}

// -----------------------------
// initialize page for a given episodes array (render UI + controls)
function initializeEpisodesPage(episodes) {
  // render episodes and set up search & dropdown
  renderEpisodeUI(episodes);
  setupSearch(episodes);
  setupDropdown(episodes);
  setupShowAllEpisodesButton(episodes);
}

// Rendering episodes using template (template id = "episode-card")
function renderEpisodeUI(episodes) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";

  episodes.forEach((episode) => {
    const episodeCard = buildEpisodeCardFromTemplate(episode);
    rootElem.appendChild(episodeCard);
  });

  // Remove existing footer (if any)
  const oldFooter = document.querySelector("footer");
  if (oldFooter) {
    oldFooter.remove();
  }

  // Add footer
  const footer = document.createElement("footer");
  footer.innerHTML =
    '<p>Data came from <a href="https://www.tvmaze.com/" target="_blank">TVMaze</a></p>';
  document.body.appendChild(footer);
}

// Builds card from template id="episode-card"
function buildEpisodeCardFromTemplate(episode) {
  const template = document.getElementById("episode-card");
  const card = template.content.cloneNode(true);

  const titleElem = card.querySelector(".episode-title");
  const imageElem = card.querySelector(".episode-image");
  const summaryElem = card.querySelector(".episode-summary");

  const episodeCode = formatEpisodeCode(episode.season, episode.number);

  titleElem.textContent = `${episode.name} - ${episodeCode}`;
  imageElem.src = episode.image?.medium || "";
  imageElem.alt = `Image from episode: ${episode.name}`;
  summaryElem.innerHTML = episode.summary || "";

  return card;
}

function formatEpisodeCode(season, episode) {
  const seasonStr = season.toString().padStart(2, "0");
  const episodeStr = episode.toString().padStart(2, "0");
  return `S${seasonStr}E${episodeStr}`;
}

// Search input wiring (assumes existing input id="search-input" and #search-count span)
function setupSearch(episodes) {
  const searchInput = document.getElementById("search-input");
  const searchCount = document.getElementById("search-count");

  if (!searchInput) return;
  if (searchCount) searchCount.textContent = `Displaying ${episodes.length} / ${episodes.length} episodes`;

  // remove previous handler by cloning node trick (to avoid stacking handlers on repeated initializations)
  const newSearch = searchInput.cloneNode(true);
  searchInput.parentNode.replaceChild(newSearch, searchInput);

  newSearch.addEventListener("input", (event) => {
    const query = event.target.value.toLowerCase();

    const filteredEpisodes = episodes.filter((episode) => {
      return (
        (episode.name || "").toLowerCase().includes(query) ||
        (episode.summary || "").toLowerCase().includes(query)
      );
    });

    renderEpisodeUI(filteredEpisodes);
    if (searchCount) searchCount.textContent = `Displaying ${filteredEpisodes.length} / ${episodes.length} episodes`;
  });
}

// Episode dropdown wiring (assumes id="episode-selector" present)
function setupDropdown(episodes) {
  const dropdown = document.getElementById("episode-selector");
  if (!dropdown) return;

  // Clear previous options
  dropdown.innerHTML = "";

  // Add default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Jump to episode...";
  dropdown.appendChild(defaultOption);

  episodes.forEach((episode, index) => {
    const option = document.createElement("option");
    const episodeCode = formatEpisodeCode(episode.season, episode.number);
    option.value = index;
    option.textContent = `${episodeCode} - ${episode.name}`;
    dropdown.appendChild(option);
  });

  // remove previous change handlers (clone trick)
  const newDropdown = dropdown.cloneNode(true);
  dropdown.parentNode.replaceChild(newDropdown, dropdown);

  newDropdown.addEventListener("change", (event) => {
    const selectedIndex = event.target.value;
    const showAllBtn = document.getElementById("show-all-episodes-btn");
    if (selectedIndex === "") {
      if (showAllBtn) showAllBtn.style.display = "none";
      return;
    }
    renderEpisodeUI([episodes[selectedIndex]]);
    if (showAllBtn) showAllBtn.style.display = "inline-block";
  });
}

// Show-all button setup (creates a button with id="show-all-episodes-btn" if needed)
function setupShowAllEpisodesButton(episodes) {
  let showAllBtn = document.getElementById("show-all-episodes-btn");
  if (!showAllBtn) {
    showAllBtn = document.createElement("button");
    showAllBtn.id = "show-all-episodes-btn";
    showAllBtn.textContent = "Show All Episodes";
    showAllBtn.style.display = "none";
    showAllBtn.style.margin = "10px";

    // try to place after the episode selector if present
    const dropdown = document.getElementById("episode-selector");
    if (dropdown && dropdown.parentNode) {
      dropdown.parentNode.insertBefore(showAllBtn, dropdown.nextSibling);
    } else {
      document.body.appendChild(showAllBtn);
    }
  }

  showAllBtn.onclick = () => {
    renderEpisodeUI(episodes);
    showAllBtn.style.display = "none";
    const dropdown = document.getElementById("episode-selector");
    if (dropdown) dropdown.value = "";
    const searchInput = document.getElementById("search-input");
    if (searchInput) searchInput.value = "";
    const searchCount = document.getElementById("search-count");
    if (searchCount) searchCount.textContent = `Displaying ${episodes.length} / ${episodes.length} episodes`;
  };
}
