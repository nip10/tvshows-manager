exports.seed = function (knex, Promise) {
  return knex('tvshows').del()
    .then(() =>
       knex('tvshows').insert({
         name: 'The Blacklist',
       }))
       .then(() => knex('tvshows').insert({
         name: 'Silicon Valley',
       }))
       .then(() => knex('tvshows').insert({
         name: 'Better Call Saul',
       }));
};
