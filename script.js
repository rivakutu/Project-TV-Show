window.onload = initializeEpisodesPage;

let allEpisodes = [];

function initializeEpisodesPage() {
  allEpisodes = getAllEpisodes();
  renderUI(allEpisodes);
  setupSearchInput();
  setupEpisodeSelector();
}

function renderUI(episodeList) {
  clearRoot();
  renderAllEpisodes(episodeList);
  const footer = createAttributionFooter();
  document.getElementById("root").appendChild(footer);
  updateSearchCount(episodeList.length, allEpisodes.length);
}

function clearRoot() {
  document.getElementById("root").innerHTML = "";
}

function renderAllEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  episodeList.forEach((episode) => {
    const card = buildEpisodeCard(episode);
    rootElem.appendChild(card);
  });
}

function buildEpisodeCard(episode) {
  const card = document.createElement("div");
  card.className = "episode-card";

  const title = createEpisodeTitle(episode);
  const image = createEpisodeImage(episode);
  const summary = createEpisodeSummary(episode);

  card.appendChild(title);
  card.appendChild(image);
  card.appendChild(summary);

  return card;
}

function createEpisodeTitle(episode) {
  const episodeCode = formatEpisodeCode(episode.season, episode.number);
  const title = document.createElement("h3");
  title.textContent = `${episode.name} - ${episodeCode}`;
  return title;
}

function createEpisodeImage(episode) {
  const image = document.createElement("img");
  image.src = episode.image.medium;
  image.alt = `Image from episode: ${episode.name}`;
  return image;
}

function createEpisodeSummary(episode) {
  const summary = document.createElement("div");
  summary.className = "episode-summary";
  summary.innerHTML = episode.summary;
  return summary;
}

function createAttributionFooter() {
  const footer = document.createElement("footer");
  footer.innerHTML =
    '<p>Data provided by <a href="https://www.tvmaze.com/" target="_blank">TVMaze.com</a></p>';
  return footer;
}

function formatEpisodeCode(season, episode) {
  const seasonStr = season.toString().padStart(2, "0");
  const episodeStr = episode.toString().padStart(2, "0");
  return `S${seasonStr}E${episodeStr}`;
}

// ----------------- LEVEL 200 FEATURES ------------------

function setupSearchInput() {
  const input = document.getElementById("search-input");
  input.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = allEpisodes.filter((ep) => {
      return (
        ep.name.toLowerCase().includes(searchTerm) ||
        ep.summary.toLowerCase().includes(searchTerm)
      );
    });

    renderUI(filtered);
  });
}

function setupEpisodeSelector() {
  const selector = document.getElementById("episode-select");
  selector.innerHTML = `<option value="all">All Episodes</option>`;

  allEpisodes.forEach((ep) => {
    const option = document.createElement("option");
    option.value = ep.id;
    const episodeCode = formatEpisodeCode(ep.season, ep.number);
    option.textContent = `${episodeCode} - ${ep.name}`;
    selector.appendChild(option);
  });

  selector.addEventListener("change", (e) => {
    const selectedId = e.target.value;
    if (selectedId === "all") {
      renderUI(allEpisodes);
    } else {
      const selectedEp = allEpisodes.find((ep) => ep.id == selectedId);
      renderUI([selectedEp]);
    }
  });
}

function updateSearchCount(currentCount, totalCount) {
  const countElem = document.getElementById("search-count");
  countElem.textContent = `Showing ${currentCount} of ${totalCount} episode(s)`;
}
