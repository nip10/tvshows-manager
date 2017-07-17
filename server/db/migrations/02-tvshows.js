exports.up = (knex, Promise) => knex.schema.createTableIfNotExists('tvshows', (table) => {
  table.increments('id');
  table.string('name').unique().notNullable();
  table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
  table.timestamp('updatedAt').defaultTo(knex.raw('now()'));
});

exports.down = (knex, Promise) => knex.schema.dropTable('tvshows');
