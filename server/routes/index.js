import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', {
    title: 'Tv-shows Manager',
  });
});

module.exports = router;
