import _ from 'lodash';
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
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   * @returns {undefined}
   */
  async addTvshow(req, res) {
    const tvshowId = Number.parseInt(req.params.tvshowId, 10);
    const userId = Number.parseInt(req.user, 10);
    if (!_.isFinite(userId)) {
      return res.status(400).json({ error: ERROR.AUTH.INVALID_ID });
    } else if (!_.isFinite(tvshowId)) {
      return res.status(400).json({ error: ERROR.TVSHOW.INVALID_ID });
    }
    try {
      await User.addTvshow(userId, tvshowId);
      return res.sendStatus(200);
    } catch (e) {
      console.log(e);
      return res.status(400).json({ error: ERROR.TVSHOW.ALREADY_FOLLOWING });
    }
  },
  /**
   * Remove tvshow from user
   *
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   * @returns {undefined}
   */
  async removeTvshow(req, res) {
    const tvshowId = Number.parseInt(req.params.tvshowId, 10);
    const userId = Number.parseInt(req.user, 10);
    if (!_.isFinite(userId)) {
      return res.status(400).json({ error: ERROR.AUTH.INVALID_ID });
    } else if (!_.isFinite(tvshowId)) {
      return res.status(400).json({ error: ERROR.TVSHOW.INVALID_ID });
    }
    try {
      const removedTvshow = await User.removeTvshow(userId, tvshowId);
      if (removedTvshow === 1) {
        return res.sendStatus(200);
      }
      throw new Error();
    } catch (e) {
      return res.status(400).json({ error: ERROR.TVSHOW.NOT_FOLLOWING });
    }
  },
  /**
   * Get watchlist page
   *
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   * @returns {undefined}
   */
  async getWatchlist(req, res) {
    const userId = Number.parseInt(req.user, 10);
    let watchlist = null;
    let unwatchedEpisodesCount = null;
    try {
      // Fetch unwatched episodes
      const unwatchedEpisodes = await User.getWatchlist(userId);
      // Group unwatched episodes by tvshowId
      // Remove unnecessary property tvshowId from all episodes
      /* eslint-disable no-param-reassign */
      unwatchedEpisodesCount = unwatchedEpisodes.length;
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
      // Group unwatched episodes by season
      watchlist = _.map(watchlist, el => ({
        tvshowId: el.tvshowId,
        data: _(el.episodes)
          .groupBy('season')
          .map((items, season) => ({ season, episodes: items }))
          .value(),
      }));
      // Get all different tvshowIds from the unwatched episodes to fetch their posters
      const tvshowIds = _.map(watchlist, 'tvshowId');
      const tvshowPosters = await Tvshow.getPosters(tvshowIds);
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
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   * @returns {undefined}
   */
  async getNumberOfUnwatchedEpisodes(req, res) {
    const userId = Number.parseInt(req.user, 10);
    try {
      const unwatchedEpisodesCount = await User.getNumberOfUnwatchedEpisodes(userId);
      return res.json({ unwatchedEpisodesCount });
    } catch (e) {
      return res.status(500).json({ error: ERROR.SERVER });
    }
  },
  /**
   * Set episode as watched/unwatched
   *
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   * @returns {undefined}
   */
  async setEpisodeWatchedStatus(req, res) {
    const userId = Number.parseInt(req.user, 10);
    const tvshowId = Number.parseInt(req.params.tvshowId, 10);
    const episodeId = Number.parseInt(req.params.episodeId, 10);
    const setWatched = _.get(req.body, 'setWatched');
    if (!_.isFinite(userId)) {
      return res.status(500).json({ error: ERROR.AUTH.INVALID_ID });
    } else if (!_.isFinite(tvshowId)) {
      return res.status(500).json({ error: ERROR.TVSHOW.INVALID_ID });
    } else if (!_.isFinite(episodeId)) {
      return res.status(500).json({ error: ERROR.EPISODE.INVALID_ID });
    } else if (!_.isString(setWatched) || (setWatched !== 'true' && setWatched !== 'false')) {
      return res.status(500).json({ error: ERROR.EPISODE.INVALID_ACTION });
    }
    if (setWatched === 'true') {
      try {
        await Tvshow.setEpisodeWatched(userId, tvshowId, episodeId);
      } catch (e) {
        return res.status(400).json({ error: ERROR.EPISODE.ALREADY_WATCHED });
      }
    } else if (setWatched === 'false') {
      try {
        const setEpisodeUnwatched = await Tvshow.setEpisodeUnwatched(userId, tvshowId, episodeId);
        if (setEpisodeUnwatched !== 1) {
          return res.status(400).json({ error: ERROR.EPISODE.ALREADY_UNWATCHED });
        }
      } catch (e) {
        return res.status(500).json({ error: ERROR.SERVER });
      }
    }
    return res.sendStatus(200);
  },
  /**
   * Set season as watched
   *
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   * @returns {undefined}
   */
  async setSeasonWatched(req, res) {
    const userId = Number.parseInt(req.user, 10);
    const tvshowId = Number.parseInt(req.params.tvshowId, 10);
    const seasonNum = Number.parseInt(req.params.seasonNum, 10);
    if (!_.isFinite(userId)) {
      return res.status(500).json({ error: ERROR.AUTH.INVALID_ID });
    }
    if (!_.isFinite(tvshowId)) {
      return res.status(500).json({ error: ERROR.TVSHOW.INVALID_ID });
    }
    try {
      // Get all episodes from selected season
      const episodesIds = await Tvshow.getEpisodesFromSeasonFromDb(tvshowId, seasonNum).then(episodes =>
        _.map(episodes, episode => episode.id)
      );
      // Mark them as watched
      await Tvshow.setSeasonWatched(userId, tvshowId, episodesIds);
      return res.sendStatus(200);
    } catch (e) {
      console.log(e);
      return res.status(400).json({ error: ERROR.SEASON.ALREADY_WATCHED });
    }
  },
  /**
   * Render user profile
   *
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   * @returns {undefined}
   */
  getProfile(req, res) {
    const userId = Number.parseInt(req.user, 10);
    return res.render('user', {
      id: userId,
    });
  },
};

module.exports = userController;
