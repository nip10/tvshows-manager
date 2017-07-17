exports.up = (knex, Promise) => knex.schema.createTableIfNotExists('users', (table) => {
  table.increments('id');
  table.string('email').unique().notNullable();
  table.string('password').notNullable();
  table.boolean('admin').defaultTo(false);
  table.timestamp('createdAt').defaultTo(knex.raw('now()'));
  table.timestamp('updatedAt').defaultTo(knex.raw('now()'));
});

exports.down = (knex, Promise) => knex.schema.dropTable('users');
