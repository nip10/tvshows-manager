export default class Calendar {
    /**
     * Creates an instance of Calendar.
     * @param {string} month Month MM
     * @param {string} year Year YYYY
     */
    constructor(month, year) {
        this.monthList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        this.month = month;
        this.monthText = this.monthList[month - 1];
        this.year = year;
        this.daysInMonth = [31, this.evaluateLeapYear(), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        this.daysFromPreviousMonth = new Date(this.year, this.month - 1, 0).getDay();
        this.daysFromNextMonth = 7 - new Date(this.year, this.month, 0).getDay();
        this.calendarData = [];
    }
    /**
     * Builds a custom calendar
     * This calendar doesn't represent the "usual" monthly calendar.
     * Instead, it always returns 42 days, where most of the days are from the month used to construct the calendar.
     * The remaining days are to fill the gap between the first day of the calendar (1st Monday) and the specified
     * month; and the gap between the last day of the specified month and the last day of the calendar (Last Sunday)
     * Note that one or both of these gaps may not exist (eg: month starts on a Monday and ends on a Sunday)
     * @memberof Calendar
     */
    buildCalendar() {
        // 1. check if we need to add days from the previous month
        // firstDayOfMonth returns a number representing the weekday of the 1st day of the month.
        // weekdays start on Sunday (= 0)
        const firstDayOfMonth = new Date(this.year, this.month - 1, 1).getDay();
        if (firstDayOfMonth !== 1) {
            const previousMonth = this.month - 1;
            // daysFromPreviousMonth returns a number representing the weekday of the last day of the previous month.
            // weekdays start on Sunday (= 0)
            const daysFromPreviousMonth = new Date(this.year, this.month - 1, 0).getDay();
            for (let i = daysFromPreviousMonth; i !== 0; i -= 1) {
                this.calendarData.push(`${(this.daysInMonth[previousMonth - 1] - i) + 1} ${this.monthList[previousMonth - 1]}`);
            }
        }
        // 2. add current month days
        for (let i = 1; i <= this.daysInMonth[this.month - 1]; i += 1) {
            // add padding zeros to integers < 10 (eg: 9 -> 09)
            let addZero;
            if (i < 10) addZero = `0${i}`;
            this.calendarData.push(`${addZero || i} ${this.monthText}`);
            addZero = null;
        }
        // 3. check if the calendar is complete.
        // 3.1 check if the last day of the current month is a Sunday (which means calendar is complete)
        const lastDayOfMonth = new Date(this.year, this.month, 0).getDay();
        if (lastDayOfMonth !== 0) {
            // last day of the current month is NOT a Sunday.
            // add days from the next month
            for (let i = 0; i < this.daysFromNextMonth; i += 1) {
                this.calendarData.push(`0${i + 1} ${this.monthList[this.month]}`);
            }
        }
    }
    evaluateLeapYear() {
        if ((this.year % 4 === 0 && this.year % 100 !== 0) || this.year % 400 === 0) return 29;
        return 28;
    }
}
