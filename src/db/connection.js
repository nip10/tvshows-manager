const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const environment = process.env.NODE_ENV;
const config = require('./knexfile.js')[environment];

module.exports = require('knex')(config);
