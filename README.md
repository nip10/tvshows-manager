# TvShows-Manager

Allows you to explore and manage your favourite tvshows.
Check it live [here](https://www.p.dcdev.pt/tsm).

# Tech

- NodeJS (ES6 JavaScript)
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

This project structure is based on the MVC architecture, where there's a distinction between logic, data and views. I'm using pug to do server-side rendering which makes load times faster and because I felt it was more flexible at the time I started this project. This project is not supposed to be a production ready webapp (far from it) and was the first "big" project I've worked on. It allowed me to get familiar with the several different parts of building a Node/JS project: use a task runner and build tools (Gulp), design an API (Express), use Redis for session storing, authentication (Passport), database query-builder (knex), etc.. I'll probably write something more detailed on my blog, and remove this wall of text later.

# More details
- Authentication
    - Local (email + password)
    - Social (Facebook)
    - Misc:
        - Activation email with token
        - Recover password
        - Change password
        - Persistant login
- Tvshows + Episodes
    - If the info is not in the db, it will reach into THETVDB API. Then it'll add it to the db.
    - Features:
        - Follow a tvshow
        - Set episode(s)/season(s) as watched
- Watchlist
    - Keep track of all unwatched episodes of all the tvshows that you're following
- Calendar
    - Calendar view of all episodes of all tvshows that you're following
- External APIs used
    - THETVDB
        - Used to get tvshows info including episodes and art
    - OMDBAPI
        - Used to get IMDB's tvshows ratings

# Scripts
- tvdb-api-cron.js
    - Ran as a child-process to refresh the THETVDB API authentication token. This token is only valid
for 24h so there's a cronjob that refreshes the token in that interval. The token is then sent to the
parent process. An alternative would be to store it in the database, but I took the oportunity to test
new stuff like child-process' and cronjobs.
- updatetvshows.js
    - This script queries the THETVDB API to know whether we should update the data on our db or not.
I took advantage of the previous cronjob to call this script after the token refresh (every 24h)

# What's missing
aka stuff I'd like to add/do but probably won't (at least in the near future)

- Explore (random tvshows, sorted by genre/favourited/imdb rating/..)
- More social authentication
- User profile
    -  Social features (sharing lists, episodes, etc)
    -  Ability to have a public profile
    -  Stats
- Email newsletters/updates (all unwatched episodes for last week, month, eth; stats)
- Testing
- Improve the THETVDB token refresh flow
- Logger
- Rate limiting
- Remove jQuery

MIT Licence