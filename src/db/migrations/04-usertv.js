exports.up = (knex, Promise) =>
  knex.schema.hasTable('usertv').then(exists => {
    if (!exists) {
      return knex.schema.createTable('usertv', table => {
        table.increments('id');
        table.integer('user_id').references('users.id');
        table.integer('tvshow_id').references('tvshows.thetvdb');
        table.unique(['user_id', 'tvshow_id']);
        table.timestamp('createdAt').defaultTo(knex.fn.now());
      });
    }
  });

exports.down = (knex, Promise) => knex.schema.dropTableIfExists('usertv');
