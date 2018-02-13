exports.up = (knex, Promise) => knex.schema.createTableIfNotExists('users', (table) => {
    table.increments('id');
    table.string('username').notNullable();
    table.string('email').unique().notNullable();
    table.string('password').notNullable();
    table.string('activationtoken').notNullable();
    table.boolean('admin').defaultTo(false);
    table.boolean('active').defaultTo(false);
    table.string('resetpwtoken');
    table.timestamp('resetpwexp');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
});

exports.down = (knex, Promise) => knex.schema.dropTable('users');
