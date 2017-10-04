class Calendar {
    /**
     * Creates an instance of Calendar.
     * @param {string} month Month MM
     * @param {string} year Year YYYY
     * @memberof Calendar
     */
    constructor(month, year) {
        this.monthList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        this.month = month;
        this.monthText = this.monthList[month - 1];
        this.year = year;
        this.daysInMonth = [31, this.evaluateLeapYear(), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        // firstDayOfMonth returns a number representing the weekday of the 1st day of the month.
        // weekdays start on Sunday (= 0)
        this.firstDayOfMonth = new Date(this.year, this.month - 1, 1).getDay();
        this.calendarData = [];
    }
    /**
     * Builds a custom calendar
     * This calendar doesn't represent a usual monthly calendar.
     * Instead it always returns 35 days, where most of the days are from the month used to construct the calendar.
     * The remaining days are to fill the gap between Monday - 1st day of the month (if exists)
     * and the gap between Last day of the month - Last Sunday (if exists)
     * @memberof Calendar
     */
    buildCalendar() {
        // 1. check if we need to add days from the previous month
        if (this.firstDayOfMonth !== 1) {
            const previousMonth = this.month - 1;
            for (let i = this.firstDayOfMonth - 1; i !== 0; i -= 1) {
                this.calendarData.push(`${(this.daysInMonth[previousMonth] - i) + 1} ${this.monthList[previousMonth - 1]}`);
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
        // 3. check if the calendar is complete. if not, add next month days
        const daysRemaining = 35 - this.calendarData.length;
        if (daysRemaining !== 0) {
            for (let i = 0; i < daysRemaining; i += 1) {
                this.calendarData.push(`0${i + 1} ${this.monthList[this.month]}`);
            }
        }
    }
    evaluateLeapYear() {
        if ((this.year % 4 === 0 && this.year % 100 !== 0) || this.year % 400 === 0) return 29;
        return 28;
    }
}

const cal = new Calendar(8, 2017);
cal.buildCalendar();
console.log(cal.calendarData);

module.exports = Calendar;
