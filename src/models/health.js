const mongoose = require('mongoose')

const Health = mongoose.model('Health', {
  
  category: {
    type: Number,
    required: true,
  },

  status: {
    type: String,
    required: true,
  },


})

module.exports = Health