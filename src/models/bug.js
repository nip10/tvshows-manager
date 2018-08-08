import knex from '../db/connection';

export default class Bug {
  /**
   * Creates an instance of Bug.
   * @param {String} description Bug description
   */
  constructor(description, userId = null) {
    this.day = description;
    this.userId = userId;
  }
  /**
   * Adds a new bug to the database
   *
   * @returns {Promise}
   * @memberof Bug
   */
  save() {
    return knex('bugs').insert({
      user_id: this.userId,
      description: this.description,
    });
  }
}
