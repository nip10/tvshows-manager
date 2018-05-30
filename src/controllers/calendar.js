import moment from 'moment';
import _ from 'lodash';
import User from '../models/user';
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
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {undefined}
   */
  async getCalendar(req, res) {
    const userId = parseInt(_.get(req, 'user'), 10);
    if (!_.isNumber(userId)) {
      return res.status(500).render('error', {
        error: ERROR.AUTH.INVALID_ID,
      });
    }
    let month = parseInt(_.get(req, 'params.month'), 10);
    let year = parseInt(_.get(req, 'params.year'), 10);
    if (!_.isNumber(month) || !_.isNumber(year)) {
      const date = new Date();
      month = parseInt(date.getMonth() + 1, 10);
      year = parseInt(date.getFullYear(), 10);
    }
    const calendar = new Calendar(month, year);
    calendar.buildCalendar();
    const startInterval = calendar.calendarData[0].day;
    const endInterval = calendar.calendarData[calendar.calendarData.length - 1].day;
    try {
      const episodes = await User.getEpisodes(userId, startInterval, endInterval);
      if (episodes) {
        calendar.addEpisodesToCalendar(episodes);
      }
      return res.render('calendar', {
        calendar: _.pick(calendar, ['daysFromPreviousMonth', 'daysFromNextMonth', 'calendarData']),
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
      console.log(e);
      return res.status(500).render('error', {
        error: ERROR.SERVER,
      });
    }
  },
};

module.exports = calendarController;
