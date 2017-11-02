import express from 'express';
import pick from 'lodash/pick';
import Calendar from '../models/calendar';
import TvShows from '../controllers/tvshows';

const router = express.Router();

router.get('/', async (req, res) => {
    const userId = req.user;
    const date = new Date();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
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
        });
    } catch (e) {
        console.log(e);
        res.send('error');
    }
});

module.exports = router;
