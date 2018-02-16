import _ from 'lodash';
import knex from '../db/connection';
import User from './../models/user';
import Tvshow from './../models/tvshow';
import CONSTANTS from '../utils/constants';

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
    const { tvshowId } = req.params;
    const userId = req.user;
    try {
      const isUserFollowingTvshow = await User.isFollowingTvshow(userId, tvshowId);
      if (isUserFollowingTvshow) {
        return res.status(400).json({ error: CONSTANTS.ERROR.TVSHOW.ALREADY_FOLLOWING });
      }
      const addTvshowToUser = await User.addTvshow(userId, tvshowId);
      if (addTvshowToUser) {
        return res.sendStatus(200);
      }
      throw new Error();
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: CONSTANTS.ERROR.SERVER });
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
        return res.status(400).json({ error: CONSTANTS.ERROR.TVSHOW.NOT_FOLLOWING });
      }
      const removeTvshowFromUser = await User.removeTvshow(userId, tvshowId);
      if (removeTvshowFromUser) {
        return res.sendStatus(200);
      }
      throw new Error();
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: CONSTANTS.ERROR.SERVER });
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
          return res.status(400).json({ error: CONSTANTS.ERROR.TVSHOW.ALREADY_FOLLOWING });
        }
        const addTvshowToUser = await User.addTvshow(userId, tvshowId);
        if (addTvshowToUser) {
          return res.sendStatus(200);
        }
        throw new Error();
      } else if (action === 'remove') {
        const isUserFollowingTvshow = await User.isFollowingTvshow(userId, tvshowId);
        if (!isUserFollowingTvshow) {
          return res.status(400).json({ error: CONSTANTS.ERROR.TVSHOW.NOT_FOLLOWING });
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
      return res.status(500).json({ error: CONSTANTS.ERROR.SERVER });
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
    console.log('im here');
    try {
      if (setWatched === true) {
        const setEpisodeWatched = await Tvshow.setEpisodeWatched(userId, tvshowId, episodeId);
        if (!setEpisodeWatched) {
          return res.status(400).json({ error: CONSTANTS.ERROR.EPISODE.ALREADY_WATCHED });
        }
      } else {
        const setEpisodeUnwatched = await Tvshow.setEpisodeUnwatched(userId, tvshowId, episodeId);
        if (!setEpisodeUnwatched) {
          return res.status(400).json({ error: CONSTANTS.ERROR.EPISODE.ALREADY_UNWATCHED });
        }
      }
      return res.sendStatus(200);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: CONSTANTS.ERROR.SERVER });
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
      return res.status(500).json({ error: CONSTANTS.ERROR.SERVER });
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
