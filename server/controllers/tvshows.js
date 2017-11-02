/* eslint-disable quote-props */

import path from 'path';
import rp from 'request-promise';
import cp from 'child_process';
import knex from '../db/connection';

const { THETVDB_API_KEY } = process.env;
const THETVDB_API_AUTH_LOGIN = 'https://api.thetvdb.com/login';
const THETVDB_API_SEARCH = 'https://api.thetvdb.com/search/series';
const THETVDB_API_INFO = seriesId => `https://api.thetvdb.com/series/${seriesId}`;
const THETVDB_API_IMAGES = seriesId => `https://api.thetvdb.com/series/${seriesId}/images/query`;
const THETVDB_API_EPISODES_QUERY = seriesId => `https://api.thetvdb.com/series/${seriesId}/episodes/query`;
const THETVDB_API_SEASON = seriesId => `https://api.thetvdb.com/series/${seriesId}/episodes/summary`;

const TvShows = {
    apiToken: null,
    init() {
        // get "initial" token from the thetvdb api
        console.log('Requesting token from TheTvDb API');
        return this.getToken().then((newToken) => {
            // if (!newToken || newToken.length === 0) {
            //     throw Error('Token received is invalid.');
            // }
            this.apiToken = newToken;
            console.log(`Token received: ${this.apiToken}`);
        }).then(() => {
            // start child process to renew the token when needed
            this.startChildProcess();
        }).catch(e => console.log(e));
    },
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
    async search(tvshow) {
        const requestOptions = {
            method: 'GET',
            uri: THETVDB_API_SEARCH,
            headers: {
                'Accept-Language': 'en',
                'Authorization': `Bearer ${this.apiToken}`,
            },
            qs: {
                name: tvshow,
            },
            json: true,
        };
        try {
            const { data } = await rp(requestOptions);
            return data.map(tvshows => ({
                id: tvshows.id,
                seriesName: tvshows.seriesName,
            }));
        } catch (e) {
            console.log(e);
        }
    },
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
                description: data.overview,
                status: (data.status === 'Continuing') ? 'Running' : data.status,
                imdb: data.imdbId,
                thetvdb: data.id,
                genre: data.genre,
                premiered: data.firstAired,
                network: data.network,
                airdate: `${data.airsDayOfWeek} at ${data.airsTime}`,
                tvrating: data.rating,
                images: [data.banner],
            };
        } catch (e) {
            console.log(e);
        }
    },
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
                summary: episode.overview,
            }));
        } catch (e) {
            console.log(e);
        }
    },
    async getEpisodesFromUser(userId, startInterval, endInterval) {
        const getEpisodes = knex.select('tvshows.name', 'tvshows.thetvdb', 'episodes.title')
            .select(knex.raw('to_char(episodes.season, \'fm00\') as "season"'))
            .select(knex.raw('to_char(episodes.epnum, \'fm00\') as "epnum"'))
            .select(knex.raw('to_char(episodes.airdate, \'YYYY-MM-DD\') as "airdate"'))
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
    async addShowToDb(tvshowInfo) {
        // 1. TvShow information
        try {
            // 1.2 Insert show information in the database
            const insertShow = await knex('tvshows').insert(tvshowInfo);
            if (insertShow.rowCount === 1) {
                console.log(`Successfully added tvshow id ${tvshowInfo.thetvdb} to the db.`);
            } else {
                throw new Error(`Error inserting tvshow id ${tvshowInfo.thetvdb} to the db.`);
            }
        } catch (e) {
            console.log(`Error inserting tvshow id ${tvshowInfo.thetvdb} to the db. Error details: ${e}`);
            return;
            // TODO: Check if this stops the function from running
            // Force adding a show that already exists in the database
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
         * @returns {}
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
                    description: episode.overview,
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
                console.log(e);
                return false;
            }
        }
        try {
            const requestEpisodes = await requestPaginated(this.apiToken);
            // console.log(`Requested Episodes: ${requestEpisodes}`);
            if (requestEpisodes) {
                // 2.2 Insert episodes in the database
                const insertEpisodes = await knex('episodes').insert(episodes);
            } else {
                throw Error('Error fetching episodes.');
            }
        } catch (e) {
            console.log(`Error fetching episodes. Error details: ${e}`);
        }
    },
    async isShowOnDb(tvshowId) {
        const inner = knex.select(1).from('tvshows').where('thetvdb', tvshowId).limit(1);
        try {
            const isShowOnDb = await knex.raw(inner).wrap('select exists (', ')');
            return isShowOnDb.rows[0].exists;
        } catch (e) {
            console.log(e);
        }
    },
    async addShowToUser(userId, tvshowId) {
        try {
            const addShowToUser = await knex('usertv').insert({ user_id: userId, tvshow_id: tvshowId });
            return { tvshowId };
        } catch (e) {
            console.log(e);
            return { error: e };
        }
    },
    async getEpisodesFromDb(tvshowId, season) {
        // this handles fetching the episodes when rendering tvshow/id and the select menu
        try {
            const getEpisodesFromDb = await knex('episodes').select().where('tvshow_id', tvshowId).andWhere('season', season);
            return getEpisodesFromDb;
        } catch (e) {
            console.log(e);
        }
    },
    async getTvshowInfoFromDb(tvshowId) {
        try {
            const getTvshowInfoFromDb = await knex('tvshows').select().where('thetvdb', tvshowId);
            return {
                thetvdb: Number.parseInt(tvshowId, 10),
                name: getTvshowInfoFromDb[0].name,
                description: getTvshowInfoFromDb[0].description,
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
};

TvShows.init();

module.exports = TvShows;

