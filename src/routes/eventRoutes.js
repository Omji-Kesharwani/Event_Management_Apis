const express = require('express');
const router = express.Router();

const { createEvent, getEvent, registerUser, cancelRegistration, listUpcomingEvents, getStats } = require('../controllers/eventController');

router.post('/', createEvent);
router.get('/:id', getEvent);
router.post('/:id/register', registerUser);
router.post('/:id/cancel', cancelRegistration);
router.get('/upcoming/list', listUpcomingEvents);
router.get('/:id/stats', getStats);

module.exports = router;