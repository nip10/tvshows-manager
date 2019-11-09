import bcrypt from 'bcryptjs';
import validator from 'validator';
import _ from 'lodash';
import moment from 'moment';
import knex from '../db/connection';
import { ERROR } from '../utils/constants';

/**
 * Create a new user
 *
 * @param {String} email user email
 * @param {String} password user password
 * @param {String} token account activation token
 * @returns {{ id: Number }} if the user was created
 */
export async function createUser(email, password, token) {
  const hashedPassword = await this.genHashPassword(password);
  const username = email.split('@')[0];
  return knex('users')
    .insert({
      username,
      email,
      password: hashedPassword,
      activationtoken: token,
    })
    .returning('id')
    .then(dbRes => dbRes[0]);
}
/**
 * Create a new 'facebook' user
 *
 * @param {String} username username
 * @param {String} email user email
 * @param {String} fbId facebook id
 * @param {String} token account activation token
 * @returns {{ id: Number }}
 */
export async function createFbUser(username, email, fbId, token) {
  return knex('users')
    .insert({
      username,
      email,
      activationtoken: token,
      facebook_id: fbId,
    })
    .returning('id')
    .then(dbRes => dbRes[0]);
}
/**
 * Check if the user password is correct
 *
 * @param {String} userPassword password input on login
 * @param {String} dbPassword password fetched from the db
 * @returns {Promise}
 */
export function comparePassword(userPassword, dbPassword) {
  return bcrypt.compare(userPassword, dbPassword);
}
/**
 * Generate hashed password
 *
 * @param {String} password user password
 * @returns {Promise} hashed password
 */
export function genHashPassword(password) {
  return bcrypt.hash(password, 10);
}
/**
 * Get user id by email.
 * Returns null if the email does not exist.
 *
 * @param {String} email user email
 * @returns {Number} user id
 */
export async function getUserIdByEmail(email) {
  try {
    const emailExistsOnDb = await knex('users')
      .select('id')
      .where({ email })
      .first();
    return _.defaultTo(emailExistsOnDb.id, null);
  } catch (e) {
    console.log(e);
    return null;
  }
}
/**
 * Get user details by email.
 * Returns null if the email does not exist.
 *
 * @param {String} email
 * @returns {User} user object with all details
 */
export async function getUserByEmail(email) {
  try {
    const user = await knex('users')
      .select('*')
      .where({ email })
      .first();
    return _.defaultTo(user, null);
  } catch (e) {
    console.log(e);
    return null;
  }
}
/**
 * Add reset password token to the user
 *
 * @param {String} email user email
 * @param {{ token: String, expiration: Date }} reset reset password token and expiration date
 * @returns {Boolean} if the token was added
 */
export async function addResetTokenToUser(email, reset) {
  try {
    const res = await knex('users')
      .where({ email })
      .update({ resetpwtoken: reset.token, resetpwexp: reset.expiration });
    return res === 1;
  } catch (e) {
    console.log(e);
    return false;
  }
}
/**
 * Add reset password token to the user
 *
 * @param {String} email user email
 * @param {{ token: String, expiration: date }} reset reset password token and expiration date
 * @returns {Boolean} if the token was added
 */
export async function addActivationTokenToUser(email, token) {
  try {
    const res = await knex('users')
      .where({ email })
      .update({ activationtoken: token });
    return res === 1;
  } catch (e) {
    console.log(e);
    return false;
  }
}
/**
 * Check if the reset password token is valid
 *
 * @param {String} email user email
 * @param {{ token: String, expiration: Date }} reset reset password token and expiration date
 * @returns {Boolean} if the token is valid
 */
export function checkIfTokenIsValid(email, token) {
  const inner = knex
    .select(1)
    .from('users')
    .where({ email, resetpwtoken: token })
    .whereRaw("resetpwexp > current_timestamp - interval '15 minutes'")
    .limit(1)
    .first();
  return knex
    .raw(inner)
    .wrap('select exists (', ')')
    .then(dbRes => dbRes.rows[0].exists)
    .catch(() => false);
}
/**
 * Check if the activation token is valid
 *
 * @param {String} reset activation token
 * @returns {Promise}
 */
export function isActivationTokenValid(token) {
  const inner = knex
    .select(1)
    .from('users')
    .where('activationtoken', token)
    .limit(1)
    .first();
  return knex
    .raw(inner)
    .wrap('select exists (', ')')
    .then(dbRes => dbRes.rows[0].exists)
    .catch(() => false);
}
/* eslint-disable func-names */
/**
 * Get episodes from all tvshows that a user is following, in a given date interval
 *
 * @param {Number} userId user id
 * @param {Date} startInterval start interval to fetch
 * @param {Date} endInterval end interval to fetch
 * @returns {Promise} resolves to an array of episodes from the tvshows that a user if following, in the specified date interval
 */
export function getEpisodes(userId, startInterval, endInterval) {
  return knex('episodes')
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
}
/* eslint-enable func-names */
/**
 * Add tvshow to user
 *
 * @param {Number} userId user id
 * @param {Number} tvshowId tvshow id
 * @returns {Promise}
 */
export function addTvshow(userId, tvshowId) {
  return knex('usertv').insert({ user_id: userId, tvshow_id: tvshowId });
}
/**
 * Remove tvshow from user
 *
 * @param {Number} userId user id
 * @param {Number} tvshowId tvshow id
 * @returns {Promise}
 */
export function removeTvshow(userId, tvshowId) {
  return knex('usertv')
    .where({ user_id: userId, tvshow_id: tvshowId })
    .del();
}
/**
 * Check if a user is following a tvshow
 *
 * @param {Number} userId user id
 * @param {Number} tvshowId tvshow id
 * @returns {Promise} the user is following the tvshow
 */
