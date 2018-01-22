exports.up = (knex, Promise) => knex.schema.createTableIfNotExists('episodes', (table) => {
  table.increments('id');
  table.integer('tvshow_id').references('tvshows.thetvdb');
  table.integer('season').notNullable();
  table.integer('epnum').notNullable();
  table.string('title');
  table.text('overview');
  table.date('airdate');
  table.timestamp('createdAt').defaultTo(knex.fn.now());
});

exports.down = (knex, Promise) => knex.schema.dropTable('episodes');
