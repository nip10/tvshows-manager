exports.up = (knex, Promise) => knex.schema.createTableIfNotExists('episodes', (table) => {
  table.increments('id');
  table.integer('tvshow_id').references('tvshows.id');
  table.integer('season').notNullable();
  table.integer('num').notNullable();
  table.string('title').notNullable();
  table.text('description').notNullable();
  table.date('airdate').notNullable();
  table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
  table.timestamp('updatedAt').defaultTo(knex.raw('now()'));
});

exports.down = (knex, Promise) => knex.schema.dropTable('episodes');
