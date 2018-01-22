exports.up = (knex, Promise) => knex.schema.createTableIfNotExists('bugs', (table) => {
    table.increments('id');
    table.integer('user_id').references('users.id');
    table.text('description').notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });
  
  exports.down = (knex, Promise) => knex.schema.dropTable('bugs');