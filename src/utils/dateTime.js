const moment = require('moment-timezone');

// Set default timezone
moment.tz.setDefault('UTC');

/**
 * Format a date to a human-readable string
 * @param {Date} date - The date to format
 * @param {string} format - The format string (default: 'YYYY-MM-DD HH:mm:ss')
 * @param {string} timezone - The timezone to use (default: 'UTC')
 * @returns {string} Formatted date string
 */
const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss', timezone = 'UTC') => {
  return moment(date).tz(timezone).format(format);
};

/**
 * Get the difference between two dates in the specified unit
 * @param {Date} date1 - The first date
 * @param {Date} date2 - The second date
 * @param {string} unit - The unit of time (years, months, days, hours, minutes, seconds)
 * @returns {number} The difference between the two dates in the specified unit
 */
const getDateDiff = (date1, date2, unit = 'days') => {
  const moment1 = moment(date1);
  const moment2 = moment(date2);
  return moment2.diff(moment1, unit);
};

/**
 * Add time to a date
 * @param {Date} date - The base date
 * @param {number} amount - The amount to add
 * @param {string} unit - The unit of time (years, months, days, hours, minutes, seconds)
 * @returns {Date} The new date
 */
const addTime = (date, amount, unit) => {
  return moment(date).add(amount, unit).toDate();
};

/**
 * Check if a date is in the past
 * @param {Date} date - The date to check
 * @returns {boolean} True if the date is in the past
 */
const isPast = (date) => {
  return moment().isAfter(date);
};

/**
 * Check if a date is in the future
 * @param {Date} date - The date to check
 * @returns {boolean} True if the date is in the future
 */
const isFuture = (date) => {
  return moment().isBefore(date);
};

/**
 * Get the start of a time period
 * @param {string} unit - The unit of time (year, month, week, day, hour, minute, second)
 * @param {string} timezone - The timezone to use (default: 'UTC')
 * @returns {Date} The start of the time period
 */
const startOf = (unit, timezone = 'UTC') => {
  return moment().tz(timezone).startOf(unit).toDate();
};

/**
 * Get the end of a time period
 * @param {string} unit - The unit of time (year, month, week, day, hour, minute, second)
 * @param {string} timezone - The timezone to use (default: 'UTC')
 * @returns {Date} The end of the time period
 */
const endOf = (unit, timezone = 'UTC') => {
  return moment().tz(timezone).endOf(unit).toDate();
};

module.exports = {
  formatDate,
  getDateDiff,
  addTime,
  isPast,
  isFuture,
  startOf,
  endOf,
  moment,
};
