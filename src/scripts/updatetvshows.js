/* eslint-disable no-await-in-loop */

import rp from 'request-promise';
import moment from 'moment';
import _ from 'lodash';
import knex from '../db/connection';
import { API } from '../utils/constants';

let apiToken;

function getTvshowIdsFromDb() {
  return knex.select('thetvdb', 'updatedAt').from('tvshows');
}

async function getLastUpdateFromApi(tvshowId) {
  const options = {
    uri: API.THETVDB.INFO_SIMPLE({ tvshowId }),
    method: 'HEAD',
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
    json: true,
  };
  try {
    const res = await rp(options);
    return res['last-modified'] || null;
    // last-modified timestamp format: Tue, 06 Feb 2018 14:32:56 GMT
  } catch (e) {
    console.error(e);
    return null;
  }
}

/**
 * Get episodes from the api.
 * This endpoint is paginated, so this function call itself when
 * there are multiple pages available.
 *
 * @param {Number} apiToken TheTVDb apiToken
 * @param {Number} [page=1] Page to fetch (defaults to 1)
 * @param {{}[]} [episodes=[]] Array of episodes (default to empty array)
 * @returns {{}[]} Array of episodes
 */
async function getEpisodes(tvshowId, page = 1, episodes = []) {
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
      id: episode.id,
      tvshow_id: tvshowId,
      season: episode.airedSeason,
      epnum: episode.airedEpisodeNumber,
      title: episode.episodeName || null,
      overview: episode.overview || null,
      airdate: episode.firstAired || null,
    }));
    Array.prototype.push.apply(episodes, filteredEpisodes);
    if (res.links.next) return getEpisodes(apiToken, res.links.next, episodes);
    return episodes;
  } catch (e) {
    console.log(e);
    return null;
  }
}

async function getTvshowInfo(tvshowId) {
  const requestOptions = {
    method: 'GET',
    uri: API.THETVDB.INFO_SIMPLE({ tvshowId }),
    headers: {
      'Accept-Language': 'en',
      Authorization: `Bearer ${apiToken}`,
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
      updatedAt: knex.fn.now(),
    };
  } catch (e) {
    console.log(e);
    return null;
  }
}

async function updateTvshow(tvshowId) {
  // 1. tvshow info
  try {
    // 1.1 Fetch tvshow info
    const tvshowInfo = await getTvshowInfo(tvshowId);
    if (!tvshowInfo) throw new Error(`Error fetching tvshow info for tvshow id: ${tvshowId}`);
    // 1.2 Insert tvshow info in the database
    await knex('tvshows')
      .update(tvshowInfo)
      .where('thetvdb', tvshowId);
  } catch (e) {
    console.log(`Error updating tvshow info in the db (tvshow id: ${tvshowId})`);
    console.log(e);
  }
  // 2. Episodes info
  try {
    // 2.1 Fetch all episodes
    const requestEpisodes = await getEpisodes(tvshowId);
    if (!requestEpisodes) throw new Error(`Error fetching episodes info for tvshow id: ${tvshowId}`);
    // 2.2 Insert episodes in the database
    await knex.transaction(trx => {
      const queries = [];
      requestEpisodes.forEach(episode => {
        const query = knex('episodes')
          .where('tvshow_id', tvshowId)
          .update(episode)
          .transacting(trx); // This makes every update be in the same transaction
        queries.push(query);
      });
      Promise.all(queries) // Once every query is written
        .then(trx.commit) // We try to execute all of them
        .catch(trx.rollback); // And rollback in case any of them goes wrong
    });
    return true;
  } catch (e) {
    console.error(`Error updating episodes info in the db (tvshow id: ${tvshowId})`);
    console.error(e);
    return false;
  }
}

async function init(token) {
  apiToken = token;
  try {
    const tvshowIds = await getTvshowIdsFromDb();
    if (!tvshowIds) throw new Error("Unable to fetch tvshow id's from the database.");
    console.log(`Found ${tvshowIds.length} tvshows in the database.`);
    for (let i = 0; i < tvshowIds.length; i += 1) {
      console.log(`Checking for updates for tvshow id: ${tvshowIds[i].thetvdb}`);
      try {
        const lastUpdate = await getLastUpdateFromApi(tvshowIds[i].thetvdb);
        if (!lastUpdate) throw new Error(`Invalid date received for tvshow id: ${tvshowIds[i].thetvdb}`);
        const lastUpdateFormatted = moment(lastUpdate).toISOString();
        if (moment(lastUpdateFormatted).diff(moment(tvshowIds[i].updatedAt)) > 0) {
          console.log(`Update required for tvshow id: ${tvshowIds[i].thetvdb}`);
          const updatedTvshow = await updateTvshow(tvshowIds[i].thetvdb);
          if (!updatedTvshow) throw new Error(`Unable to update tvshow id: ${tvshowIds[i].thetvdb}`);
          console.log(`Updated tvshow id: ${tvshowIds[i].thetvdb} successfully`);
        }
      } catch (e) {
        console.error(e);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

export default init;
