window.onload = () => {
  const episodes = getAllEpisodes();
  initializeEpisodesPage(episodes);
};

function initializeEpisodesPage(episodes) {
  renderEpisodeUI(episodes);
  setupSearch(episodes);
  setupDropdown(episodes);
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

  episodes.forEach((episode, index) => {
    const option = document.createElement("option");
    const episodeCode = formatEpisodeCode(episode.season, episode.number);
    option.value = index;
    option.textContent = `${episodeCode} - ${episode.name}`;
    dropdown.appendChild(option);
  });

  dropdown.addEventListener("change", (event) => {
    const selectedIndex = event.target.value;

    if (selectedIndex === "all") {
      renderEpisodeUI(episodes);
    } else {
      renderEpisodeUI([episodes[selectedIndex]]);
    }
  });
}