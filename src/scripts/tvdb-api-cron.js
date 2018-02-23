/* eslint-disable no-unused-vars */

import { CronJob } from 'cron';
import rp from 'request-promise';
import updateDbData from './updatetvshows';

console.log('[CHILD] [0] Child process started!');

const job1 = new CronJob(
  // Runs every 12h (12 is the max for cronjob, more than that is not recognized)
  '0 0 */12 * * *', // sec min hour dayofmonth month dayofweek
  () => {
    // Job to run
    console.log('[CHILD] [1] Cronjob triggered. Requesting the oldToken from the parent process.');
    // Send msg to the "parent" process to request the old token
    process.send('oldToken');
    // Set the oldToken received from the "parent" process
    process.once('message', msg => {
      console.log('[CHILD] [3] Received oldToken from the parent process');
      const oldToken = msg;
      // make the request for the new token
      if (oldToken) {
        // request options
        const options = {
          uri: 'https://api.thetvdb.com/refresh_token',
          headers: {
            Authorization: `Bearer ${oldToken}`,
          },
          json: true,
        };
        rp(options)
          .then(res => {
            console.log('[CHILD] [4] New token received');
            // send the new token to the "parent" process
            process.send(res.token);
            // start updating db data (in the background)
            return updateDbData(res.token);
          })
          .then(() => {
            console.log('[CHILD - DB UPDATE] - Finished');
          })
          .catch(err => {
            console.log('[CHILD] [4(E)] Error getting new token.');
            console.log('[CHILD] [4(E)] Error message: ', err.message);
            console.log('[CHILD] [4(E)] Auth header: ', err.options.headers);
          });
      } else {
        console.log(`[CHILD] [4(E2)] Didn't make the request because the oldToken is ${oldToken}`);
      }
    });
  },
  () => {
    // Job stopped
    console.error('Job stopped.');
  },
  true // Start the job right now
);
