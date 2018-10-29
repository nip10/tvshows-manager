import _ from 'lodash';
import moment from 'moment';
import rp from 'request-promise';
import path from 'path';
import cp from 'child_process';
import util from 'util';
import knex from '../db/connection';
import { API } from '../utils/constants';

const { THETVDB_API_KEY, THETVDB_API_USERKEY, THETVDB_API_USERNAME, OMDB_API_KEY, NODE_ENV } = process.env;

/**
 * Initialize connection to the TheTVDb API and start
 * child process to renew the token every X hours
 */
export function init() {
  // get "initial" token from the thetvdb api
  console.log('Requesting token from TheTvDb API');
  return this.getToken()
    .then(newToken => {
      if (!_.isString(newToken) || _.isEmpty(newToken)) {
        throw new Error('Token received is invalid.');
      }
      this.apiToken = newToken;
      console.log(`Token received`);
    })
    .then(() => {
      if (NODE_ENV !== 'development') {
        // start child process to renew the token when needed
        this.startChildProcess();
      }
    })
    .catch(e => console.log(e));
}
/**
 * Start child process that renews the TheTVDB api token
 *
 * This child process is nothing more than a cronjob
 * that runs every X hours and sends the token back here
 */
export function startChildProcess() {
  // create child process using fork
  const child = cp.fork(path.join(__dirname, '..', 'scripts', 'tvdb-api-cron'));

  // listen to messages from the child process
  child
    .on('message', msg => {
      // error getting the message
      if (!msg) console.log('[PARENT] Received empty msg from child.');
      if (msg === 'oldToken') {
        // child process is requesting the old token
        console.log('[PARENT] [2] Child process requested the old token');
        // send the old token to the child process so it can be renewed
        child.send(this.apiToken);
      } else {
        console.log('[PARENT] [5] Received new token from the child process');
        // set the new token received from the child process
        this.apiToken = msg;
      }
    })
    .on('exit', () => {
      console.log('[PARENT] Child process has been terminated.');
    });
}
/**
 * Get TheTVDb api token
 *
 * @returns {String} TheTVDb api token
 */
export async function getToken() {
  const requestOptions = {
    method: 'POST',
    uri: API.THETVDB.AUTH_LOGIN,
    body: {
      apikey: THETVDB_API_KEY,
      userkey: THETVDB_API_USERKEY,
      username: THETVDB_API_USERNAME,
    },
    json: true,
  };
  try {
    const { token } = await rp(requestOptions);
    return token;
  } catch (e) {
    console.log(e);
    return null;
  }
}
/**
 * Search for a tvshow
 *
 * @param {String} tvshowName - tvshow name
 * @returns {{id: Number, seriesName: String}[]} array of tvshow objects
 */
export async function search(tvshowName) {
  const requestOptions = {
    method: 'GET',
    uri: API.THETVDB.SEARCH,
    headers: {
      'Accept-Language': 'en',
      Authorization: `Bearer ${this.apiToken}`,
    },
    qs: {
      name: tvshowName,
    },
    json: true,
  };
  // There's no need to check if the data exist because the api returns 404 when there are
  // no results.
  return rp(requestOptions).then(({ data }) =>
    _.map(data, tvshow => {
      if (_.isEmpty(tvshow.status)) {
        tvshow.status = 'NA'; // eslint-disable-line no-param-reassign
      } else if (tvshow.status === 'Continuing') {
        tvshow.status = 'Running'; // eslint-disable-line no-param-reassign
      }
      return _.pick(tvshow, ['id', 'seriesName', 'banner', 'status']);
    })
  );
}
/**
 * Get information about a tvshow from the external api
 *
 * @param {Number} tvshowId - tvshow id
 * @returns {{name: string, overview: string, status: string, imdb: string, thetvdb: number, genre: string[], premiered: string, imdbRating: number, network: string, airdate: string, tvrating: string, images: string[]}} Information about the show
 */
