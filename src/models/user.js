import bcrypt from 'bcryptjs';
import validator from 'validator';
import _ from 'lodash';
import knex from '../db/connection';

const User = {
    /**
     * Create a new user
     *
     * @param {string} email - user email
     * @param {string} password - user password
     * @param {string} token - account activation token
     * @returns {boolean} - if the user was created
     */
    async createUser(email, password, token) {
        const hashedPassword = this.genHashPassword(password);
        const username = email.split('@')[0];
        try {
            const createUser = await knex('users').insert({
                username,
                email,
                password: hashedPassword,
                activationtoken: token,
            }).returning('id');
            return { id: createUser[0] };
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
        const inner = knex.select(1)
            .from('users')
            .where('email', email)
            .limit(1)
            .first();
        try {
            const emailExistsOnDb = await knex.raw(inner).wrap('select exists (', ')');
            return emailExistsOnDb.rows[0].exists || false;
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
            await knex('users').where({ email }).update({ resetpwtoken: reset.token, resetpwexp: reset.expiration });
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
            .limit(1)
            .first();
        try {
            const isTokenValid = await knex.raw(inner).wrap('select exists (', ')');
            return isTokenValid.rows[0].exists || false;
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    /* eslint-disable func-names */
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
            const episodes = await knex('episodes').select('tvshows.name', 'tvshows.thetvdb', 'episodes.title', 'episodes.id')
                .select(knex.raw('to_char(episodes.season, \'fm00\') as "season"'))
                .select(knex.raw('to_char(episodes.epnum, \'fm00\') as "epnum"'))
                .select(knex.raw('to_char(episodes.airdate, \'DD-MM-YYYY\') as "airdate"'))
                .select(knex.raw('exists(select 1 from usereps where episodes.id = usereps.ep_id) as "watched"'))
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
    /* eslint-enable func-names */
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
        const innerQuery = knex.select(1)
            .from('usertv')
            .where({ user_id: userId, tvshow_id: tvshowId })
            .limit(1)
            .first();
        try {
            const isFollowingTvshow = await knex.raw(innerQuery).wrap('select exists (', ')');
            return isFollowingTvshow.rows[0].exists || false;
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    /**
     * Validate signup inputs
     *
     * @param {string} email - user email
     * @param {string} password - user password
     * @param {string} passwordDuplicate - user duplicate password
     * @returns {{ normalizedEmail: string, password: string }} - normalized email and password
     */
    validateSignup(email, password, passwordDuplicate) {
        if (!email || !validator.isEmail(email)) {
            return ({ error: 'Invalid email address.' });
        } else if (!password || password.length < 8 || password.length > 30) {
            return ({ error: 'Password must be 8-30 chars.' });
        } else if (!password || password !== passwordDuplicate) {
            return ({ error: 'Passwords don\'t match.' });
        }
        return {
            normalizedEmail: validator.normalizeEmail(email),
            password,
        };
    },
    /**
     * Validate login inputs
     *
     * @param {String} email - user email
     * @param {String} password - user password
     * @returns {{ normalizedEmail: String, password: String }} - normalized email and password
     */
    validateLogin(email, password) {
        if (!email || !validator.isEmail(email)) {
            return ({ error: 'Invalid email address.' });
        } else if (!password || password.length < 8 || password.length > 30) {
            return ({ error: 'Password must be 8-30 chars.' });
        }
        return {
            normalizedEmail: validator.normalizeEmail(email),
            password,
        };
    },
    /**
     * Change user password
     *
     * @param {Number} userId - user id
     * @param {String} currentPassword - current password
     * @param {String} newPassword - new password
     * @returns {Boolean} - changed password
     */
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const passwordFromDb = await knex('users').select('password').where('id', userId).first();
            const isCurrentPasswordCorrect = this.comparePassword(currentPassword, passwordFromDb);
            if (!isCurrentPasswordCorrect) return false;
            const newPasswordHashed = this.genHashPassword(newPassword);
            /* eslint-disable no-unused-vars */
            const changedPassword = await knex('users').where('id', userId).update({ password: newPasswordHashed });
            /* eslint-enable no-unused-vars */
            return true; // TODO: Return the response from knex after checking its content
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    /**
     * Check if user account active
     *
     * @param {String} email - user email
     * @returns {Boolean} - account is active
     */
    async isActive(email) {
        try {
            const isAccountActive = await knex('users').select('active').where('email', email).first();
            return isAccountActive;
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    /**
     * Activate user account
     *
     * @param {string} token - activation token
     * @returns {boolean} - account activated
     */
    async activateAccount(token) {
        try {
            /* eslint-disable no-unused-vars */
            const activatedAccount = await knex('users').update('active', true).where('token', token);
            /* eslint-enable no-unused-vars */
            return true; // TODO: Return the response from knex after checking its content
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    /**
     * Get watched episodes from an episode id list
     *
     * @param {Number[]} episodeIds - list of episode ids
     * @returns {Number[]} - list of watched episode ids
     */
    async getWatchedEpisodesById(episodeIds, userId) {
        try {
            const watchedEpisodes = await knex('usereps')
                .select('ep_id')
                .where('user_id', userId)
                .whereRaw('ep_id = ANY(?)', [episodeIds]);
            return _.map(watchedEpisodes, episode => episode.ep_id);
        } catch (e) {
            console.log(e);
            return null;
        }
    },
};

module.exports = User;
