import express from 'express';
import _ from 'lodash';
import knex from '../db/connection';
import CONSTANTS from '../utils/constants';

const router = express.Router();

router.get('/', (req, res) => res.render('index'));

// This should be in its own route + controller (+ model)
// Im not doing that now because this is supposed to be temporary
router.post('/bug', async (req, res) => {
  const userId = _.get(req, 'user', null);
  const { description } = req.body;
  const sanitize = new RegExp(/^[\w\-\s.,;:]+$/);
  if (!description || !sanitize.test(description)) {
    return res.status(400).json({
      error: CONSTANTS.ERROR.BUG.DESCRIPTION,
    });
  }
  try {
    await knex('bugs').insert({
      user_id: userId,
      description,
    });
    return res.sendStatus(200);
  } catch (e) {
    return res.status(500).json({ error: CONSTANTS.ERROR.SERVER });
  }
});

module.exports = router;
