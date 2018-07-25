import bcrypt from 'bcryptjs';
import validator from 'validator';
import _ from 'lodash';
import knex from '../db/connection';
import { ERROR } from '../utils/constants';

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
    const hashedPassword = await this.genHashPassword(password);
    const username = email.split('@')[0];
    try {
      const createUser = await knex('users')
        .insert({
          username,
          email,
          password: hashedPassword,
          activationtoken: token,
        })
        .returning('id');
      return { id: createUser[0] };
    } catch (e) {
      console.log(e);
      return false;
    }
  },
  /**
   * Create a new 'facebook' user
   *
   * @param {string} username - username
   * @param {string} email - user email
   * @param {string} fbId - facebook id
   * @param {string} token - account activation token
   * @returns {boolean} - if the user was created
   */
  async createFbUser(username, email, fbId, token) {
    try {
      const createUser = await knex('users')
        .insert({
          username,
          email,
          activationtoken: token,
          facebook_id: fbId,
        })
        .returning('id');
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
  async comparePassword(userPassword, dbPassword) {
    try {
      const result = await bcrypt.compare(userPassword, dbPassword);
      return result;
    } catch (e) {
      return false;
    }
  },
  /**
   * Generate hashed password
   *
   * @param {string} password - user password
   * @returns {string} - hashed password
   */
  async genHashPassword(password) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      return hashedPassword;
    } catch (e) {
      console.log(e);
      return null;
    }
  },
  /**
   * Get user id by email
   * Returns false if the email is not registred
   *
   * @param {string} email - user email
   * @returns {id || boolean} - user id or false
   */
  async getUserIdByEmail(email) {
    try {
      const emailExistsOnDb = await knex('users')
        .select('id')
        .where('email', email)
        .first();
      return emailExistsOnDb || false;
    } catch (e) {
      console.log(e);
      return true; // TODO: This is not a good idea
    }
  },
  /**
   * Add reset password token to the user
   *
   * @param {string} email - user email
   * @param {{ token: string, expiration: date }} reset - reset password token and expiration date
   * @returns {boolean} - if the token was added
   */
  async addResetTokenToUser(email, reset) {
    try {
      const res = await knex('users')
        .where({ email })
        .update({ resetpwtoken: reset.token, resetpwexp: reset.expiration });
      return res === 1;
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
  async addActivationTokenToUser(email, token) {
    try {
      const res = await knex('users')
        .where({ email })
        .update({ activationtoken: token });
      return res === 1;
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
    const inner = knex
      .select(1)
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
   * @returns {{}[]} - episodes from the tvshows that a user if following, in the specified date interval
   */
  async getEpisodes(userId, startInterval, endInterval) {
    try {
      const episodes = await knex('episodes')
        .select('tvshows.name', 'tvshows.thetvdb', 'episodes.title', 'episodes.id')
        .select(knex.raw('to_char(episodes.season, \'fm00\') as "season"'))
        .select(knex.raw('to_char(episodes.epnum, \'fm00\') as "epnum"'))
        .select(knex.raw('to_char(episodes.airdate, \'DD-MM-YYYY\') as "airdate"'))
        .select(knex.raw('exists(select 1 from usereps where episodes.id = usereps.ep_id) as "watched"'))
        .join('usertv', 'usertv.tvshow_id', 'episodes.tvshow_id')
        .join('tvshows', 'tvshows.thetvdb', 'episodes.tvshow_id')
        .where('usertv.user_id', userId)
        .andWhere(function() {
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
      return addTvshow.rowCount === 1;
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
      const removeTvshow = await knex('usertv')
        .where({ user_id: userId, tvshow_id: tvshowId })
        .del();
      return removeTvshow === 1;
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
    const innerQuery = knex
      .select(1)
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
      return { error: ERROR.AUTH.INVALID_EMAIL };
    } else if (!password || password.length < 8 || password.length > 30) {
      return { error: ERROR.AUTH.PASSWORD_LEN };
    } else if (!password || password !== passwordDuplicate) {
      return { error: ERROR.AUTH.PASSWORD_MATCH };
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
      return { error: ERROR.AUTH.INVALID_EMAIL };
    } else if (!password || password.length < 8 || password.length > 30) {
      return { error: ERROR.AUTH.PASSWORD_LEN };
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
      const { passwordFromDb } = await knex('users')
        .select('password as passwordFromDb')
        .where('id', userId)
        .first();
      const isCurrentPasswordCorrect = this.comparePassword(currentPassword, passwordFromDb);
      if (!isCurrentPasswordCorrect) return { error: ERROR.AUTH.PASSWORD_INVALID };
      const newPasswordHashed = this.genHashPassword(newPassword);
      await knex('users')
        .where('id', userId)
        .update({ password: newPasswordHashed });
      return true;
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
      const isAccountActive = await knex('users')
        .select('active')
        .where('email', email)
        .first();
      return isAccountActive.active;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
  /**
   * Activate user account
   *
   * @param {String} token - activation token
   * @returns {Boolean} - account activated
   */
  async activateAccount(token) {
    try {
      const res = await knex('users')
        .update('active', true)
        .update('activationtoken', null)
        .where('activationtoken', token);
      return res === 1;
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
  /**
   * Get unwatched episodes
   *
   * @param {Number} userId - user id
   * @returns {[{}]} - list of unwatched episodes
   */
  async getWatchlist(userId) {
    /* eslint-disable func-names */
    try {
      const unwatchedEpisodes = await knex
        .select('episodes.id', 'episodes.title', 'episodes.overview')
        .select(knex.raw('to_char(episodes.season, \'FM00\') as "season"'))
        .select(knex.raw('to_char(episodes.epnum, \'FM00\') as "epnum"'))
        .select(knex.raw('to_char(episodes.airdate, \'DD-MM-YYYY\') as "airdate"'))
        .select(knex.raw('to_char(episodes.tvshow_id, \'FM99999999\') as "tvshowId"'))
        .from('episodes')
        .join('usertv', 'usertv.tvshow_id', 'episodes.tvshow_id')
        .where('usertv.user_id', userId)
        .where('episodes.airdate', '<=', knex.fn.now())
        .whereNot('episodes.season', 0)
        .andWhere(function() {
          this.whereNotIn('episodes.id', function() {
            this.select('ep_id').from('usereps');
          });
        })
        .orderBy('season', 'asc')
        .orderBy('epnum', 'asc');
      return unwatchedEpisodes;
    } catch (e) {
      console.log(e);
      return null;
    }
    /* eslint-enable func-names */
  },
  /**
   * Get number of unwatched episodes
   *
   * @param {Number} userId - user id
   * @returns {Number} - number of unwatched episodes
   */
  async getNumberOfUnwatchedEpisodes(userId) {
    /* eslint-disable func-names */
    try {
      const unwatchedEpisodes = await knex
        .select('episodes.id')
        .select(knex.raw('to_char(episodes.tvshow_id, \'FM99999999\') as "tvshowId"'))
        .from('episodes')
        .join('usertv', 'usertv.tvshow_id', 'episodes.tvshow_id')
        .where('usertv.user_id', userId)
        .where('episodes.airdate', '<=', knex.fn.now())
        .whereNot('episodes.season', 0)
        .andWhere(function() {
          this.whereNotIn('episodes.id', function() {
            this.select('ep_id').from('usereps');
          });
        });
      return unwatchedEpisodes.length;
    } catch (e) {
      console.log(e);
      return null;
    }
    /* eslint-enable func-names */
  },
  /**
   * Reset user password
   *
   * @param {String} email - user email
   * @param {String} newPassword - new password
   * @returns {Boolean} - changed password
   */
  async resetPassword(email, newPassword) {
    try {
      const newPasswordHashed = await this.genHashPassword(newPassword);
      await knex('users')
        .where('email', email)
        .update('password', newPasswordHashed)
        .update('resetpwtoken', null)
        .update('resetpwexp', null);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
  /**
   * Update last login timestamp
   *
   * @param {Number} userId - user id
   */
  async updateLastLogin(userId) {
    try {
      await knex('users')
        .update('last_login', knex.fn.now())
        .where('id', userId);
      return null;
    } catch (e) {
      console.log(e);
      return null;
    }
  },
};

module.exports = User;
