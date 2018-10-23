exports.up = (knex, Promise) =>
  knex.schema.hasTable('episodes').then(exists => {
    if (!exists) {
      return knex.schema.createTable('episodes', table => {
        table.integer('id').notNullable().unique();
        table.integer('tvshow_id').references('tvshows.thetvdb');
        table.integer('season').notNullable();
        table.integer('epnum').notNullable();
        table.string('title');
        table.text('overview');
        table.date('airdate');
        table.timestamp('createdAt').defaultTo(knex.fn.now());
      });
    }
  });

exports.down = (knex, Promise) => knex.schema.dropTableIfExists('episodes');
