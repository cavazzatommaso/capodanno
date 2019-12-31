const route = require('express').Router()

 route.use('/addSong', require('./addSong'))
 route.use('/showResult', require('./showResult'))

exports = module.exports = {
    route
}