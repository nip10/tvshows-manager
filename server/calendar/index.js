class Calendar {
  constructor(month, year) {
    this.monthList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    this.month = month;
    this.monthText = this.monthList[month - 1];
    this.year = year;
    this.daysInMonth = [31, this.evaluateLeapYear(), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    this.firstDayOfMonth = new Date(this.year, this.month - 1, 1).getDay();
    this.calendarData = [];
  }
  buildCalendar() {
    // 1. check if we need to add days from the previous month
    if (this.firstDayOfMonth !== 1) {
      const previousMonth = this.month - 1;
      for (let i = this.firstDayOfMonth - 1; i !== 0; i -= 1) {
        this.calendarData.push(`${this.daysInMonth[previousMonth] - i + 1} ${this.monthList[previousMonth - 1]}`);
      }
    }
    console.log('############ 1 ############');
    console.log(this.calendarData);
    // 2. add current month days
    for (let i = 1; i <= this.daysInMonth[this.month - 1]; i += 1) {
      let addZero;
      if (i < 10) addZero = `0${i}`;
      this.calendarData.push(`${addZero || i} ${this.monthText}`);
      addZero = null;
    }
    console.log('############ 2 ############');
    console.log(this.calendarData);
    // 3. check if the calendar is complete. if not, add next month days
    const daysRemaining = 35 - this.calendarData.length;
    if (daysRemaining !== 0) {
      for (let i = 0; i < daysRemaining; i += 1) {
        console.log('i ', i);
        this.calendarData.push(`0${i + 1} ${this.monthList[this.month]}`);
      }
    }
    console.log('############ 3 ############');
    console.log(this.calendarData);
  }
  evaluateLeapYear() {
    if ((this.year % 4 === 0 && this.year % 100 !== 0) || this.year % 400 === 0) return 29;
    return 28;
  }
}

// const cal = new Calendar(8, 2017);
// console.log('############ 0 ############');
// console.log(cal);
// cal.buildCalendar();
// console.log(cal.calendarData);

module.exports = Calendar;
