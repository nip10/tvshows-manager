const bloodhoundConfig = {
  datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  remote: {
    url: '/tsm/tvshows/search/%QUERY',
    wildcard: '%QUERY',
  },
};

export default new Bloodhound(bloodhoundConfig);
