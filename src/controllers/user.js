import _ from 'lodash';
import knex from '../db/connection';
import User from './../models/user';
import Tvshow from './../models/tvshow';
import { ERROR } from '../utils/constants';

/**
 * User controller - All functions related to users
 * @module controllers/user
 */

const userController = {
  /**
   * Add tvshow to user
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {undefined}
   */
  async addTvshowToUser(req, res) {
    const tvshowId = parseInt(_.get(req, 'params.tvshowId'), 10);
    const userId = parseInt(_.get(req, 'user'), 10);
    if (!_.isNumber(tvshowId)) {
      return res.status(400).json({ error: ERROR.TVSHOW.INVALID_ID });
    } else if (!_.isNumber(userId)) {
      return res.status(400).json({ error: ERROR.AUTH.INVALID_ID });
    }
    try {
      const isUserFollowingTvshow = await User.isFollowingTvshow(userId, tvshowId);
      if (isUserFollowingTvshow) {
        return res.status(400).json({ error: ERROR.TVSHOW.ALREADY_FOLLOWING });
      }
      const addTvshowToUser = await User.addTvshow(userId, tvshowId);
      if (addTvshowToUser) {
        return res.sendStatus(200);
      }
      throw new Error();
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: ERROR.SERVER });
    }
  },
  /**
   * Remove tvshow from user
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {undefined}
   */
  async removeTvshowFromUser(req, res) {
    const tvshowId = parseInt(_.get(req, 'params.tvshowId'), 10);
    const userId = parseInt(_.get(req, 'user'), 10);
    if (!_.isNumber(tvshowId)) {
      return res.status(400).json({ error: ERROR.TVSHOW.INVALID_ID });
    } else if (!_.isNumber(userId)) {
      return res.status(400).json({ error: ERROR.AUTH.INVALID_ID });
    }
    try {
      const isUserFollowingTvshow = await User.isFollowingTvshow(userId, tvshowId);
      if (!isUserFollowingTvshow) {
        return res.status(400).json({ error: ERROR.TVSHOW.NOT_FOLLOWING });
      }
      const removeTvshowFromUser = await User.removeTvshow(userId, tvshowId);
      if (removeTvshowFromUser) {
        return res.sendStatus(200);
      }
      throw new Error();
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: ERROR.SERVER });
    }
  },
  /**
   * Follow/Unfollow a tvshow
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {undefined}
   */
  async setFollowingTvshow(req, res) {
    const action = _.get(req, 'body.action');
    const tvshowId = parseInt(_.get(req, 'params.tvshowId'), 10);
    const userId = parseInt(_.get(req, 'user'), 10);
    if (!_.isNumber(tvshowId)) {
      return res.status(400).json({ error: ERROR.TVSHOW.INVALID_ID });
    } else if (!_.isNumber(userId)) {
      return res.status(400).json({ error: ERROR.AUTH.INVALID_ID });
    } else if (!_.isString(action) || (action !== 'add' && action !== 'remove')) {
      // TODO: Check if lodash has something like "isEnum"
      return res.status(400).json({ error: ERROR.TVSHOW.INVALID_ACTION });
    }
    try {
      if (action === 'add') {
        const isUserFollowingTvshow = await User.isFollowingTvshow(userId, tvshowId);
        if (isUserFollowingTvshow) {
          return res.status(400).json({ error: ERROR.TVSHOW.ALREADY_FOLLOWING });
        }
        const addTvshowToUser = await User.addTvshow(userId, tvshowId);
        if (addTvshowToUser) {
          return res.sendStatus(200);
        }
      } else if (action === 'remove') {
        const isUserFollowingTvshow = await User.isFollowingTvshow(userId, tvshowId);
        if (!isUserFollowingTvshow) {
          return res.status(400).json({ error: ERROR.TVSHOW.NOT_FOLLOWING });
        }
        const removeTvshowFromUser = await User.removeTvshow(userId, tvshowId);
        if (removeTvshowFromUser) {
          return res.sendStatus(200);
        }
      }
      throw new Error();
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: ERROR.SERVER });
    }
  },
  /**
   * Get watchlist page
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {undefined}
   */
  async getWatchlist(req, res) {
    const userId = parseInt(_.get(req, 'user'), 10);
    if (!_.isNumber(userId)) {
      return res.render('watchlist', {
        sidebarIndex: 'watchlist',
      });
    }
    let watchlist = null;
    let unwatchedEpisodesCount = null;
    try {
      // Fetch unwatched episodes
      const unwatchedEpisodes = await User.getWatchlist(userId);
      // Group unwatched episodes by tvshowId
      // Remove unecessary property tvshowId from all episodes
      /* eslint-disable no-param-reassign */
      unwatchedEpisodesCount = _.defaultTo(unwatchedEpisodes.length, null);
      watchlist = _(unwatchedEpisodes)
        .groupBy('tvshowId')
        .map((items, tvshowId) => ({
          tvshowId,
          episodes: _.map(items, item => {
            delete item.tvshowId;
            return item;
          }),
        }))
        .value();
      /* eslint-enable no-param-reassign */
      watchlist = _.map(watchlist, el => ({
        tvshowId: el.tvshowId,
        data: _(el.episodes)
          .groupBy('season')
          .map((items, season) => ({ season, episodes: items }))
          .value(),
      }));
      // Get all different tvshowIds from the unwatched episodes to fetch their posters
      const tvshowIds = _.map(watchlist, 'tvshowId');
      const tvshowPosters = await knex('tvshows')
        .select('images', 'name as tvshowName')
        .select(knex.raw('to_char(thetvdb, \'FM99999999\') as "tvshowId"'))
        .whereRaw('thetvdb = ANY(?)', [tvshowIds]);
      watchlist = _.map(watchlist, item => _.extend(item, _.find(tvshowPosters, { tvshowId: item.tvshowId })));
      // TODO: Merge the above maps if possible (check notes for code snippet)
    } catch (e) {
      console.log(e);
    }
    return res.render('watchlist', {
      sidebarIndex: 'watchlist',
      watchlist,
      unwatchedEpisodesCount,
    });
  },
  /**
   * Get number of unwatched episodes
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {undefined}
   */
  async getNumberOfUnwatchedEpisodes(req, res) {
    const userId = parseInt(_.get(req, 'user'), 10);
    try {
      const unwatchedEpisodesCount = await User.getNumberOfUnwatchedEpisodes(userId);
      return res.json({ unwatchedEpisodesCount });
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: ERROR.SERVER });
    }
  },
  /**
   * Set episode as watched/unwatched
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {undefined}
   */
  async setEpisodeWatchedStatus(req, res) {
    const userId = parseInt(_.get(req, 'user'), 10);
    const tvshowId = parseInt(_.get(req, 'params.tvshowId'), 10);
    const episodeid = parseInt(_.get(req, 'body.episodeid'), 10);
    const setWatched = _.get(req, 'body.setWatched');
    if (!_.isNumber(userId)) {
      return res.status(500).json({ error: ERROR.AUTH.INVALID_ID });
    } else if (!_.isNumber(tvshowId)) {
      return res.status(500).json({ error: ERROR.TVSHOW.INVALID_ID });
    } else if (!_.isNumber(episodeid)) {
      return res.status(500).json({ error: ERROR.EPISODE.INVALID_ID });
    } else if (!_.isString(setWatched) || (setWatched !== 'true' && setWatched !== 'false')) {
      return res.status(500).json({ error: ERROR.EPISODE.INVALID_ACTION });
    }
    try {
      if (setWatched === 'true') {
        const setEpisodeWatched = await Tvshow.setEpisodeWatched(userId, tvshowId, episodeid);
        if (!setEpisodeWatched) {
          return res.status(400).json({ error: ERROR.EPISODE.ALREADY_WATCHED });
        }
      } else if (setWatched === 'false') {
        const setEpisodeUnwatched = await Tvshow.setEpisodeUnwatched(userId, tvshowId, episodeid);
        if (!setEpisodeUnwatched) {
          return res.status(400).json({ error: ERROR.EPISODE.ALREADY_UNWATCHED });
        }
      }
      return res.sendStatus(200);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: ERROR.SERVER });
    }
  },
  /**
   * Set season as watched
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {undefined}
   */
  async setSeasonWatched(req, res) {
    const userId = parseInt(_.get(req, 'user'), 10);
    const tvshowId = parseInt(_.get(req, 'params.tvshowId'), 10);
    const episodes = _.get(req, 'body.episodes');
    if (!_.isNumber(userId)) {
      return res.status(500).json({ error: ERROR.AUTH.INVALID_ID });
    } else if (!_.isNumber(tvshowId)) {
      return res.status(500).json({ error: ERROR.TVSHOW.INVALID_ID });
    } else if (_.isEmpty(episodes)) {
      return res.status(500).json({ error: ERROR.EPISODE.EMPTY_ARRAY });
    }
    try {
      const setSeasonWatched = await Tvshow.setSeasonWatched(userId, tvshowId, episodes);
      if (setSeasonWatched) return res.sendStatus(200);
      throw new Error();
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: ERROR.SERVER });
    }
  },
  /**
   * Render user profile
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {undefined}
   */
  getProfile(req, res) {
    const userId = parseInt(_.get(req, 'user'), 10);
    if (!_.isNumber(userId)) {
      return res.status(400).render('error', {
        error: ERROR.AUTH.INVALID_ID,
      });
    }
    return res.render('user', {
      id: userId,
    });
  },
};

module.exports = userController;
