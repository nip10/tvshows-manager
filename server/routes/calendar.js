import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.render('calendar', {
    title: 'Tv-shows Manager',
  });
});

module.exports = router;
