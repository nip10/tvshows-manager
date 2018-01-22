exports.up = (knex, Promise) => knex.schema.createTableIfNotExists('tvshows', (table) => {
  table.increments('id');
  table.string('name').unique().notNullable();
  table.text('overview');
  table.enu('status', ['Running', 'Ended', 'Canceled']);
  table.string('imdb').unique();
  table.integer('thetvdb').unique();
  table.specificType('genre', 'text[]');
  table.string('premiered');
  table.string('network');
  table.string('airdate');
  table.string('tvrating');
  table.specificType('images', 'text[]');
  table.timestamp('createdAt').defaultTo(knex.fn.now());
  table.timestamp('updatedAt').defaultTo(knex.fn.now());
});

exports.down = (knex, Promise) => knex.schema.dropTable('tvshows');