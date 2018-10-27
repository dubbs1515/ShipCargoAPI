// Setup Routing using Express
const router = module.exports = require('express').Router(); 
router.use('/ships', require('./ships'));
router.use('/cargo', require('./cargo'));