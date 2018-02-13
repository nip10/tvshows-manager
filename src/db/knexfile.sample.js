const dotenv = require('dotenv');

dotenv.config({ path: '../../.env' });

const {
    DATABASE_HOST,
    DATABASE_HOST_PROD,
    DATABASE_PORT,
    DATABASE_NAME,
    DATABASE_USER,
    DATABASE_PASSWORD,
    DATABASE_POOL_MIN,
    DATABASE_POOL_MAX,
} = process.env;

module.exports = {

    development: {
        client: 'postgresql',
        connection: {
            host: DATABASE_HOST,
            port: DATABASE_PORT,
            user: DATABASE_USER,
            password: DATABASE_PASSWORD,
            database: DATABASE_NAME,
        },
        pool: {
            min: DATABASE_POOL_MIN,
            max: DATABASE_POOL_MAX,
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
            host: DATABASE_HOST_PROD,
            port: DATABASE_PORT,
            user: DATABASE_USER,
            password: DATABASE_PASSWORD,
            database: DATABASE_NAME,
        },
        pool: {
            min: DATABASE_POOL_MIN,
            max: DATABASE_POOL_MAX,
        },
        migrations: {
            directory: `${__dirname}/migrations`,
        },
        seeds: {
            directory: `${__dirname}/seeds`,
        },
    },

    test: {
        client: 'postgresql',
        debug: true,
        connection: {
            host: DATABASE_HOST,
            port: DATABASE_PORT,
            user: DATABASE_USER,
            password: DATABASE_PASSWORD,
            database: DATABASE_NAME,
        },
        pool: {
            min: DATABASE_POOL_MIN,
            max: DATABASE_POOL_MAX,
        },
        migrations: {
            directory: `${__dirname}/migrations`,
        },
        seeds: {
            directory: `${__dirname}/seeds`,
        },
    },

};