export function isFollowingTvshow(userId, tvshowId) {
  const innerQuery = knex
    .select(1)
    .from('usertv')
    .where({ user_id: userId, tvshow_id: tvshowId })
    .limit(1)
    .first();
  return knex
    .raw(innerQuery)
    .wrap('select exists (', ')')
    .then(dbRes => dbRes.rows[0].exists);
}
/**
 * Validate signup inputs
 *
 * @param {String} email user email
 * @param {String} password user password
 * @param {String} passwordDuplicate user duplicate password
 * @returns {{ normalizedEmail: String, password: String }} normalized email and password
 */
export function validateSignup(email, password, passwordDuplicate) {
  if (!_.isString(email) || !validator.isEmail(email)) {
    return { error: ERROR.AUTH.INVALID_EMAIL };
  }
  if (!_.isString(password) || password.length < 8 || password.length > 30) {
    return { error: ERROR.AUTH.PASSWORD_LEN };
  }
  if (!_.isString(passwordDuplicate) || password !== passwordDuplicate) {
    return { error: ERROR.AUTH.PASSWORD_MATCH };
  }
  return {
    normalizedEmail: validator.normalizeEmail(email),
    password,
  };
}
/**
 * Validate login inputs
 *
 * @param {String} email user email
 * @param {String} password user password
 * @returns {{ normalizedEmail: String, password: String }} normalized email and password
 */
export function validateLogin(email, password) {
  if (!_.isString(email) || !validator.isEmail(email)) {
    return { error: ERROR.AUTH.INVALID_EMAIL };
  }
  if (!_.isString(password) || password.length < 8 || password.length > 30) {
    return { error: ERROR.AUTH.PASSWORD_LEN };
  }
  return {
    normalizedEmail: validator.normalizeEmail(email),
    password,
  };
}
/**
 * Change user password
 *
 * @param {Number} userId user id
 * @param {String} currentPassword current password
 * @param {String} newPassword new password
 * @returns {Promise}
 */
export async function changePassword(userId, currentPassword, newPassword) {
  try {
    const { passwordFromDb } = await knex('users')
      .select('password as passwordFromDb')
      .where('id', userId)
      .first();
    const isCurrentPasswordCorrect = this.comparePassword(currentPassword, passwordFromDb);
    if (!isCurrentPasswordCorrect) return { error: ERROR.AUTH.PASSWORD_INVALID };
    const newPasswordHashed = this.genHashPassword(newPassword);
    if (!newPasswordHashed) throw new Error();
    return knex('users')
      .where('id', userId)
      .update({ password: newPasswordHashed });
  } catch (e) {
    console.log(e);
    return false;
  }
}
/**
 * Check if user account active by email
 *
 * @param {String} email user email
 * @returns {Promise}
 */
export function isAccountActiveByEmail(email) {
  return knex('users')
    .select('active')
    .where('email', email)
    .first()
    .then(dbRes => dbRes.active)
    .catch(() => false);
}
/**
 * Check if user account active by token
 *
 * @param {String} token user token
 * @returns {Promise}
 */
export function isAccountActiveByToken(token) {
  return knex('users')
    .select('active')
    .where('activationtoken', token)
    .first()
    .then(dbRes => dbRes.active)
    .catch(() => false);
}
/**
 * Activate user account
 *
 * @param {String} token activation token
 * @returns {Promise}
 */
export function activateAccount(token) {
  return knex('users')
    .update('active', true)
    .update('activationtoken', null)
    .where('activationtoken', token)
    .then(dbRes => dbRes === 1);
}
/**
 * Get watched episodes from an episode id list
 *
 * @param {Number[]} episodeIds list of episode ids
 * @returns {Promise}
 */
export function getWatchedEpisodesById(episodeIds, userId) {
  return knex('usereps')
    .select('ep_id')
    .where('user_id', userId)
    .whereRaw('ep_id = ANY(?)', [episodeIds])
    .then(dbRes => _.map(dbRes, episode => episode.ep_id));
}
/**
 * Get unwatched episodes
 *
 * @param {Number} userId user id
 * @returns {Promise}
 */
export function getWatchlist(userId) {
  /* eslint-disable func-names */
  return knex
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
  /* eslint-enable func-names */
}
/**
 * Get number of unwatched episodes
 *
 * @param {Number} userId user id
 * @returns {Promise}
 */
export function getNumberOfUnwatchedEpisodes(userId) {
  /* eslint-disable func-names */
  return knex
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
    })
    .then(dbRes => dbRes.length);
  /* eslint-enable func-names */
}
/**
 * Reset user password
 *
 * @param {String} email user email
 * @param {String} newPassword new password
 * @returns {Promise}
 */
export async function resetPassword(email, newPassword) {
  const newPasswordHashed = await this.genHashPassword(newPassword);
  return knex('users')
    .where('email', email)
    .update('password', newPasswordHashed)
    .update('resetpwtoken', null)
    .update('resetpwexp', null)
    .then(dbRes => dbRes === 1);
}
/**
 * Update last login timestamp
 *
 * Note: There's no need to break the login flow if this fails. The log will alert for any errors
 * and I should take action on that.
 *
 * @param {Number} userId user id
 */
export function updateLastLogin(userId) {
  return knex('users')
    .update('last_login', knex.fn.now())
    .where('id', userId);
}

export function getUserById(id) {
  return knex('users')
    .where({ id })
    .first();
}

export function isResetTokenValid(email, token) {
  return knex('users')
    .select('resetpwexp')
    .where({ email, resetpwtoken: token })
    .first()
    .then(dbRes => {
      const timeDiff = moment(dbRes.resetpwexp).diff(moment(), 'minutes');
      return timeDiff > 0;
    });
}
