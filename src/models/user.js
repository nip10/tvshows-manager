import bcrypt from 'bcryptjs';
import knex from '../db/connection';

const User = {
    /**
     * Create a new user
     *
     * @param {string} email - user email
     * @param {string} password - user password
     * @returns {boolean} - if the user was created
     */
    async createUser(email, password) {
        const hashedPassword = this.genHashPassword(password);
        const username = email.split('@')[0];
        try {
            const createUser = await knex('users').insert({ username, email, password: hashedPassword }).returning('*');
            return createUser;
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    /**
     * Check if the user password is correct
     *
     * @param {string} userPassword - password input on login
     * @param {string} dbPassword - password fetched from the db
     * @returns {boolean} - if the passwords match
     */
    comparePassword(userPassword, dbPassword) {
        return bcrypt.compareSync(userPassword, dbPassword);
    },
    /**
     * Generate hashed password
     *
     * @param {string} password - user password
     * @returns {string} - hashed password
     */
    genHashPassword(password) {
        const salt = bcrypt.genSaltSync();
        const hashedPassword = bcrypt.hashSync(password, salt);
        return hashedPassword;
    },
    /**
     * Check if a email is already registred
     *
     * @param {string} email - user email
     * @returns {boolean} - if the email already exists
     */
    async checkIfUserExistsByEmail(email) {
        const inner = knex.select(1).from('users').where('email', email).limit(1);
        try {
            const emailExistsOnDb = await knex.raw(inner).wrap('select exists (', ')');
            return emailExistsOnDb.rows[0].exists;
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    /**
     * Add reset password token to the user
     *
     * @param {string} email - user email
     * @param {{ token: string, expiration: date }} reset - reset password token and expiration date
     * @returns {boolean} - if the token was added
     */
    async addTokenToUser(email, reset) {
        try {
            const addToken = await knex('users').where({ email }).update({ resetpwtoken: reset.token, resetpwexp: reset.expiration });
            if (addToken !== 1) {
                throw new Error(`Adding token for user ${email} to the database failed.`);
            }
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    /**
     * Check if the reset password token is valid
     *
     * @param {string} email - user email
     * @param {{ token: string, expiration: date }} reset - reset password token and expiration date
     * @returns {boolean} - if the token is valid
     */
    async checkIfTokenIsValid(email, token) {
        const inner = knex.select(1)
            .from('users')
            .where({ email, resetpwtoken: token })
            .whereRaw("resetpwexp > current_timestamp - interval '15 minutes'")
            .limit(1);
        try {
            const isTokenValid = await knex.raw(inner).wrap('select exists (', ')');
            return isTokenValid.rows[0].exists;
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    /**
     * Get episodes from all tvshows that a user is following, in a given date interval
     *
     * @param {number} userId - user id
     * @param {date} startInterval - start interval to fetch
     * @param {date} endInterval - end interval to fetch
     * @returns {{}[]} - episodes that a user if following, in the specified date interval
     */
    async getEpisodes(userId, startInterval, endInterval) {
        try {
            const episodes = await knex.select('tvshows.name', 'tvshows.thetvdb', 'episodes.title')
                .select(knex.raw('to_char(episodes.season, \'fm00\') as "season"'))
                .select(knex.raw('to_char(episodes.epnum, \'fm00\') as "epnum"'))
                .select(knex.raw('to_char(episodes.airdate, \'DD-MM-YYYY\') as "airdate"'))
                .from('episodes')
                .join('usertv', 'usertv.tvshow_id', 'episodes.tvshow_id')
                .join('tvshows', 'tvshows.thetvdb', 'episodes.tvshow_id')
                .where('usertv.user_id', userId)
                .andWhere(function () {
                    this.whereBetween('episodes.airdate', [startInterval, endInterval]);
                });
            return episodes;
        } catch (e) {
            console.log(e);
            return null;
        }
    },
    /**
     * Add tvshow to user
     *
     * @param {number} userId - user id
     * @param {number} tvshowId - tvshow id
     * @returns {boolean} - added tvshow to user
     */
    async addTvshow(userId, tvshowId) {
        try {
            const addTvshow = await knex('usertv').insert({ user_id: userId, tvshow_id: tvshowId });
            return (addTvshow.rowCount === 1);
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    /**
     * Remove tvshow from user
     *
     * @param {number} userId user id
     * @param {number} tvshowId tvshow id
     * @returns {boolean} - removed tvshow from user
     */
    async removeTvshow(userId, tvshowId) {
        try {
            const removeTvshow = await knex('usertv').where({ user_id: userId, tvshow_id: tvshowId }).del();
            return (removeTvshow === 1);
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    /**
     * Check if a user is following a tvshow
     *
     * @param {number} userId - user id
     * @param {number} tvshowId - tvshow id
     * @returns {boolean} - the user is following the tvshow
     */
    async isFollowingTvshow(userId, tvshowId) {
        const innerQuery = knex.select(1).from('usertv').where({ user_id: userId, tvshow_id: tvshowId }).limit(1);
        try {
            const isFollowingTvshow = await knex.raw(innerQuery).wrap('select exists (', ')');
            return isFollowingTvshow.rows[0].exists;
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    /**
     * Change user password
     *
     * @param {string} email - user email
     * @param {string} password - user password
     * @returns {boolean} - password changed
     */
    async changePassword(email, newPassword) {
        const newHashedPassword = this.genHashPassword(newPassword);
        try {
            const changedPassword = await knex('users').where({ email }).update({ password: newHashedPassword });
            if (changedPassword !== 1) {
                throw new Error(`Changing password for user ${email} failed`);
            }
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    },
};

module.exports = User;
