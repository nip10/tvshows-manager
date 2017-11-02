exports.seed = function (knex, Promise) {
  return knex('usertv').del()
    .then(() =>
       knex('usertv').insert({
         user_id: 1,
         tvshow_id: 277165,
       }))
       .then(() => knex('usertv').insert({
         user_id: 1,
         tvshow_id: 273181,
       }))
       .then(() => knex('usertv').insert({
         user_id: 2,
         tvshow_id: 277165,
       }))
       .then(() => knex('usertv').insert({
         user_id: 2,
         tvshow_id: 273181,
       }))
       .then(() => knex('usertv').insert({
         user_id: 3,
         tvshow_id: 273181,
       }));
};