export async function getInfoFromApi(tvshowId) {
  const requestOptions = {
    method: 'GET',
    uri: API.THETVDB.INFO({ tvshowId }),
    headers: {
      'Accept-Language': 'en',
      Authorization: `Bearer ${this.apiToken}`,
    },
    qs: {
      keys: 'seriesName,overview,status,imdbId,id,genre,firstAired,network,airsDayOfWeek,airsTime,rating,banner',
    },
    json: true,
  };
  try {
    const { data } = await rp(requestOptions);
    // Check if airdate is defined
    let airdate = null;
    if (
      _.isString(data.airsDayOfWeek) &&
      !_.isEmpty(data.airsDayOfWeek) &&
      _.isString(data.airsTime) &&
      !_.isEmpty(data.airsTime)
    ) {
      airdate = `${data.airsDayOfWeek} at ${data.airsTime}`;
    }
    return {
      name: data.seriesName,
      overview: data.overview,
      status: data.status === 'Continuing' ? 'Running' : data.status,
      imdb: data.imdbId,
      imdbRating: data.imdbRating,
      thetvdb: data.id,
      genre: data.genre,
      premiered: moment(data.firstAired).format('DD-MM-YYYY'),
      network: data.network,
      airdate,
      tvrating: data.rating,
      images: [data.banner],
    };
  } catch (e) {
    console.log(e);
    return null;
  }
}
/**
 * Get tvshow information from the database
 *
 * @param {Number} tvshowId - tvshow id
 * @returns {{thetvdb: number, name: string, overview: string, premiered: string, network: string, imdbRating: number, status: string, airdate: string, images: string[], imdb: string, genre: string[], tvrating: string}} Tvshow information
 */
export async function getInfoFromDb(tvshowId) {
  try {
    const getTvshowInfoFromDb = await knex('tvshows')
      .select()
      .where('thetvdb', tvshowId)
      .first();
    return {
      thetvdb: Number.parseInt(tvshowId, 10),
      name: getTvshowInfoFromDb.name,
      overview: getTvshowInfoFromDb.overview,
      premiered: getTvshowInfoFromDb.premiered,
      network: getTvshowInfoFromDb.network,
      status: getTvshowInfoFromDb.status,
      airdate: getTvshowInfoFromDb.airdate,
      images: [...getTvshowInfoFromDb.images],
      imdb: getTvshowInfoFromDb.imdb,
      imdbRating: getTvshowInfoFromDb.imdbRating,
      genre: [...getTvshowInfoFromDb.genre],
      tvrating: getTvshowInfoFromDb.tvrating,
    };
  } catch (e) {
    console.log(e);
    return null;
  }
}
/**
 * Get artwork of a tvshow
 *
 * @param {Number} tvshowId - tvshow id
 * @param {String} imageType - artwork type (poster, banner)
 * @returns {String} url for the first artwork of specified type
 */
export async function getArtworkFromApi(tvshowId, imageType) {
  const requestOptions = {
    method: 'GET',
    uri: API.THETVDB.IMAGES({ tvshowId }),
    headers: {
      'Accept-Language': 'en',
      Authorization: `Bearer ${this.apiToken}`,
    },
    qs: {
      keyType: imageType,
    },
    json: true,
  };
  try {
    const { data } = await rp(requestOptions);
    return data[0].fileName;
  } catch (e) {
    console.log(e);
    return null;
  }
}
/**
 * Get number of seasons of a tvshow
 *
 * The api has an array of "airedSeasons" that contains all the seasons for a tvshow.
 * This array MAY contain a season 0, which is where the special episodes are placed.
 *
 * @param {Number} tvshowId - tvshow id
 * @returns {Number} number of seasons
 */
export async function getLatestSeasonFromApi(tvshowId) {
  const requestOptions = {
    method: 'GET',
    uri: API.THETVDB.SEASON({ tvshowId }),
    headers: {
      'Accept-Language': 'en',
      Authorization: `Bearer ${this.apiToken}`,
    },
    json: true,
  };
  try {
    const { data } = await rp(requestOptions);
    if (data.airedSeasons.includes('0')) {
      return data.airedSeasons.length - 1;
    }
    return data.airedSeasons.length;
  } catch (e) {
    console.log(e);
    return 1;
  }
}
/**
 * Get tvshow episodes from a particular season from the api
 *
 * @param {Number} tvshowId - tvshow id
 * @param {Number} season - season
 * @returns {{epnum: number, name: string, airdate: date, overview: string}[]} tvshow episodes from a particular season
 */
