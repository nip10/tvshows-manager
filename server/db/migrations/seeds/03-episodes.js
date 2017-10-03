exports.seed = function (knex, Promise) {
  return knex('episodes').del()
    .then(() =>
       knex('episodes').insert({
         tvshow_id: 1,
         season: 1,
         epnum: 1,
         title: 'Bla Bla',
         description: 'Ble Ble Ble Ble Ble Ble Ble Ble',
         airdate: '2017-01-01',
       }))
       .then(() => knex('episodes').insert({
         tvshow_id: 1,
         season: 1,
         epnum: 2,
         title: 'Bla Bla',
         description: 'Ble Ble Ble Ble Ble Ble Ble Ble',
         airdate: '2017-02-03',
       }))
       .then(() => knex('episodes').insert({
         tvshow_id: 1,
         season: 1,
         epnum: 3,
         title: 'Bla Bla',
         description: 'Ble Ble Ble Ble Ble Ble Ble Ble',
         airdate: '2017-02-05',
       }))
       .then(() => knex('episodes').insert({
         tvshow_id: 2,
         season: 4,
         epnum: 10,
         title: 'Bla Bla',
         description: 'Ble Ble Ble Ble Ble Ble Ble Ble',
         airdate: '2017-02-02',
       }))
       .then(() => knex('episodes').insert({
         tvshow_id: 2,
         season: 4,
         epnum: 11,
         title: 'Bla Bla',
         description: 'Ble Ble Ble Ble Ble Ble Ble Ble',
         airdate: '2017-02-04',
       }))
       .then(() => knex('episodes').insert({
         tvshow_id: 3,
         season: 7,
         epnum: 5,
         title: 'Bla Bla',
         description: 'Ble Ble Ble Ble Ble Ble Ble Ble',
         airdate: '2017-02-01',
       }))
       .then(() => knex('episodes').insert({
         tvshow_id: 3,
         season: 4,
         epnum: 6,
         title: 'Bla Bla',
         description: 'Ble Ble Ble Ble Ble Ble Ble Ble',
         airdate: '2017-02-04',
       }));
};
