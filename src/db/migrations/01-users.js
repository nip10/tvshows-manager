exports.up = (knex, Promise) =>
  knex.schema.hasTable("users").then(exists => {
    if (!exists) {
      return knex.schema.createTable("users", table => {
        table.increments("id");
        table.string("username").notNullable();
        table
          .string("email")
          .unique()
          .notNullable();
        table.string("password");
        // Facebook logins dont use a 'password' so this column can be null. In the future,
        // user will be asked for a password in order to be able to login with email+pw
        table.bigint("facebook_id").unique();
        table.string("activationtoken");
        table.boolean("admin").defaultTo(false);
        table.boolean("active").defaultTo(false);
        table.string("resetpwtoken");
        table.timestamp("resetpwexp");
        table.timestamp("last_login").defaultTo("2000-01-01 12:00:00");
        table.timestamp("createdAt").defaultTo(knex.fn.now());
        table.timestamp("updatedAt").defaultTo(knex.fn.now());
      });
    }
  });

exports.down = (knex, Promise) => knex.schema.dropTableIfExists("users");
