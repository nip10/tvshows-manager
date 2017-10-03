exports.up = (knex, Promise) => knex.schema.createTableIfNotExists('tvshows', (table) => {
  table.increments('id');
  table.string('name').unique().notNullable();
  table.text('description').notNullable();
  table.enu('status', ['running', 'ended', 'canceled']);
  table.string('imdb').unique().notNullable();
  table.string('premiered').notNullable();
  table.timestamp('createdAt').defaultTo(knex.raw('now()'));
  table.timestamp('updatedAt').defaultTo(knex.raw('now()'));
});

exports.down = (knex, Promise) => knex.schema.dropTable('tvshows');
