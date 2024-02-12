const mongoose = require('mongoose')
mongoose.set('strictQuery', false);

// read the database password
const mongoDbUrl = process.env.DBPWD || require('../../secrets').mongoDbUrl


// connect to the database
mongoose.connect(mongoDbUrl)

