import express from 'express';
import pick from 'lodash/pick';
import Calendar from '../models/calendar';

const router = express.Router();

router.get('/', (req, res) => {
    const date = new Date();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const cal = new Calendar(month, year);
    cal.buildCalendar();
    res.render('calendar', {
        title: 'Tv-shows Manager',
        calendar: pick(cal, ['daysFromPreviousMonth', 'daysFromNextMonth', 'calendarData']),
    });
});

module.exports = router;
