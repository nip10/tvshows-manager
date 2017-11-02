exports.up = (knex, Promise) => knex.schema.createTableIfNotExists('tvshows', (table) => {
  table.increments('id');
  table.string('name').unique().notNullable();
  table.text('description').notNullable();
  table.enu('status', ['Running', 'Ended', 'Canceled']);
  table.string('imdb').unique().notNullable();
  table.integer('thetvdb').unique().notNullable();
  table.specificType('genre', 'text[]').notNullable();
  table.string('premiered').notNullable();
  table.string('network').notNullable();
  table.string('airdate').notNullable();
  table.string('tvrating').notNullable();
  table.specificType('images', 'text[]').notNullable();
  table.timestamp('createdAt').defaultTo(knex.raw('now()'));
  table.timestamp('updatedAt').defaultTo(knex.raw('now()'));
});

exports.down = (knex, Promise) => knex.schema.dropTable('tvshows');
