
// Caching (never fetch same URL more than once per visit)
let cachedShows = null; // array of show objects
const cachedEpisodesByShowId = {}; // map showId -> episodes array

// App state
let currentView = 'shows'; // 'shows' or 'episodes'
let currentShow = null; // currently selected show for episodes view

// Boot
window.onload = () => {
  const root = document.getElementById("root");
  root.innerHTML = '<p id="loading-message">Loading shows list...</p>';

  fetchShows()
    .then((shows) => {
      // loaded shows; show the shows listing page
      document.getElementById("loading-message")?.remove();
      showShowsListing(shows);
    })
    .catch((err) => {
      console.error(err);
      document.getElementById("loading-message")?.remove();
      showError("Failed to load shows. Please try again later.");
    });
};

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

// Shows listing page
function showShowsListing(shows) {
  currentView = 'shows';
  currentShow = null;
  
  // Hide episode controls and show search controls for shows
  setupShowsSearchUI();
  
  // Render shows listing
  renderShowsListing(shows);
  
  // Setup show search functionality
  setupShowSearch(shows);
}

function renderShowsListing(shows) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";
  
  // Remove episodes-view class if it exists
  rootElem.className = "";
  
  // Add title outside of the grid container by inserting before root
  let existingTitle = document.querySelector(".shows-title");
  if (existingTitle) existingTitle.remove();
  
  const titleDiv = document.createElement("div");
  titleDiv.className = "shows-title";
  titleDiv.innerHTML = '<h1 style="text-align: center; color: #333; margin: 2rem 0;">TV Shows</h1>';
  
  // Insert title before the root element
  rootElem.parentNode.insertBefore(titleDiv, rootElem);
  
  shows.forEach((show) => {
    const showCard = buildShowCard(show);
    rootElem.appendChild(showCard);
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

function buildShowCard(show) {
  const card = document.createElement("div");
  card.className = "show-card";
  card.style.cursor = "pointer";
  card.addEventListener("click", (e) => {
    // Don't trigger show selection if clicking on read more/less button
    if (e.target.classList.contains("read-more-btn")) {
      return;
    }
    selectShow(show);
  });
  
  const title = document.createElement("h3");
  title.className = "show-title";
  title.textContent = show.name;
  title.style.color = "#007acc";
  
  const image = document.createElement("img");
  image.className = "show-image";
  image.src = show.image?.medium || "";
  image.alt = `Image from show: ${show.name}`;
  
  const details = document.createElement("div");
  details.className = "show-details";
  
  const genres = document.createElement("p");
  genres.innerHTML = `<strong>Genres:</strong> ${(show.genres || []).join(", ") || "N/A"}`;
  
  const status = document.createElement("p");
  status.innerHTML = `<strong>Status:</strong> ${show.status || "N/A"}`;
  
  const rating = document.createElement("p");
  rating.innerHTML = `<strong>Rating:</strong> ${show.rating?.average || "N/A"}`;
  
  const runtime = document.createElement("p");
  runtime.innerHTML = `<strong>Runtime:</strong> ${show.runtime ? show.runtime + " minutes" : "N/A"}`;
  
  const summary = document.createElement("div");
  summary.className = "show-summary";
  
  if (show.summary) {
    const cleanSummary = show.summary.replace(/<[^>]*>/g, ''); // Remove HTML tags
    const shortSummary = cleanSummary.length > 200 ? cleanSummary.substring(0, 200) + "..." : cleanSummary;
    const fullSummary = cleanSummary;
    
    const summaryText = document.createElement("p");
    summaryText.innerHTML = `<strong>Summary:</strong> ${shortSummary}`;
    
    if (cleanSummary.length > 200) {
      const readMoreBtn = document.createElement("button");
      readMoreBtn.textContent = "Read More";
      readMoreBtn.className = "read-more-btn";
      readMoreBtn.style.marginLeft = "5px";
      readMoreBtn.style.color = "#007acc";
      readMoreBtn.style.background = "none";
      readMoreBtn.style.border = "1px solid #007acc";
      readMoreBtn.style.cursor = "pointer";
      readMoreBtn.style.padding = "2px 6px";
      readMoreBtn.style.fontSize = "12px";
      
      readMoreBtn.addEventListener("click", () => {
        if (readMoreBtn.textContent === "Read More") {
          summaryText.innerHTML = `<strong>Summary:</strong> ${fullSummary}`;
          readMoreBtn.textContent = "Read Less";
        } else {
          summaryText.innerHTML = `<strong>Summary:</strong> ${shortSummary}`;
          readMoreBtn.textContent = "Read More";
        }
      });
      
      summaryText.appendChild(readMoreBtn);
    }
    
    summary.appendChild(summaryText);
  } else {
    summary.innerHTML = '<p><strong>Summary:</strong> N/A</p>';
  }
  
  details.appendChild(genres);
  details.appendChild(status);
  details.appendChild(rating);
  details.appendChild(runtime);
  details.appendChild(summary);
  
  card.appendChild(title);
  card.appendChild(image);
  card.appendChild(details);
  
  return card;
}

function selectShow(show) {
  currentShow = show;
  currentView = 'episodes';
  
  // Clear root and show loading
  const root = document.getElementById("root");
  root.innerHTML = '<p id="loading-episodes">Loading episodes...</p>';
  
  fetchEpisodesForShow(show.id)
    .then((episodes) => {
      document.getElementById("loading-episodes")?.remove();
      showEpisodesListing(episodes);
    })
    .catch((err) => {
      console.error(err);
      document.getElementById("loading-episodes")?.remove();
      showError("Failed to load episodes for this show. Please try again later.");
    });
}

function showEpisodesListing(episodes) {
  // Setup episode controls
  setupEpisodesSearchUI();
  
  // Initialize the episodes page
  initializeEpisodesPage(episodes);
}

// UI Setup for different views
function setupShowsSearchUI() {
  // Hide episode-specific controls
  const episodeSelector = document.getElementById("episode-selector");
  const showAllBtn = document.getElementById("show-all-episodes-btn");
  
  if (episodeSelector) episodeSelector.style.display = "none";
  if (showAllBtn) showAllBtn.style.display = "none";
  
  // Show and setup search input for shows
  const searchInput = document.getElementById("search-input");
  const searchCount = document.getElementById("search-count");
  
  if (searchInput) {
    searchInput.style.display = "inline-block";
    searchInput.placeholder = "Search shows...";
    searchInput.value = "";
  }
  if (searchCount) searchCount.textContent = "";
}

function setupEpisodesSearchUI() {
  // Show episode controls
  const episodeSelector = document.getElementById("episode-selector");
  if (episodeSelector) episodeSelector.style.display = "inline-block";
  
  // Update search placeholder
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.placeholder = "Search episodes...";
    searchInput.value = "";
  }
  
  // Add back to shows navigation
  addBackToShowsNavigation();
}

function addBackToShowsNavigation() {
  // Remove existing nav if present
  const existingNav = document.querySelector(".episodes-navigation");
  if (existingNav) existingNav.remove();
  
  // Also remove any shows navigation that might still be there
  const showsNav = document.querySelector(".shows-navigation");
  if (showsNav) showsNav.remove();
  
  const nav = document.createElement("div");
  nav.className = "episodes-navigation";
  nav.style.marginBottom = "2rem";
  nav.style.textAlign = "left";
  nav.style.backgroundColor = "#fff";
  nav.style.padding = "1rem";
  nav.style.borderRadius = "6px";
  nav.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
  nav.style.width = "100%";
  nav.style.boxSizing = "border-box";
  
  const backBtn = document.createElement("button");
  backBtn.textContent = "← Back to Shows";
  backBtn.style.marginRight = "1rem";
  backBtn.style.padding = "10px 16px";
  backBtn.style.backgroundColor = "#007acc";
  backBtn.style.color = "white";
  backBtn.style.border = "none";
  backBtn.style.cursor = "pointer";
  backBtn.style.borderRadius = "4px";
  backBtn.style.fontSize = "14px";
  backBtn.style.fontWeight = "bold";
  
  backBtn.addEventListener("click", () => {
    fetchShows().then(shows => showShowsListing(shows));
  });
  
  const title = document.createElement("span");
  title.innerHTML = `<strong style="font-size: 1.2rem;">Episodes: ${currentShow ? currentShow.name : ''}</strong>`;
  
  nav.appendChild(backBtn);
  nav.appendChild(title);
  
  // Insert at the beginning of the root
  const root = document.getElementById("root");
  root.insertBefore(nav, root.firstChild);
}

// Show search functionality
function setupShowSearch(shows) {
  const searchInput = document.getElementById("search-input");
  const searchCount = document.getElementById("search-count");
  
  if (!searchInput) return;
  if (searchCount) searchCount.textContent = `Displaying ${shows.length} / ${shows.length} shows`;
  
  // Remove previous handler by cloning node trick
  const newSearch = searchInput.cloneNode(true);
  searchInput.parentNode.replaceChild(newSearch, searchInput);
  
  newSearch.addEventListener("input", (event) => {
    const query = event.target.value.toLowerCase();
    
    const filteredShows = shows.filter((show) => {
      return (
        (show.name || "").toLowerCase().includes(query) ||
        (show.summary || "").toLowerCase().includes(query) ||
        (show.genres || []).some(genre => genre.toLowerCase().includes(query))
      );
    });
    
    // Only re-render the shows, don't re-setup search
    renderShowsListingFiltered(filteredShows, shows.length);
    if (searchCount) searchCount.textContent = `Displaying ${filteredShows.length} / ${shows.length} shows`;
  });
}

// Separate function for rendering filtered results without re-setting up search
function renderShowsListingFiltered(shows, totalCount) {
  const rootElem = document.getElementById("root");
  
  // Clear only the show cards, keep the title
  const existingCards = rootElem.querySelectorAll(".show-card");
  existingCards.forEach(card => card.remove());
  
  shows.forEach((show) => {
    const showCard = buildShowCard(show);
    rootElem.appendChild(showCard);
  });
  
  // Update footer
  const oldFooter = document.querySelector("footer");
  if (oldFooter) {
    oldFooter.remove();
  }
  
  const footer = document.createElement("footer");
  footer.innerHTML =
    '<p>Data came from <a href="https://www.tvmaze.com/" target="_blank">TVMaze</a></p>';
  document.body.appendChild(footer);
}

// clear previous UI controls / root for episodes view
function clearRootAndControls() {
  const root = document.getElementById("root");
  root.innerHTML = ""; // remove episode cards, any search UI created earlier
  // reset search-count and episode-selector if present
  const searchCount = document.getElementById("search-count");
  if (searchCount) searchCount.textContent = "";
  const epSelector = document.getElementById("episode-selector");
  if (epSelector) epSelector.innerHTML = '<option value="">Jump to episode...</option>';
  // remove any footer to be re-added by renderEpisodeUI
  const oldFooter = document.querySelector("footer");
  if (oldFooter) oldFooter.remove();
  // remove any navigation
  const existingNav = document.querySelector(".episodes-navigation");
  if (existingNav) existingNav.remove();
  // remove any shows navigation that might still be there
  const showsNav = document.querySelector(".shows-navigation");
  if (showsNav) showsNav.remove();
  // remove shows title
  const showsTitle = document.querySelector(".shows-title");
  if (showsTitle) showsTitle.remove();
}

// Show user-facing error message in root area
function showError(message) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = `<p style="color:red;">${message}</p>`;
}

// initialize page for a given episodes array (render UI + controls)
function initializeEpisodesPage(episodes) {
  // Clear any existing content first
  clearRootAndControls();
  // Add navigation first
  addBackToShowsNavigation();
  // render episodes and set up search & dropdown
  renderEpisodeUI(episodes);
  setupSearch(episodes);
  setupDropdown(episodes);
  setupShowAllEpisodesButton(episodes);
}

// Rendering episodes using template (template id = "episode-card")
function renderEpisodeUI(episodes) {
  const rootElem = document.getElementById("root");
  // Don't clear root here as navigation was already added
  
  // Add episodes-view class for different styling
  rootElem.className = "episodes-view";
  
  // Remove only episode cards, keep navigation
  const existingCards = rootElem.querySelectorAll(".episode-card");
  existingCards.forEach(card => card.remove());

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
