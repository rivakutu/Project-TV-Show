
window.onload = () => {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = '<p id="loading-message">Loading episodes...</p>';
  fetchEpisodes()
    .then((episodes) => {
      document.getElementById("loading-message")?.remove();
      initializeEpisodesPage(episodes);
    })
    .catch((err) => {
      document.getElementById("loading-message")?.remove();
      showError("Failed to load episodes. Please try again later.");
    });
};

let cachedEpisodes = null;
function fetchEpisodes() {
  if (cachedEpisodes) return Promise.resolve(cachedEpisodes);
  return fetch("https://api.tvmaze.com/shows/82/episodes")
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then((data) => {
      cachedEpisodes = data;
      return data;
    });
}

function showError(message) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = `<p style="color:red;">${message}</p>`;
}

function initializeEpisodesPage(episodes) {
  renderEpisodeUI(episodes);
  setupSearch(episodes);
  setupDropdown(episodes);
  setupShowAllEpisodesButton(episodes);
}

// Adds a button to show all episodes, hidden by default
function setupShowAllEpisodesButton(episodes) {
  let showAllBtn = document.getElementById("show-all-episodes-btn");
  if (!showAllBtn) {
    showAllBtn = document.createElement("button");
    showAllBtn.id = "show-all-episodes-btn";
    showAllBtn.textContent = "Show All Episodes";
    showAllBtn.style.display = "none";
    showAllBtn.style.margin = "10px";
    // Place after the dropdown
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
  };
}

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

  // Add a new footer once
  const footer = document.createElement("footer");
  footer.innerHTML =
    '<p>Data came from <a href="https://www.tvmaze.com/" target="_blank">TVMaze</a></p>';
  document.body.appendChild(footer);
}

function buildEpisodeCardFromTemplate(episode) {
  const template = document.getElementById("episode-card");
  const card = template.content.cloneNode(true);

  const titleElem = card.querySelector(".episode-title");
  const imageElem = card.querySelector(".episode-image");
  const summaryElem = card.querySelector(".episode-summary");

  const episodeCode = formatEpisodeCode(episode.season, episode.number);

  titleElem.textContent = `${episode.name} - ${episodeCode}`;
  imageElem.src = episode.image.medium;
  imageElem.alt = `Image from episode: ${episode.name}`;
  summaryElem.innerHTML = episode.summary;

  return card;
}

function formatEpisodeCode(season, episode) {
  const seasonStr = season.toString().padStart(2, "0");
  const episodeStr = episode.toString().padStart(2, "0");
  return `S${seasonStr}E${episodeStr}`;
}

function setupSearch(episodes) {
  const searchInput = document.getElementById("search-input");
  const searchCount = document.getElementById("search-count");

  searchInput.addEventListener("input", (event) => {
    const query = event.target.value.toLowerCase();

    const filteredEpisodes = episodes.filter((episode) => {
      return (
        episode.name.toLowerCase().includes(query) ||
        episode.summary.toLowerCase().includes(query)
      );
    });

    renderEpisodeUI(filteredEpisodes);
    searchCount.textContent = `Displaying ${filteredEpisodes.length} / ${episodes.length} episodes`;
  });
}

function setupDropdown(episodes) {
  const dropdown = document.getElementById("episode-selector");
  const rootElem = document.getElementById("root");

  // Clear previous options if any
  dropdown.innerHTML = "";

  // Add "Jump to..." option at the top
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

  dropdown.addEventListener("change", (event) => {
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