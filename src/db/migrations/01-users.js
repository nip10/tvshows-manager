exports.up = (knex, Promise) => knex.schema.createTableIfNotExists('users', (table) => {
    table.increments('id');
    table.string('username').unique().notNullable();
    table.string('email').unique().notNullable();
    table.string('password').notNullable();
    table.boolean('admin').defaultTo(false);
    table.string('resetpwtoken');
    table.timestamp('resetpwexp');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
});

exports.down = (knex, Promise) => knex.schema.dropTable('users');
