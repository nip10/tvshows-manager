/* eslint-disable quote-props */

import path from 'path';
import rp from 'request-promise';
import cp from 'child_process';

const { THETVDB_API_KEY } = process.env;
const THETVDB_API_AUTH_LOGIN = 'https://api.thetvdb.com/login';
const THETVDB_API_SEARCH = 'https://api.thetvdb.com/search/series';

const TvShows = {
    apiToken: null,
    init() {
        // get "initial" token from the thetvdb api
        console.log('Requesting token from TheTvDb API');
        return this.getToken().then((newToken) => {
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
    getToken() {
        const requestOptions = {
            method: 'POST',
            uri: THETVDB_API_AUTH_LOGIN,
            body: {
                apikey: THETVDB_API_KEY,
            },
            json: true,
        };
        return rp(requestOptions).then(data => data.token).catch(e => console.log(e));
    },
    search(tvshow) {
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
        return rp(requestOptions).then(res => res.data.map(tvshows => ({ id: tvshows.id, seriesName: tvshows.seriesName }))).catch(e => console.log(e));
    },
};

TvShows.init();

module.exports = TvShows;
