import moment from 'moment';
import pick from 'lodash/pick';
import User from '../models/user';
import Calendar from '../models/calendar';

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
    const userId = req.user;
    let month;
    let year;
    if (req.params.month && req.params.year) {
      month = parseInt(req.params.month, 10);
      year = parseInt(req.params.year, 10);
    } else {
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
        calendar: pick(calendar, ['daysFromPreviousMonth', 'daysFromNextMonth', 'calendarData']),
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
      // TODO: render generic server error page
      return res.status(500).json({ error: 'Server error.' });
    }
  },
};

module.exports = calendarController;
