export default class Calendar {
  /**
   * Creates an instance of Calendar.
   * @param {integer} month Month MM
   * @param {integer} year Year YYYY
   */
  constructor(month, year) {
    this.month = month;
    this.year = year;
    this.daysInMonth = [31, this.evaluateLeapYear(), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    this.daysFromPreviousMonth = new Date(this.year, this.month - 1, 0).getDay();
    this.daysFromNextMonth = this.daysFromNextMonth();
    this.calendarData = [];
  }
  /**
   * Builds a calendar starting on Monday and ending on Sunday
   * This means that the number of days is always %% 7
   * Since most months don't start on a Monday nor end on a Sunday,
   * we need to get days from the previous month and/or the next month.
   * @memberof Calendar
   */
  buildCalendar() {
    // 1. check if we need to add days from the previous month
    // firstDayOfMonth returns a number representing the weekday of the 1st day of the month.
    // weekdays start on Sunday (= 0)
    const firstDayOfMonth = new Date(this.year, this.month - 1, 1).getDay();
    if (firstDayOfMonth !== 1) {
      const previousMonth = this.month - 1;
      const previousMonthStr = previousMonth < 10 ? `0${previousMonth}` : previousMonth;
      // daysFromPreviousMonth returns a number representing
      // the weekday of the last day of the previous month.
      // weekdays start on Sunday (= 0)
      const daysFromPreviousMonth = new Date(this.year, previousMonth, 0).getDay();
      for (let i = daysFromPreviousMonth; i !== 0; i -= 1) {
        this.calendarData.push({
          day: `${this.daysInMonth[previousMonth - 1] - i + 1}-${previousMonthStr}-${this.year}`,
          episodes: [],
        });
      }
    }
    // 2. add current month days
    const currentMonthStr = this.month < 10 ? `0${this.month}` : this.month;
    for (let i = 1; i <= this.daysInMonth[this.month - 1]; i += 1) {
      const day = i < 10 ? `0${i}` : i;
      this.calendarData.push({
        day: `${day}-${currentMonthStr}-${this.year}`,
        episodes: [],
      });
    }
    // 3. check if the calendar is complete.
    // 3.1 check if the last day of the current month is a Sunday
    // (which means calendar is complete)
    const lastDayOfMonth = new Date(this.year, this.month, 0).getDay();
    if (lastDayOfMonth !== 0) {
      // last day of the current month is NOT a Sunday.
      // add days from the next month
      const nextMonth = this.month + 1 !== 13 ? this.month + 1 : 1;
      const nextMonthStr = nextMonth < 10 ? `0${nextMonth}` : nextMonth;
      const nextYear = nextMonth === 1 ? this.year + 1 : this.year;
      for (let i = 0; i < this.daysFromNextMonth; i += 1) {
        this.calendarData.push({
          day: `0${i + 1}-${nextMonthStr}-${nextYear}`,
          episodes: [],
        });
      }
    }
  }
  /**
   * Evaluates if the current year is a leap year.
   * This is required to know the number of days of February
   *
   * @returns {28 || 29}
   * @memberof Calendar
   */
  evaluateLeapYear() {
    if ((this.year % 4 === 0 && this.year % 100 !== 0) || this.year % 400 === 0) return 29;
    return 28;
  }
  /**
   * Evaluates the number of days from the next month that
   * we need to push to the calendar
   *
   * @returns {number} - Number of days of the next month
   * @memberof Calendar
   */
  daysFromNextMonth() {
    const lastDayOfPreviousMonth = new Date(this.year, this.month, 0).getDay();
    return 7 - (lastDayOfPreviousMonth !== 0 ? lastDayOfPreviousMonth : 7);
  }
  /**
   * Add user episodes to the calendar
   *
   * @param {{}[]} eps - Array of episode objects
   * @memberof Calendar
   */
  addEpisodesToCalendar(eps) {
    for (let i = 0; i < this.calendarData.length; i += 1) {
      for (let j = 0; j < eps.length; j += 1) {
        if (eps[j].airdate === this.calendarData[i].day) {
          this.calendarData[i].episodes.push({
            id: eps[j].id,
            title: eps[j].title,
            name: eps[j].name,
            season: eps[j].season,
            epnum: eps[j].epnum,
            thetvdb: eps[j].thetvdb,
            watched: eps[j].watched,
          });
        }
      }
    }
  }
}
