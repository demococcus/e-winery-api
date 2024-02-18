const mongoose = require('mongoose')
const validator = require('validator')

const additiveSchema = new mongoose.Schema({

  company: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Companie'
  },

  label: {
    type: String,
    required: true,
    trim: true,    
    validate: {
      validator: function(value) {
        return value.length >= 3;
      },
      message: 'Label must have a length greater than 3.'
  }
  },

  quantity: {
    type: Number,
    required: false,
    default: 0,
    validate: {
      validator: function(value) {
        return value >= 0;
      },
      message: 'Quantity must be a positive number.'
    }
  },

  unit: {
    type: String,
    required: true,
    validate: {
      validator: function(value) {
        return ["u-kg", "u-g", "u-mg", "u-ppm", "u-l", "u-ml", "u-gal", "u-lb", "u-oz"].includes(value);
      },
      message: 'Invalid unit.'
    }
  },

})


const Additive = mongoose.model('Additive', additiveSchema)

module.exports = Additive