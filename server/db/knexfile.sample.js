module.exports = {

    development: {
        client: 'postgresql',
        connection: {
            host: '127.0.0.1',
            user: '',
            password: '',
            database: 'dashboard',
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: `${__dirname}/migrations`,
        },
        seeds: {
            directory: `${__dirname}/seeds`,
        },
    },

    production: {
        client: 'postgresql',
        connection: {
            host: '127.0.0.1',
            user: '',
            password: '',
            database: 'dashboard',
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: `${__dirname}/migrations`,
        },
        seeds: {
            directory: `${__dirname}/seeds`,
        },
    },

};
