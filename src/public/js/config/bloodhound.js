'use strict';

const bloodhoundConfig = {
  datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  remote: {
    url: '/tvshows/search/%QUERY',
    wildcard: '%QUERY',
  },
};

module.exports = new Bloodhound(bloodhoundConfig);
