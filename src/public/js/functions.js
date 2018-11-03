/**
 * Render episodes table
 *
 * @param {{num: Number, name: String, airdate: Date}[]} episodes - episodes
 */
export function renderEpisodesTable(episodes) {
  const table = $('#episodes-table > tbody');
  table.empty();
  episodes.forEach(episode => {
    table.append(
      `<tr> <td class="num">${episode.num}</td> <td class="title">${episode.name}</td> <td class="airdate">
      ${episode.airdate}</td> <td class="markwatched"><i class="fa fa-eye" aria-hidden="true"></i></td> </tr>`
    );
  }, this);
}
/**
 * Fetch number of unwatched episodes
 *
 * @return {Promise} - returns the unwatched episodes count if resolved
 */
export function getNumberOfUnwatchedEpisodes() {
  return $.get(`/tsm/watchlist/count`).done((data, textStatus, jqXHR) => {
    if (jqXHR.status === 200) return data.unwatchedEpisodesCount;
    return 0;
  });
}
/**
 * Update unwatched episodes counter in the sidebar
 *
 * @param {Number} unwatchedEpisodesCount - unwatched episodes count
 */
export function updateUnwatchedEpisodesCounter(unwatchedEpisodesCount) {
  if (unwatchedEpisodesCount === 0) {
    $('#sidebar-counter').hide();
  } else {
    $('#sidebar-counter').show();
    $('#sidebar-counter').text(unwatchedEpisodesCount);
  }
}
