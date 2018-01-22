module.exports = {

    development: {
        client: 'postgresql',
        debug: false,
        connection: {
            host: '127.0.0.1',
            user: 'postgres',
            password: 'skillz21',
            database: 'tvshows',
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: `${__dirname}/migrations`,
        },
        seeds: {
            directory: `${__dirname}/migrations/seeds`,
        },
    },

    production: {
        client: 'postgresql',
        debug: false,
        connection: {
            host: '164.132.107.157',
            port: '5432',
            user: 'postgres',
            password: 'skillz21',
            database: 'tvshows',
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: `${__dirname}/migrations`,
        },
        seeds: {
            directory: `${__dirname}/migrations/seeds`,
        },
    },

    test: {
        client: 'postgresql',
        debug: false,
        connection: {
            host: '127.0.0.1',
            user: 'postgres',
            password: 'skillz21',
            database: 'tvshows',
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: `${__dirname}/migrations`,
        },
        seeds: {
            directory: `${__dirname}/migrations/seeds`,
        },
    },

};