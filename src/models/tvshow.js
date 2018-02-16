import _ from 'lodash';
import moment from 'moment';
import rp from 'request-promise';
import path from 'path';
import cp from 'child_process';
import knex from '../db/connection';

const { THETVDB_API_KEY, OMDB_API_KEY, NODE_ENV } = process.env;
const THETVDB_API_AUTH_LOGIN = 'https://api.thetvdb.com/login';
const THETVDB_API_SEARCH = 'https://api.thetvdb.com/search/series';
const THETVDB_API_INFO = tvshowId => `https://api.thetvdb.com/series/${tvshowId}/filter`;
const THETVDB_API_IMAGES = tvshowId => `https://api.thetvdb.com/series/${tvshowId}/images/query`;
const THETVDB_API_EPISODES_QUERY = tvshowId => `https://api.thetvdb.com/series/${tvshowId}/episodes/query`;
const THETVDB_API_SEASON = tvshowId => `https://api.thetvdb.com/series/${tvshowId}/episodes/summary`;
const OMDB_API_IMDB_RATING = imdbId => `http://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}`;

const Tvshow = {
  /**
   * Initialize connection to the TheTVDb API and start
   * child process to renew the token every X hours
   */
  init() {
    // get "initial" token from the thetvdb api
    console.log('Requesting token from TheTvDb API');
    return this.getToken()
      .then(newToken => {
        if (!newToken || newToken.length === 0) {
          throw new Error('Token received is invalid.');
        }
        this.apiToken = newToken;
        console.log(`Token received: ${this.apiToken}`);
      })
      .then(() => {
        if (NODE_ENV !== 'development') {
          // start child process to renew the token when needed
          this.startChildProcess();
        }
      })
      .catch(e => console.log(e));
  },
  /**
   * Start child process that renews the TheTVDB api token
   *
   * This child process is nothing more than a cronjob
   * that runs every X hours and sends the token back here
   */
  startChildProcess() {
    // create child process using fork
    const child = cp.fork(path.join(__dirname, '../scripts/tvdb-api-cron'));

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
          console.log('[PARENT] [5] Received new token from the child process: ', msg);
          // set the new token received from the child process
          this.apiToken = msg;
        }
      })
      .on('exit', () => {
        console.log('[PARENT] Child process has been terminated.');
      });
  },
  /**
   * Get TheTVDb api token
   *
   * @returns {string} - TheTVDb api token
   */
  async getToken() {
    const requestOptions = {
      method: 'POST',
      uri: THETVDB_API_AUTH_LOGIN,
      body: {
        apikey: THETVDB_API_KEY,
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
  },
  /**
   * Search for a tvshow
   *
   * @param {string} tvshowName - tvshow name
   * @returns {{id: Number, seriesName: String}[]} - array of tvshow objects
   */
  async search(tvshowName) {
    const requestOptions = {
      method: 'GET',
      uri: THETVDB_API_SEARCH,
      headers: {
        'Accept-Language': 'en',
        Authorization: `Bearer ${this.apiToken}`,
      },
      qs: {
        name: tvshowName,
      },
      json: true,
    };
    try {
      const { data } = await rp(requestOptions);
      const filteredData = _.map(data, tvshow => _.pick(tvshow, ['id', 'seriesName']));
      return filteredData;
    } catch (e) {
      console.log(e);
      return null;
    }
  },
  /**
   * Get information about a tvshow from the external api
   *
   * @param {number} tvshowId - tvshow id
   * @returns {{name: string, overview: string, status: string, imdb: string, thetvdb: number, genre: string[], premiered: string, imdbRating: number, network: string, airdate: string, tvrating: string, images: string[]}} Information about the show
   */
  async getInfoFromApi(tvshowId) {
    const requestOptions = {
      method: 'GET',
      uri: THETVDB_API_INFO(tvshowId),
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
        airdate: `${data.airsDayOfWeek} at ${data.airsTime}`,
        tvrating: data.rating,
        images: [data.banner],
      };
    } catch (e) {
      console.log(e);
      return null;
    }
  },
  /**
   * Get tvshow information from the database
   *
   * @param {number} tvshowId - tvshow id
   * @returns {{thetvdb: number, name: string, overview: string, premiered: string, network: string, imdbRating: number, status: string, airdate: string, images: string[], imdb: string, genre: string[], tvrating: string}} Tvshow information
   */
  async getInfoFromDb(tvshowId) {
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
  },
  /**
   * Get artwork of a tvshow
   *
   * @param {number} tvshowId - tvshow id
   * @param {string} imageType - artwork type (poster, banner)
   * @returns {string} - url for the first artwork of specified type
   */
  async getArtworkFromApi(tvshowId, imageType) {
    const requestOptions = {
      method: 'GET',
      uri: THETVDB_API_IMAGES(tvshowId),
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
  },
  /**
   * Get number of seasons of a tvshow
   *
   * The api has an array of "airedSeasons" that contains all the seasons for a tvshow.
   * This array MAY contain a season 0, which is where the special episodes are placed.
   *
   * @param {number} tvshowId - tvshow id
   * @returns {number} - number of seasons
   */
  async getLatestSeasonFromApi(tvshowId) {
    const requestOptions = {
      method: 'GET',
      uri: THETVDB_API_SEASON(tvshowId),
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
  },
  /**
   * Get tvshow episodes from a particular season from the api
   *
   * @param {number} tvshowId - tvshow id
   * @param {number} season - season
   * @returns {{num: number, name: string, airdate: date, overview: string}[]} - tvshow episodes from a particular season
   */
  async getEpisodesFromSeasonFromApi(tvshowId, season) {
    const requestOptions = {
      method: 'GET',
      uri: THETVDB_API_EPISODES_QUERY(tvshowId),
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
      return data.map(episode => ({
        num: episode.airedEpisodeNumber,
        name: episode.episodeName,
        airdate: episode.firstAired,
        overview: episode.overview,
      }));
    } catch (e) {
      console.log(e);
      return null;
    }
  },
  /**
   * Get tvshow episodes from a specific season from the db
   *
   * @param {number} tvshowId - tvshow id
   * @param {number} season - season
   * @returns {{}[]} - episodes from the specified season
   */
  async getEpisodesFromSeasonFromDb(tvshowId, season) {
    try {
      const getEpisodesFromDb = await knex('episodes')
        .select('epnum', 'title', 'id')
        .select(knex.raw('to_char(airdate, \'DD-MM-YYYY\') as "airdate"'))
        .where({ tvshow_id: tvshowId, season })
        .orderBy('epnum', 'asc');
      const episodes = _.map(getEpisodesFromDb, episode => ({
        id: episode.id,
        num: episode.epnum,
        name: episode.title,
        airdate: episode.airdate,
      }));
      return episodes;
    } catch (e) {
      console.log(e);
      return null;
    }
  },
  /**
   * Get the latest season of a tvshow
   *
   * @param {number} tvshowId - tvshow id
   * @returns {number} - latest season
   */
  async getLatestSeasonFromDb(tvshowId) {
    try {
      const latestSeason = await knex('episodes')
        .select(knex.raw('max(??)', ['season']))
        .where('tvshow_id', tvshowId)
        .first();
      if (!_.isNumber(latestSeason)) throw new Error();
      return latestSeason.max;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
  /**
   * Check if a tvshow is on the database
   *
   * @param {number} tvshowId - tvshow id
   * @returns {boolean} - tvshow is on the database
   */
  async isOnDb(tvshowId) {
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
  },
  /**
   * Add tvshow to the database
   *
   * @param {{}} tvshowInfo - tvshow information
   * @returns {undefined}
   */
  async addTvshowToDb(tvshowInfo) {
    // 1. TvShow information
    try {
      // 1.2 Insert show information in the database
      await knex('tvshows').insert(tvshowInfo);
    } catch (e) {
      return;
    }
    // 2. Episodes information
    // 2.1 Fetch all episodes
    const tvshowId = tvshowInfo.thetvdb;
    const episodes = [];
    /**
     * Make requests to paginated api endpoints.
     *
     * @param {string} apiToken - TheTVDb apiToken
     * @param {number} [page=1] - Page to fetch (defaults to 1)
     * @returns {boolean} - request successful
     */
    async function requestPaginated(apiToken, page = 1) {
      const requestOptions = {
        method: 'GET',
        uri: THETVDB_API_EPISODES_QUERY(tvshowId),
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
          season: episode.airedSeason,
          epnum: episode.airedEpisodeNumber,
          title: episode.episodeName || null,
          overview: episode.overview || null,
          airdate: episode.firstAired || null,
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
      if (requestEpisodes) {
        // 2.2 Insert episodes in the database
        await knex('episodes').insert(episodes);
      } else {
        throw Error('Error inserting episodes in the database.');
      }
    } catch (e) {
      console.log(`Error fetching episodes. Error details: ${e}`);
    }
  },
  /**
   * Get imdb rating
   *
   * @param {Number} imdbId - tvshow imdb id
   * @returns {String} - imdb rating
   */
  async getImdbRating(imdbId) {
    const requestOptions = {
      method: 'GET',
      uri: OMDB_API_IMDB_RATING(imdbId),
      json: true,
    };
    try {
      const { imdbRating } = await rp(requestOptions);
      return imdbRating;
    } catch (e) {
      console.log(e);
      return null;
    }
  },
  /**
   * Set episode as watched
   *
   * @param {Number} userId - user id
   * @param {Number} tvshowId - tvshow id
   * @param {Number} episodeId - episode id
   * @returns {Boolean} - episode was set as watched
   */
  async setEpisodeWatched(userId, tvshowId, episodeId) {
    try {
      await knex('usereps').insert({
        user_id: userId,
        tvshow_id: tvshowId,
        ep_id: episodeId,
      });
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
  /**
   * Set episode as unwatched
   *
   * @param {Number} userId - user id
   * @param {Number} tvshowId - tvshow id
   * @param {Number} episodeId - episode id
   * @returns {Boolean} - episode was set as unwatched
   */
  async setEpisodeUnwatched(userId, tvshowId, episodeId) {
    try {
      await knex('usereps')
        .del()
        .where({
          user_id: userId,
          tvshow_id: tvshowId,
          ep_id: episodeId,
        });
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
  /**
   * Set season as watched
   *
   * @param {Number} userId - user id
   * @param {Number} tvshowId - tvshow id
   * @param {Number[]} episodesId - all episodes' id's from a season
   * @returns  {Boolean} - season was set as watched
   */
  async setSeasonWatched(userId, tvshowId, episodesId) {
    const queryData = _.map(episodesId, episodeId => ({
      user_id: userId,
      tvshow_id: tvshowId,
      ep_id: episodeId,
    }));
    try {
      const seasonWatched = await knex('usereps').insert(queryData);
      if (seasonWatched.rowCount === queryData.length) {
        return true;
      }
      return false;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
};

Tvshow.init();

module.exports = Tvshow;
