exports.seed = function (knex, Promise) {
  return knex('episodes').del()
    .then(() =>
       knex('episodes').insert({
         tvshow_id: 1,
         season: 1,
         num: 1,
         title: 'Bla Bla',
         description: 'Ble Ble Ble Ble Ble Ble Ble Ble',
         airdate: '2017-01-01',
       }))
       .then(() => knex('episodes').insert({
         tvshow_id: 1,
         season: 1,
         num: 2,
         title: 'Bla Bla',
         description: 'Ble Ble Ble Ble Ble Ble Ble Ble',
         airdate: '2017-02-03',
       }))
       .then(() => knex('episodes').insert({
         tvshow_id: 1,
         season: 1,
         num: 3,
         title: 'Bla Bla',
         description: 'Ble Ble Ble Ble Ble Ble Ble Ble',
         airdate: '2017-02-05',
       }))
       .then(() => knex('episodes').insert({
         tvshow_id: 2,
         season: 4,
         num: 10,
         title: 'Bla Bla',
         description: 'Ble Ble Ble Ble Ble Ble Ble Ble',
         airdate: '2017-02-02',
       }))
       .then(() => knex('episodes').insert({
         tvshow_id: 2,
         season: 4,
         num: 11,
         title: 'Bla Bla',
         description: 'Ble Ble Ble Ble Ble Ble Ble Ble',
         airdate: '2017-02-04',
       }))
       .then(() => knex('episodes').insert({
         tvshow_id: 3,
         season: 7,
         num: 5,
         title: 'Bla Bla',
         description: 'Ble Ble Ble Ble Ble Ble Ble Ble',
         airdate: '2017-02-01',
       }))
       .then(() => knex('episodes').insert({
         tvshow_id: 3,
         season: 4,
         num: 6,
         title: 'Bla Bla',
         description: 'Ble Ble Ble Ble Ble Ble Ble Ble',
         airdate: '2017-02-04',
       }));
};
