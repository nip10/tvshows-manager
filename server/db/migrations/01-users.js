exports.up = (knex, Promise) => knex.schema.createTableIfNotExists('users', (table) => {
  table.increments('id');
  table.string('username').unique().notNullable();
  table.string('email').unique().notNullable();
  table.string('password').notNullable();
  table.boolean('admin').notNullable().defaultTo(false);
  table.string('language').notNullable();
  table.timestamp('createdAt').notNullable().defaultTo(knex.raw('now()'));
  table.timestamp('updatedAt').defaultTo(knex.raw('now()'));
});

exports.down = (knex, Promise) => knex.schema.dropTable('users');
