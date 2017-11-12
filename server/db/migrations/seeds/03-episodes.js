exports.seed = function (knex, Promise) {
  return knex('episodes').del()
    .then(() =>
       knex('episodes').insert({
         tvshow_id: 277165,
         season: 4,
         epnum: 10,
         title: 'Bla Bla',
         overview: 'Ble Ble Ble Ble Ble Ble Ble Ble',
         airdate: '2017-02-02',
       }))
       .then(() => knex('episodes').insert({
         tvshow_id: 277165,
         season: 4,
         epnum: 11,
         title: 'Bla Bla',
         overview: 'Ble Ble Ble Ble Ble Ble Ble Ble',
         airdate: '2017-02-04',
       }))
       .then(() => knex('episodes').insert({
         tvshow_id: 273181,
         season: 7,
         epnum: 5,
         title: 'Bla Bla',
         overview: 'Ble Ble Ble Ble Ble Ble Ble Ble',
         airdate: '2017-02-01',
       }))
       .then(() => knex('episodes').insert({
         tvshow_id: 273181,
         season: 4,
         epnum: 6,
         title: 'Bla Bla',
         overview: 'Ble Ble Ble Ble Ble Ble Ble Ble',
         airdate: '2017-02-04',
       }));
};
