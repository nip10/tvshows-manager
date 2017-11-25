import express from 'express';
import pick from 'lodash/pick';
import moment from 'moment';
import Calendar from '../models/calendar';
import TvShows from '../controllers/tvshows';

import { isLoggedInWithRedirect } from '../auth/utils';

const router = express.Router();

router.get('/', isLoggedInWithRedirect, async (req, res) => {
    const userId = req.user;
    const date = new Date();
    const month = parseInt(date.getMonth() + 1, 10);
    const year = parseInt(date.getFullYear(), 10);
    const cal = new Calendar(month, year);
    cal.buildCalendar();
    const startInterval = cal.calendarData[0].day;
    const endInterval = cal.calendarData[cal.calendarData.length - 1].day;
    try {
        const episodes = await TvShows.getEpisodesFromUser(userId, startInterval, endInterval);
        if (episodes) {
            cal.addEpisodesToCalendar(episodes);
        }
        res.render('calendar', {
            title: 'Tv-shows Manager',
            calendar: pick(cal, ['daysFromPreviousMonth', 'daysFromNextMonth', 'calendarData']),
            monthNavigation: {
                previousYear: (month === 1) ? year - 1 : year,
                nextYear: (month === 12) ? year + 1 : year,
                previousMonth: (month === 1) ? 12 : month - 1,
                nextMonth: (month === 12) ? 1 : month + 1,
                month: moment.months(month - 1),
                year,
            },
        });
    } catch (e) {
        console.log(e);
    }
});

router.get('/:year/:month', isLoggedInWithRedirect, async (req, res) => {
    const userId = req.user;
    const month = parseInt(req.params.month, 10);
    const year = parseInt(req.params.year, 10);
    const cal = new Calendar(month, year);
    cal.buildCalendar();
    const startInterval = cal.calendarData[0].day;
    const endInterval = cal.calendarData[cal.calendarData.length - 1].day;
    try {
        const episodes = await TvShows.getEpisodesFromUser(userId, startInterval, endInterval);
        if (episodes) {
            cal.addEpisodesToCalendar(episodes);
        }
        res.render('calendar', {
            title: 'Tv-shows Manager',
            calendar: pick(cal, ['daysFromPreviousMonth', 'daysFromNextMonth', 'calendarData']),
            monthNavigation: {
                previousYear: (month === 1) ? year - 1 : year,
                nextYear: (month === 12) ? year + 1 : year,
                previousMonth: (month === 1) ? 12 : month - 1,
                nextMonth: (month === 12) ? 1 : month + 1,
                month: moment.months(month - 1),
                year,
            },
        });
    } catch (e) {
        console.log(e);
    }
});

module.exports = router;
