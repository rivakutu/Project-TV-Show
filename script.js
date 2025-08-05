function setup() {
  const allEpisodes = getAllEpisodes();
  makePageForEpisodes(allEpisodes);
}
// formatting episode and season codes for each episode
function formatEpisodeCode(season, episode) {
  const seasonStr = season.toString().padStart(2, "0");
  const episodeStr = episode.toString().padStart(2, "0");
  return `S${seasonStr}E${episodeStr}`;
}
// function to create HTML element for each episode
function createEpisodeElement(episode) {
  const episodeDiv = document.createElement("div");
  episodeDiv.className = "episode-card";

  const episodeCode = formatEpisodeCode(episode.season, episode.number);

  //creating title element
  const title = document.createElement("h3");
  title.textContent = `${episodeCode} - ${episode.name}`;

  //creating image element
  const image = document.createElement("img");
  image.src = episode.image.medium;
  image.alt = episode.name;

  //creating summary element
  const summary = document.createElement("div");
  summary.className = "episode-summary";
  summary.innerHTML = episode.summary;

  // we need to append all elements to the episodeDiv
  episodeDiv.appendChild(title);
  episodeDiv.appendChild(image);
  episodeDiv.appendChild(summary);

  return episodeDiv;
}
function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  // clearing existing content
  rootElem.innerHTML = "";

  //we need to loop through all episodes and create an HTML element for each episode
  episodeList.forEach((episode) => {
    const episodeElement = createEpisodeElement(episode);
    rootElem.appendChild(episodeElement);
  });

  //referencing TVMaze
  const tribute = document.createElement("footer");
  tribute.innerHTML =
    '<p>Data came from <a href="https://www.tvmaze.com/">TVMaze</a></p>';
  rootElem.appendChild(tribute);
}

window.onload = setup;
