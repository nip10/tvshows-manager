import tvshowsSearch from './bloodhound';

export default [
  {
    hint: true,
    highlight: true,
    minLength: 4,
  },
  {
    name: 'tvshows',
    displayKey: 'seriesName',
    source: tvshowsSearch,
    limit: 5,
    templates: {
      suggestion(item) {
        return `<div data-id=${item.id}> ${item.seriesName} </div>`;
      },
      notFound(query) {
        return `<div> '${query.query}' not found </div>`;
      },
    },
  },
];
