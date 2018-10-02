import _ from 'lodash';
import escape from 'validator/lib/escape';
import Bug from '../models/bug';
import { ERROR } from '../utils/constants';

export default async function submitBug(req, res) {
  const userId = Number.parseInt(req.user, 10);
  const { description } = _.get(req, 'body');
  const sanitizedDescription = escape(description);
  if (!_.isString(sanitizedDescription) || _.isEmpty(sanitizedDescription)) {
    return res.status(400).json({
      error: ERROR.BUG.DESCRIPTION,
    });
  }
  try {
    const bug = new Bug(sanitizedDescription, userId);
    await bug.save();
    return res.sendStatus(200);
  } catch (e) {
    return res.status(500).json({ error: ERROR.SERVER });
  }
}
