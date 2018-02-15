'use strict';

module.exports = {
  /**
   * Render episodes table
   *
   * @param {{num: Number, name: String, airdate: Date}[]} episodes - episodes
   */
  renderEpisodesTable(episodes) {
    const table = $('#episodes-table > tbody');
    table.empty();
    episodes.forEach(episode => {
      table.append(
        `<tr> <td>${episode.num}</td> <td class="name">${episode.name}</td> <td class="airdate">
        ${episode.airdate}</td> <td><i class="fa fa-eye" aria-hidden="true"></i></td> </tr>`
      );
    }, this);
  },
};
