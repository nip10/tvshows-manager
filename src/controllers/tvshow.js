import _ from 'lodash';
import Tvshow from '../models/tvshow';
import User from '../models/user';
import { ERROR, MISC } from '../utils/constants';

/**
 * Tvshow controller - All functions related to the tvshows feature
 * @module controllers/tvshow
 */

const tvshowsController = {
  /**
   * Search for a tvshow (calls external api)
   *
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   */
  async search(req, res) {
    const tvshowName = _.get(req.params, 'tvshowName');
    if (!_.isString(tvshowName) || tvshowName.length < 4) {
      return res.status(400).json({ error: ERROR.TVSHOW.INVALID_NAME });
    }
    try {
      const tvshows = await Tvshow.search(tvshowName);
      return res.json(tvshows);
    } catch (e) {
      return res.status(400).json({ error: ERROR.TVSHOW.NOT_FOUND });
    }
  },
  /**
   * Search for a tvshow and render the search results view.
   *
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   */
  async searchFull(req, res) {
    const tvshowName = _.get(req.params, 'tvshowName');
    if (!_.isString(tvshowName) || tvshowName.length < 4) {
      return res.status(400).json({ error: ERROR.TVSHOW.INVALID_NAME });
    }
    try {
      const tvshows = await Tvshow.search(tvshowName);
      return res.render('search', { tvshows });
    } catch (e) {
      // TODO: add error msg 'no tvshows found'
      return res.status(500).render('error');
    }
  },
  /**
   * Get episodes from the db
   *
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   * @returns {undefined}
   */
  async getEpisodes(req, res) {
    const tvshowId = Number.parseInt(req.params.tvshowId, 10);
    const season = Number.parseInt(req.query.season, 10);
    if (!_.isFinite(tvshowId)) {
      return res.status(400).json({ error: ERROR.TVSHOW.INVALID_ID });
    }
    if (!_.isFinite(season)) {
      return res.status(400).json({ error: ERROR.TVSHOW.INVALID_SEASON });
    }
    try {
      const episodes = await Tvshow.getEpisodesFromSeasonFromDb(tvshowId, season);
      return res.json({ episodes });
    } catch (e) {
      return res.status(400).json({ error: ERROR.EPISODE.NOT_FOUND });
    }
  },
  /**
   * Get tvshow data (and render)
   *
   * 1. Get tvshow data from the db
   * If tvshow data is NOT on the db,
   * 2. Get tvshow data from the api
   * 3. Check if user is following the tvshow (if logged in)
   * 4. Render tvshow view
   *
   * tvshowdata is the tvshow info + episodes
   *
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   * @returns {undefined}
   */
  async getData(req, res) {
    const { tvshowId } = req.params;
    // Check if the tvshow is on the db
    let isTvshowOnDb;
    try {
      isTvshowOnDb = await Tvshow.isOnDb(tvshowId);
      if (_.isNil(isTvshowOnDb)) {
        // TODO: Test throwing here
        isTvshowOnDb = false;
      }
    } catch (e) {
      // If the DB is offline, we allow this to continue and fetch the data from the external API
      isTvshowOnDb = false;
    }
    let tvshowData;
    if (isTvshowOnDb) {
      // Get tvshow data from the db
      try {
        // Get latest season (in order to display the last season episodes)
        const latestSeason = await Tvshow.getLatestSeasonFromDb(tvshowId);
        if (!latestSeason) throw new Error();
        // Get tvshow info, artwork and episodes
        const getTvshowData = await Promise.all([
          Tvshow.getInfoFromDb(tvshowId),
          Tvshow.getEpisodesFromSeasonFromDb(tvshowId, latestSeason),
        ]);
        tvshowData = Object.assign({}, getTvshowData[0], { episodes: getTvshowData[1] }, { latestSeason });
      } catch (e) {
        console.log(e);
        return res.status(500).render('error', {
          error: ERROR.SERVER,
        });
      }
    } else {
      // Get tvshow data from the api
      try {
        // Get latest season (in order to display the last season episodes)
        const latestSeason = await Tvshow.getLatestSeasonFromApi(tvshowId);
        if (!latestSeason) throw new Error();
        // Get tvshow info, artwork and episodes
        const getTvshowData = await Promise.all([
          Tvshow.getInfoFromApi(tvshowId),
          Tvshow.getArtworkFromApi(tvshowId, 'poster'),
          Tvshow.getEpisodesFromSeasonFromApi(tvshowId, latestSeason),
        ]);
        // Get tvshow imdb rating
        const imdbRating = await Tvshow.getImdbRating(getTvshowData[0].imdb);
        // Merge tvshow info and artwork
        tvshowData = Object.assign(
          {},
          getTvshowData[0],
          { images: [getTvshowData[0].images[0], getTvshowData[1]] },
          { imdbRating },
          { episodes: getTvshowData[2] },
          { latestSeason }
        );
        // Add tvshow info to the db (in the background)
        const keysToPick = [
          'name',
          'overview',
          'status',
          'imdb',
          'imdbRating',
          'thetvdb',
          'genre',
          'premiered',
          'network',
          'airdate',
          'tvrating',
          'images',
        ];
        Tvshow.addTvshowToDb(_.pick(tvshowData, keysToPick)).catch(e => console.log(e));
      } catch (e) {
        console.log(e);
        return res.status(500).render('error', {
          error: ERROR.SERVER,
        });
      }
    }
    const userId = _.get(req, 'user', null);
    // Check if user is following the tvshow
    let isUserFollowingTvshow;
    if (_.isNil(userId)) {
      isUserFollowingTvshow = false;
    } else {
      try {
        isUserFollowingTvshow = await User.isFollowingTvshow(userId, tvshowId);
      } catch (e) {
        console.log(e);
        // If we can't get the following status, assume the user is not following the tvshow
        isUserFollowingTvshow = false;
      }
    }
    // If the user is following the tvshow, check if he has watched episodes
    if (isUserFollowingTvshow) {
      const episodeIds = _.map(tvshowData.episodes, ep => ep.id);
      try {
        const watchedEpisodesIds = await User.getWatchedEpisodesById(episodeIds, userId);
        tvshowData.episodes = _.map(tvshowData.episodes, episode => ({
          id: episode.id,
          num: episode.num,
          name: episode.name,
          airdate: episode.airdate,
          watched: _.includes(watchedEpisodesIds, episode.id),
        }));
      } catch (e) {
        console.log(e);
      }
    }
    // Check if there are images for the tvshow
    let banner = null;
    let poster = null;
    if (_.isString(tvshowData.images[0]) && !_.isEmpty(tvshowData.images[0])) {
      banner = MISC.THETVDB.GRAPHICS({ id: tvshowData.images[0] });
    }
    if (_.isString(tvshowData.images[1]) && !_.isEmpty(tvshowData.images[1])) {
      poster = MISC.THETVDB.GRAPHICS({ id: tvshowData.images[1] });
    }
    return res.render('tvshow', {
      name: tvshowData.name,
      id: tvshowId,
      banner,
      poster,
      overview: tvshowData.overview,
      premiered: tvshowData.premiered,
      network: tvshowData.network,
      status: tvshowData.status,
      airdate: tvshowData.airdate,
      genre: tvshowData.genre,
      imdb: MISC.IMDB({ imdbId: tvshowData.imdb }),
      imdbRating: tvshowData.imdbRating,
      season: tvshowData.latestSeason,
      episodes: tvshowData.episodes,
      isUserFollowingTvshow,
      isAuthenticated: !!userId,
    });
  },
};

module.exports = tvshowsController;
