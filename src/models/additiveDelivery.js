const mongoose = require('mongoose')
const validator = require('validator')

const additiveDeliverySchema = new mongoose.Schema({

  company: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Companie'
  },

  supplier: {
    type: String,
    required: false,
    trim: true,    
    validate: {
      validator: function(value) {
        return value.length >= 3;
      },
      message: 'Supplier must have a length greater than 3.'
    }
  },

  quantity: {
    type: Number,
    required: true,
    default: 0,
    validate: {
      validator: function(value) {
        return value >= 0;
      },
      message: 'Quantity must be a positive number.'
    }
  },


  refAdditive: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Additive'
  },

  date: {type: Date, required: false},

})


const AdditiveDelivery = mongoose.model('AdditiveDelivery', additiveDeliverySchema)

module.exports = AdditiveDelivery