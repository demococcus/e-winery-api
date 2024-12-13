const mongoose = require('mongoose')
const validator = require('validator')
const AdditiveDelivery = require('./additiveDelivery')

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

  accounting: {
    type: String,
    required: true,
    default: '',
    validate: {
      validator: function(value) {
        return value.length >= 3;
      },
      message: 'Accounting must have a length greater than 3.'
    }
  },

  unit: {
    type: String,
    required: true,
    validate: {
      validator: function(value) {
        return ["u-pcs", "u-kg", "u-g", "u-mg", "u-ppm", "u-l", "u-ml", "u-gal", "u-lb", "u-oz"].includes(value);
      },
      message: 'Invalid unit.'
    }
  },

  deliveries: {
    type: [],
    required: false
  }

})


const Additive = mongoose.model('Additive', additiveSchema)

module.exports = Additive