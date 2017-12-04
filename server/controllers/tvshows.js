/* eslint-disable quote-props */
/* eslint-disable func-names */

import path from 'path';
import rp from 'request-promise';
import cp from 'child_process';
import moment from 'moment';
import knex from '../db/connection';

const { THETVDB_API_KEY, NODE_ENV } = process.env;
const THETVDB_API_AUTH_LOGIN = 'https://api.thetvdb.com/login';
const THETVDB_API_SEARCH = 'https://api.thetvdb.com/search/series';
const THETVDB_API_INFO = seriesId => `https://api.thetvdb.com/series/${seriesId}`;
const THETVDB_API_IMAGES = seriesId => `https://api.thetvdb.com/series/${seriesId}/images/query`;
const THETVDB_API_EPISODES_QUERY = seriesId => `https://api.thetvdb.com/series/${seriesId}/episodes/query`;
const THETVDB_API_SEASON = seriesId => `https://api.thetvdb.com/series/${seriesId}/episodes/summary`;

const TvShows = {
    /**
     * Initialize connection to the TheTVDb API and
     * start child process to renew the token
     * every X hours
     */
    init() {
        // get "initial" token from the thetvdb api
        console.log('Requesting token from TheTvDb API');
        return this.getToken()
            .then((newToken) => {
                if (!newToken || newToken.length === 0) {
                    throw new Error('Token received is invalid.');
                }
                this.apiToken = newToken;
                console.log(`Token received: ${this.apiToken}`);
            }).then(() => {
                if (NODE_ENV !== 'development') {
                    // start child process to renew the token when needed
                    this.startChildProcess();
                }
            }).catch(e => console.log(e));
    },
    /**
     * Start child process that renews the TheTVDB api token
     *
     * This child process is nothing more than a cronjob
     * that runs every X hours and sends the token back here
     */
    startChildProcess() {
        // create child process using fork
        const child = cp.fork(path.join(__dirname, '../../scripts/tvdb-api-cron'));

        // listen to messages from the child process
        child.on('message', (msg) => {
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
        }).on('exit', () => {
            console.log('[PARENT] Child process has been terminated.');
        });
    },
    /**
     * Get TheTVDb api token
     *
     * @returns {string} TheTVDb api token
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
                'Authorization': `Bearer ${this.apiToken}`,
            },
            qs: {
                name: tvshowName,
            },
            json: true,
        };
        try {
            const { data } = await rp(requestOptions);
            return data.map(tvshow => ({
                id: tvshow.id,
                seriesName: tvshow.seriesName,
            }));
        } catch (e) {
            console.log(e);
        }
    },
    /**
     * Get information about a tvshow
     *
     * @param {number} tvshowId - tvshow id
     * @returns {{name: string, overview: string, status: string, imdb: string, thetvdb: number, genre: string[], premiered: string, network: string, airdate: string, tvrating: string, images: string[]}} Information about the show
     */
    async getInfo(tvshowId) {
        const requestOptions = {
            method: 'GET',
            uri: THETVDB_API_INFO(tvshowId),
            headers: {
                'Accept-Language': 'en',
                'Authorization': `Bearer ${this.apiToken}`,
            },
            json: true,
        };
        try {
            const { data } = await rp(requestOptions);
            return {
                name: data.seriesName,
                overview: data.overview,
                status: (data.status === 'Continuing') ? 'Running' : data.status,
                imdb: data.imdbId,
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
        }
    },
    /**
     * Get artwork of a tvshow
     *
     * @param {number} tvshowId tvshow id
     * @param {string} imageType artwork type (poster, banner)
     * @returns {string} url for the first artwork of specified type
     */
    async getImage(tvshowId, imageType) {
        const requestOptions = {
            method: 'GET',
            uri: THETVDB_API_IMAGES(tvshowId),
            headers: {
                'Accept-Language': 'en',
                'Authorization': `Bearer ${this.apiToken}`,
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
        }
    },
    /**
     * Get number of seasons of a tvshow
     *
     * The api has an array of "airedSeasons" that contains all the seasons for a tvshow.
     * This array contains a season 0, which is where the special episodes are placed.
     * This is why we need to subtract 1 from the length.
     *
     * @param {number} tvshowId tvshow id
     * @returns {number} number of seasons
     */
    async getNumSeasons(tvshowId) {
        const requestOptions = {
            method: 'GET',
            uri: THETVDB_API_SEASON(tvshowId),
            headers: {
                'Accept-Language': 'en',
                'Authorization': `Bearer ${this.apiToken}`,
            },
            json: true,
        };
        try {
            const { data } = await rp(requestOptions);
            return data.airedSeasons.length - 1;
        } catch (e) {
            console.log(e);
        }
    },
    /**
     * Get all tvshow episodes from a particular season
     *
     * @param {number} tvshowId tvshow id
     * @param {number} season season
     * @returns {{num: number, name: string, airdate: string, overview: string}[]} Tvshow episodes from a particular season
     */
    async getEpisodesFromSeason(tvshowId, season) {
        const requestOptions = {
            method: 'GET',
            uri: THETVDB_API_EPISODES_QUERY(tvshowId),
            headers: {
                'Accept-Language': 'en',
                'Authorization': `Bearer ${this.apiToken}`,
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
        }
    },
    /**
     * Get episodes from all tvshows that a user is following, in a particular date interval
     *
     * @param {number} userId user id
     * @param {date} startInterval
     * @param {date} endInterval
     * @returns {{}[]} Tvshow episodes that a user if following, in the specified date interval
     */
    async getEpisodesFromUser(userId, startInterval, endInterval) {
        const getEpisodes = knex.select('tvshows.name', 'tvshows.thetvdb', 'episodes.title')
            .select(knex.raw('to_char(episodes.season, \'fm00\') as "season"'))
            .select(knex.raw('to_char(episodes.epnum, \'fm00\') as "epnum"'))
            .select(knex.raw('to_char(episodes.airdate, \'DD-MM-YYYY\') as "airdate"'))
            .from('episodes')
            .join('usertv', 'usertv.tvshow_id', 'episodes.tvshow_id')
            .join('tvshows', 'tvshows.thetvdb', 'episodes.tvshow_id')
            .where('usertv.user_id', userId)
            .andWhere(function () {
                this.whereBetween('episodes.airdate', [startInterval, endInterval]);
            });
        try {
            const episodes = await getEpisodes;
            return episodes;
        } catch (e) {
            console.log(e);
        }
    },
    /**
     * Add new tvshow to the database
     *
     * @param {{}} tvshowInfo Tvshow information
     * @returns {Promise}
     */
    async addShowToDb(tvshowInfo) {
        // 1. TvShow information
        try {
            // 1.2 Insert show information in the database
            await knex('tvshows').insert(tvshowInfo);
            console.log(`Successfully added tvshow id ${tvshowInfo.thetvdb} to the db.`);
        } catch (e) {
            console.log(`Error inserting tvshow id ${tvshowInfo.thetvdb} to the db. Error details: ${e}`);
            return;
        }
        // 2. Episodes information
        // 2.1 Fetch all episodes
        const tvshowId = tvshowInfo.thetvdb;
        const episodes = [];
        /**
         * Make requests to paginated api endpoints.
         *
         * @param {string} apiToken TheTVDb apiToken
         * @param {number} [page=1] Page to fetch (defaults to 1)
         * @returns {boolean} Request status (true if successful)
         */
        async function requestPaginated(apiToken, page = 1) {
            console.log(`Fetching episodes from tvshow id ${tvshowId}`);
            console.log(`Page ${page}`);
            const requestOptions = {
                method: 'GET',
                uri: THETVDB_API_EPISODES_QUERY(tvshowId),
                headers: {
                    'Accept-Language': 'en',
                    'Authorization': `Bearer ${apiToken}`,
                },
                qs: {
                    page,
                },
                json: true,
            };
            try {
                const res = await rp(requestOptions);
                const filteredEpisodes = res.data.map(episode => ({
                    tvshow_id: tvshowId,
                    season: episode.airedSeason,
                    epnum: episode.airedEpisodeNumber,
                    title: episode.episodeName,
                    overview: episode.overview,
                    airdate: episode.firstAired || null,
                }));
                console.log(`Page ${page} received.`);
                Array.prototype.push.apply(episodes, filteredEpisodes);
                console.log('Checking if there are more pages.');
                if (res.links.next) {
                    console.log('Next page available.');
                    return requestPaginated(apiToken, res.links.next);
                }
                console.log('Finished.');
                return true;
            } catch (e) {
                return false;
            }
        }
        try {
            const requestEpisodes = await requestPaginated(this.apiToken);
            if (requestEpisodes) {
                // 2.2 Insert episodes in the database
                await knex('episodes').insert(episodes);
            } else {
                throw Error('Error fetching episodes.');
            }
        } catch (e) {
            console.log(`Error fetching episodes. Error details: ${e}`);
        }
    },
    /**
     * Check if a tvshow is on the database
     *
     * @param {number} tvshowId tvshow id
     * @returns {boolean} tvshow is on the database
     */
    async isShowOnDb(tvshowId) {
        const inner = knex.select(1).from('tvshows').where('thetvdb', tvshowId).limit(1);
        try {
            const isShowOnDb = await knex.raw(inner).wrap('select exists (', ')');
            return isShowOnDb.rows[0].exists;
        } catch (e) {
            console.log(e);
        }
    },
    /**
     * Add tvshow to user
     *
     * @param {number} userId user id
     * @param {number} tvshowId tvshow id
     * @returns {{tvshowid: number}} tvshow id if successful
     */
    async addShowToUser(userId, tvshowId) {
        try {
            const addShowToUser = await knex('usertv').insert({ user_id: userId, tvshow_id: tvshowId });
            if (addShowToUser.rowCount === 1) {
                return { tvshowId };
            }
            throw new Error('Unable to add tvshow');
        } catch (e) {
            console.log(e);
            return { error: e };
        }
    },
    /**
     * Remove tvshow from user
     *
     * @param {number} userId user id
     * @param {number} tvshowId tvshow id
     * @returns {{tvshowid: number}} tvshow id if successful
     */
    async removeShowFromUser(userId, tvshowId) {
        try {
            const removeShowFromUser = await knex('usertv').where({ user_id: userId, tvshow_id: tvshowId }).del();
            if (removeShowFromUser.rowCount === 1) {
                return { tvshowId };
            }
            throw new Error('Unable to remove tvshow');
        } catch (e) {
            console.log(e);
            return { error: e };
        }
    },
    /**
     * Get tvshow episodes from a particular season
     *
     * @param {number} tvshowId tvshow id
     * @param {number} season season
     * @returns {{}[]} Tvshow episodes from the specified season
     */
    async getEpisodesFromDb(tvshowId, season) {
        try {
            const getEpisodesFromDb = await knex('episodes')
                .select('epnum', 'title')
                .select(knex.raw('to_char(airdate, \'DD-MM-YYYY\') as "airdate"'))
                .where({ tvshow_id: tvshowId, season })
                .orderBy('epnum', 'asc');
            return getEpisodesFromDb.map(episode => ({
                num: episode.epnum,
                name: episode.title,
                airdate: episode.airdate,
            }));
        } catch (e) {
            console.log(e);
        }
    },
    /**
     * Get tvshow information from the database
     *
     * @param {number} tvshowId tvshow id
     * @returns {{thetvdb: number, name: string, overview: string, premiered: string, network: string, status: string, airdate: string, images: string[], imdb: string, genre: string[], tvrating: string}} Tvshow information
     */
    async getTvshowInfoFromDb(tvshowId) {
        try {
            const getTvshowInfoFromDb = await knex('tvshows').select().where('thetvdb', tvshowId);
            return {
                thetvdb: Number.parseInt(tvshowId, 10),
                name: getTvshowInfoFromDb[0].name,
                overview: getTvshowInfoFromDb[0].overview,
                premiered: getTvshowInfoFromDb[0].premiered,
                network: getTvshowInfoFromDb[0].network,
                status: getTvshowInfoFromDb[0].status,
                airdate: getTvshowInfoFromDb[0].airdate,
                images: [...getTvshowInfoFromDb[0].images],
                imdb: getTvshowInfoFromDb[0].imdb,
                genre: [...getTvshowInfoFromDb[0].genre],
                tvrating: getTvshowInfoFromDb[0].tvrating,
            };
        } catch (e) {
            console.log(e);
        }
    },
    /**
     * Check if a user is following a particular tvshow
     *
     * @param {number} userId user id
     * @param {number} tvshowId tvshow id
     * @returns {boolean} true if the user is following the specified tvshow
     */
    async isUserFollowingTvshow(userId, tvshowId) {
        const inner = knex.select(1).from('usertv').where({ user_id: userId, tvshow_id: tvshowId }).limit(1);
        try {
            const isUserFollowingTvshow = await knex.raw(inner).wrap('select exists (', ')');
            return isUserFollowingTvshow.rows[0].exists;
        } catch (e) {
            console.log(e);
        }
    },
};

TvShows.init();

module.exports = TvShows;

