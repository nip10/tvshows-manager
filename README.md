# TvShows-Manager

Webapp to manage your favourite tv shows.

# Tech

- NodeJS
- Web framework: Express
- Render engine: Pug
- Database: Postgres (w/ knex)
- Authentication: Passport

# Usage

1. Clone the repo
2. Edit .env.sample and rename to .env
3. Edit /app/db/knexfile.sample.js and rename to knexfile.js
4. Run Knex Migrations (located at /app/db/migrations/)
4.1 (Optional) Add seed data (located at /app/db/seeds/)
5. Run "npm start"

MIT Licence