export async function getEpisodesFromSeasonFromApi(tvshowId, season) {
  const requestOptions = {
    method: 'GET',
    uri: API.THETVDB.EPISODES_QUERY({ tvshowId }),
    headers: {
      'Accept-Language': 'en',
      Authorization: `Bearer ${this.apiToken}`,
    },
    qs: {
      airedSeason: season,
    },
    json: true,
  };
  try {
    const { data } = await rp(requestOptions);
    const episodes = _.map(data, episode => ({
      id: episode.id,
      epnum: episode.airedEpisodeNumber,
      name: episode.episodeName,
      airdate: episode.firstAired,
      overview: episode.overview,
    }));
    return episodes;
  } catch (e) {
    console.log(e);
    return null;
  }
}
/**
 * Get tvshow episodes from a specific season from the db
 *
 * @param {Number} tvshowId - tvshow id
 * @param {Number} season - season
 * @returns {{}[]} episodes from the specified season
 */
export function getEpisodesFromSeasonFromDb(tvshowId, season) {
  return knex('episodes')
    .select('epnum', 'title', 'id')
    .select(knex.raw('to_char(airdate, \'DD-MM-YYYY\') as "airdate"'))
    .where({ tvshow_id: tvshowId, season })
    .orderBy('epnum', 'asc')
    .then(dbResp =>
      _.map(dbResp, episode => ({
        id: episode.id,
        epnum: episode.epnum,
        name: episode.title,
        airdate: episode.airdate,
      }))
    );
}
/**
 * Get the latest season of a tvshow
 *
 * @param {Number} tvshowId - tvshow id
 * @returns {Number} latest season
 */
export async function getLatestSeasonFromDb(tvshowId) {
  try {
    const latestSeason = await knex('episodes')
      .select(knex.raw('max(??)', ['season']))
      .where('tvshow_id', tvshowId)
      .first();
    if (!_.isFinite(latestSeason.max)) throw new Error();
    return latestSeason.max;
  } catch (e) {
    console.log(e);
    return null;
  }
}
/**
 * Check if a tvshow is on the database
 *
 * @param {Number} tvshowId - tvshow id
 * @returns {Boolean} tvshow is on the database
 */
export async function isOnDb(tvshowId) {
  const innerQuery = knex
    .select(1)
    .from('tvshows')
    .where('thetvdb', tvshowId)
    .limit(1)
    .first();
  try {
    const isShowOnDb = await knex.raw(innerQuery).wrap('select exists (', ')');
    return isShowOnDb.rows[0].exists || false;
  } catch (e) {
    console.log(e);
    return false;
  }
}
/**
 * Add tvshow to the database
 *
 * @param {{}} tvshowInfo - tvshow information
 * @returns {undefined}
 */
