const mongoose = require('mongoose')
const validator = require('validator')

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    trim: true
  },

  credits: {
    type: Number,
    required: true,
    validate: {
      validator: function(value) {
          return value >= 0;
      },
      message: 'Credits must be a positive number.'
  }
  },


})


const Company = mongoose.model('Companie', companySchema)

module.exports = Company