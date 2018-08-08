import moment from 'moment';
import _ from 'lodash';
import User from '../models/user';
import Tvshow from '../models/tvshow';
import Calendar from '../models/calendar';
import { ERROR } from '../utils/constants';

/**
 * Calendar controller - All functions related to the calendar feature
 * @module controllers/calendar
 */

const calendarController = {
  /**
   * Render calendar
   *
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   * @returns {undefined}
   */
  async getCalendar(req, res) {
    const userId = Number.parseInt(req.user, 10);
    let month = Number.parseInt(req.params.month, 10);
    let year = Number.parseInt(req.params.year, 10);
    if (!_.isFinite(month) || !_.isFinite(year)) {
      // If month/year is not defined, default to current month/year
      const date = new Date();
      month = Number.parseInt(date.getMonth() + 1, 10, 10);
      year = Number.parseInt(date.getFullYear(), 10, 10);
    }
    const calendar = new Calendar(month, year);
    calendar.buildCalendar();
    const startInterval = calendar.calendarData[0].day;
    const endInterval = calendar.calendarData[calendar.calendarData.length - 1].day;
    try {
      const episodes = await User.getEpisodes(userId, startInterval, endInterval);
      const episodeIds = _.map(episodes, episode => episode.id);
      const seasonFinaleEpisodes = await Tvshow.getSeasonFinaleEpisodes(episodeIds);
      if (!_.isNil(seasonFinaleEpisodes) && !_.isEmpty(seasonFinaleEpisodes)) {
        for (const ep of seasonFinaleEpisodes) {
          const epIndex = episodes.findIndex(element => element.id === ep.id);
          if (epIndex !== -1) {
            episodes[epIndex].isSeasonFinale = true;
          }
        }
      }
      calendar.addEpisodesToCalendar(episodes);
      return res.render('calendar', {
        calendar: _.pick(calendar, ['day', 'daysFromPreviousMonth', 'daysFromNextMonth', 'calendarData']),
        monthNavigation: {
          previousYear: month === 1 ? year - 1 : year,
          nextYear: month === 12 ? year + 1 : year,
          previousMonth: month === 1 ? 12 : month - 1,
          nextMonth: month === 12 ? 1 : month + 1,
          month: moment.months(month - 1),
          year,
        },
        sidebarIndex: 'calendar',
      });
    } catch (e) {
      return res.status(500).render('error', {
        error: ERROR.SERVER,
      });
    }
  },
};

module.exports = calendarController;