export async function addTvshowToDb(tvshowInfo) {
  // 1. TvShow information
  try {
    // 1.1 Insert show information in the database
    await knex('tvshows').insert(tvshowInfo);
  } catch (e) {
    console.log(e);
    return;
  }
  // 2. Episodes information
  // 2.1 Fetch all episodes
  const tvshowId = tvshowInfo.thetvdb;
  const episodes = [];
  /**
   * Make requests to paginated api endpoints.
   *
   * @param {String} apiToken - TheTVDb apiToken
   * @param {Number} [page=1] - Page to fetch (defaults to 1)
   * @returns {Boolean} request successful
   */
  async function requestPaginated(apiToken, page = 1) {
    const requestOptions = {
      method: 'GET',
      uri: API.THETVDB.EPISODES_QUERY({ tvshowId }),
      headers: {
        'Accept-Language': 'en',
        Authorization: `Bearer ${apiToken}`,
      },
      qs: {
        page,
      },
      json: true,
    };
    try {
      const res = await rp(requestOptions);
      const filteredEpisodes = _.map(res.data, episode => ({
        tvshow_id: tvshowId,
        id: episode.id,
        season: episode.airedSeason,
        epnum: episode.airedEpisodeNumber,
        title: !_.isEmpty(episode.episodeName) ? episode.episodeName : null,
        overview: !_.isEmpty(episode.overview) ? episode.overview : null,
        airdate: !_.isEmpty(episode.firstAired) ? episode.firstAired : null,
      }));
      Array.prototype.push.apply(episodes, filteredEpisodes);
      if (res.links.next) return requestPaginated(apiToken, res.links.next);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
  try {
    const requestEpisodes = await requestPaginated(this.apiToken);
    if (!requestEpisodes) throw new Error('Error inserting episodes in the database.');
    // 2.2 Insert episodes in the database
    await knex('episodes').insert(episodes);
  } catch (e) {
    console.log(`Error fetching episodes. Error details: ${e}`);
  }
}
/**
 * Get imdb rating
 *
 * @param {Number} imdbId - tvshow imdb id
 * @returns {String} imdb rating
 */
export async function getImdbRating(imdbId) {
  const requestOptions = {
    method: 'GET',
    uri: API.OMDB.IMDB_RATING({ imdbId, OMDB_API_KEY }),
    json: true,
  };
  try {
    const { imdbRating } = await rp(requestOptions);
    if (_.isEmpty(imdbRating)) throw new Error();
    const imdbRatingParsed = Number.parseFloat(imdbRating, 10).toFixed(1);
    return imdbRatingParsed;
  } catch (e) {
    console.log(e);
    return null;
  }
}
/**
 * Set episode as watched
 *
 * @param {Number} userId - user id
 * @param {Number} tvshowId - tvshow id
 * @param {Number} episodeId - episode id
 * @returns {Boolean} episode was set as watched
 */
export function setEpisodeWatched(userId, tvshowId, episodeId) {
  return knex('usereps').insert({
    user_id: userId,
    tvshow_id: tvshowId,
    ep_id: episodeId,
  });
}
/**
 * Set episode as unwatched
 *
 * @param {Number} userId - user id
 * @param {Number} tvshowId - tvshow id
 * @param {Number} episodeId - episode id
 * @returns {Boolean} episode was set as unwatched
 */
export function setEpisodeUnwatched(userId, tvshowId, episodeId) {
  return knex('usereps')
    .del()
    .where({
      user_id: userId,
      tvshow_id: tvshowId,
      ep_id: episodeId,
    });
}
/**
 * Set season as watched
 *
 * @param {Number} userId - user id
 * @param {Number} tvshowId - tvshow id
 * @param {Number[]} episodesId - all episode id's from a season
 * @returns {Promise}
 */
export function setSeasonWatched(userId, tvshowId, episodesId) {
  const queryData = _.map(episodesId, episodeId => ({
    user_id: userId,
    tvshow_id: tvshowId,
    ep_id: episodeId,
  }));
  const query = util.format(
    '%s ON CONFLICT (user_id, tvshow_id, ep_id) DO NOTHING',
    knex('usereps')
      .insert(queryData)
      .toString()
  );
  return knex.raw(query);
}
/**
 * Filter season finale episodes from a set of episodes
 *
 * @param {[{}]} episodeIds episode id's
 * @returns {[{}]} season finale episode id's
 */
export function getSeasonFinaleEpisodes(episodeIds) {
  return knex('episodes')
    .select('id')
    .from(
      knex.raw(
        '(SELECT *, ROW_NUMBER() OVER (PARTITION BY tvshow_id, season ORDER BY epnum DESC) AS ranking FROM episodes)C'
      )
    )
    .where({ ranking: 1 })
    .whereIn('id', episodeIds);
}
/**
 * Get posters for tvshows
 *
 * @param {Number[]} tvshowIds Array of tvshowids
 * @returns Array of objects containing posters and tvshowids
 */
export function getPosters(tvshowIds) {
  return knex('tvshows')
    .select('images', 'name as tvshowName')
    .select(knex.raw('to_char(thetvdb, \'FM99999999\') as "tvshowId"'))
    .whereRaw('thetvdb = ANY(?)', [tvshowIds]);
}

init();
