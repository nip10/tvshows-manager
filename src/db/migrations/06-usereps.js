exports.up = (knex, Promise) => knex.schema.hasTable('usereps', (exists) => {
    if (!exists) {
        return knex.schema.createTable('usereps', (table) => {
            table.increments('id');
            table.integer('user_id').references('users.id');
            table.integer('tvshow_id').references('tvshows.thetvdb');
            table.integer('ep_id').references('episodes.id');
            table.unique(['user_id', 'tvshow_id', 'ep_id']);
            table.timestamp('createdAt').defaultTo(knex.fn.now());
        });
    }
});

exports.down = (knex, Promise) => knex.schema.dropTableIfExists('usereps');
