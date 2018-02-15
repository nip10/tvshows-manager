import _ from 'lodash';
import knex from '../db/connection';
import User from './../models/user';
import Tvshow from './../models/tvshow';

/**
 * User controller - All functions related to users
 * @module controllers/user
 */

const userController = {
  /**
   * Create a new user
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {undefined}
   */
  async createUser(req, res, next) {
    const { email, password } = req.body;
    try {
      await User.createUser(email, password);
      return next();
    } catch (e) {
      console.log(e);
      return next(); // TODO: This should break here !!
    }
  },
  /**
   * Add tvshow to user
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {undefined}
   */
  async addTvshowToUser(req, res) {
    const { tvshowId } = req.params;
    const userId = req.user;
    try {
      const isUserFollowingTvshow = await User.isFollowingTvshow(userId, tvshowId);
      if (isUserFollowingTvshow) {
        return res.status(400).json({ error: 'You are already following this tvshow.' });
      }
      const addTvshowToUser = await User.addTvshow(userId, tvshowId);
      if (addTvshowToUser) {
        return res.sendStatus(200);
      }
      throw new Error();
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: 'Server error. Please try again later.' });
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
    const { tvshowId } = req.params;
    const userId = req.user;
    try {
      const isUserFollowingTvshow = await User.isFollowingTvshow(userId, tvshowId);
      if (!isUserFollowingTvshow) {
        return res.status(400).json({ error: 'You are not following this tvshow.' });
      }
      const removeTvshowFromUser = await User.removeTvshow(userId, tvshowId);
      if (removeTvshowFromUser) {
        return res.sendStatus(200);
      }
      throw new Error();
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: 'Server error. Please try again later.' });
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
    const { tvshowId } = req.params;
    const { action } = req.body;
    const userId = req.user;
    try {
      if (action === 'add') {
        const isUserFollowingTvshow = await User.isFollowingTvshow(userId, tvshowId);
        if (isUserFollowingTvshow) {
          return res.status(400).json({ error: 'You are already following this tvshow.' });
        }
        const addTvshowToUser = await User.addTvshow(userId, tvshowId);
        if (addTvshowToUser) {
          return res.sendStatus(200);
        }
        throw new Error();
      } else if (action === 'remove') {
        const isUserFollowingTvshow = await User.isFollowingTvshow(userId, tvshowId);
        if (!isUserFollowingTvshow) {
          return res.status(400).json({ error: 'You are not following this tvshow.' });
        }
        const removeTvshowFromUser = await User.removeTvshow(userId, tvshowId);
        if (removeTvshowFromUser) {
          return res.sendStatus(200);
        }
        throw new Error();
      } else {
        return res.sendStatus(400);
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: 'Server error. Please try again later.' });
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
    const userId = req.user;
    let watchlist;
    let unwatchedEpisodesCount;
    try {
      // Fetch unwatched episodes
      // TODO: Move this to Model
      /* eslint-disable func-names */
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
        .andWhere(function() {
          this.whereNotIn('episodes.id', function() {
            this.select('ep_id').from('usereps');
          });
        })
        .orderBy('season', 'asc')
        .orderBy('epnum', 'asc');
      /* eslint-enable func-names */
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
      /* eslint-disable max-len */
      watchlist = _.map(watchlist, item => _.extend(item, _.find(tvshowPosters, { tvshowId: item.tvshowId })));
      // TODO: Merge the above maps if possible (check notes for code snippet)
      /* eslint-enable max-len */
    } catch (e) {
      console.log(e);
      watchlist = null;
    }
    res.render('watchlist', {
      sidebarIndex: 'watchlist',
      watchlist,
      unwatchedEpisodesCount,
    });
  },
  /**
   * Set episode as watched/unwatched
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {undefined}
   */
  async setEpisodeWatchedStatus(req, res) {
    const { tvshowId } = req.params;
    const userId = req.user;
    const { setWatched, episodeId } = req.body;
    try {
      if (setWatched === true) {
        /* eslint-disable max-len */
        const setEpisodeWatched = await Tvshow.setEpisodeWatched(userId, tvshowId, episodeId);
        if (!setEpisodeWatched) {
          // TODO: I'm assuming that the error is on the user when in reality
          // it could be a server error. Check the knex error properties to be
          // able to distinguish both scenarios.
          // (if knex_error.client_error return 400 else return 500)
          // Note: This happens in multiple places.
          return res.status(400).json({ error: 'You already set this episode as watched.' });
        }
      } else {
        const setEpisodeUnwatched = await Tvshow.setEpisodeUnwatched(userId, tvshowId, episodeId);
        if (!setEpisodeUnwatched) {
          return res.status(400).json({ error: 'You already set this episode as unwatched.' });
        }
      }
      /* eslint-enable max-len */
      return res.sendStatus(200);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: 'Server error' });
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
    const userId = req.user;
    const { tvshowId } = req.params;
    const { episodes } = req.body;
    try {
      const setSeasonWatched = await Tvshow.setSeasonWatched(userId, tvshowId, episodes);
      if (setSeasonWatched) return res.sendStatus(200);
      throw new Error();
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: 'Server error' });
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
    const userId = req.user;
    return res.render('user', {
      id: userId,
    });
  },
};

module.exports = userController;
