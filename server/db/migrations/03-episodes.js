exports.up = (knex, Promise) => knex.schema.createTableIfNotExists('episodes', (table) => {
  table.increments('id');
  table.integer('tvshow_id').references('tvshows.thetvdb');
  table.integer('season').notNullable();
  table.integer('epnum').notNullable();
  table.string('title').notNullable();
  table.text('description');
  table.date('airdate');
  table.timestamp('createdAt').defaultTo(knex.raw('now()'));
});

exports.down = (knex, Promise) => knex.schema.dropTable('episodes');
