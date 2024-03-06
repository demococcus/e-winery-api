const mongoose = require('mongoose')
const validator = require('validator')


const grapeSchema = new mongoose.Schema({

  company: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Companie'
  },

  parcel: {
    type: String,
    required: true,
    minlength: 3,        
    trim: true,
  },

  variety: {
    type: String,
    required: true,
    minlength: 3,        
    trim: true,
  },


  area: {
    type: Number,
    required: true, 
    validate(value) {
      if (value < 0) {
        throw new Error('Area must be a positive number')
      }
    }       
    },

  archived: {
    type: Boolean,
    required: false,  
    default: false      
  },

     
})

// Grape - Event
grapeSchema.virtual('events', {
    ref: 'Event',
    localField: '_id',
    foreignField: 'wine'
})

// Gives more control over what is sent back in the response
grapeSchema.methods.toJSON = function () {
    const grape = this
    const grapeObject = grape.toObject()

    grapeObject.archived = grapeObject.archived || false

    return grapeObject

}


const Grape = mongoose.model('Grape', grapeSchema)

module.exports = Grape