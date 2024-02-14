const mongoose = require('mongoose')
const validator = require('validator')

const supportedTypes = ["blend-out"]

// schema for an event that represents an operation on a wine
const schema = new mongoose.Schema({

  type: {
    type: String,
    required: true,
    validate(value) {
      if (!supportedTypes.includes(value)) {
        throw new Error('Invalid type.')
      }
    },
  },
  
  // the parent task
  wineTask: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'wineOp'
  },  
  
  // from the parent task
  number: {
    type: Number,
    required: true
  },

  // from the parent task
  date: {
    type: Date,
    required: true
  },

  wine: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Wine'
  },

  wineTag: {
    type: String,
    required: true
  },

  vesselLabel: {
    type: String,
    required: true
  },

  // from the parent task
  destWine: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Wine'
  },

  // from the parent task
  destWineTag: {
    type: String,
    required: true
  },

  // from the parent task
  destVesselLabel: {
    type: String,
    required: true
  },

  quantity: {
    type: Number,
    required: true
  } 
  
   
})


const WineSubTask = mongoose.model('WineSubTask', schema)

module.exports = WineSubTask