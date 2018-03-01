# TvShows-Manager

Allows you to explore and manage your favourite tvshows.
Check it live [here](https://www.p.dcdev.pt/tsm).

# Tech

- NodeJS (ES6 Javascript)
- Web framework: Express
- Render engine: Pug
- Database: Postgres (w/ knex)
- Authentication: Passport
- Build tool: Gulp
- Deployment: Docker

# Usage

1. Clone/Fork the repo
2. Edit .env.sample and rename to .env
3. Build client and server
4. Deploy
    - With Docker: Build docker image, Run docker-compose up, Run migrate.sh
    - Witout Docker: Run db migrations, Run the app

- The app's environment is 'development' by default. The differences between 'development' and 'production' are:
    - Sessions are stored in memory (dev) vs in redis (prod)
    - Static files are served by express (dev) vs other/external (eg: nginx) (prod)

# About

The structure chosen for this project is based on the MVC architecture, where there's a distinction between logic and data. This project is a way to test different tech and npm packages: from using gulp to build client and server code, to store sessions in redis.

# Todo

Since this was a "first approach" to some new concepts and tech (as mentioned above), there will be only a limited amount of features/corrections added in the future:
- User profile (basic)
- Social authentication (Facebook)
- Fix all the front-end CSS to match BEM rules

# What's missing

- Explore (random tvshows, sorted by genre/favourited/imdb rating/..)
- More social authentication
- Public user profile (share what you are watching)
- Email newsletters
- Testing
- Fix the way tvshowdb api token is fetched and updated


MIT Licence