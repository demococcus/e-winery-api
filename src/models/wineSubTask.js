const mongoose = require('mongoose')
const validator = require('validator')

const supportedTypes = ["transfer-out"]

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
  
  number: {
    type: Number,
    required: true
  },

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

  destWine: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Wine'
  },

  destWineTag: {
    type: String,
    required: true
  },

  destVesselLabel: {
    type: String,
    required: true
  },

  quantity: {
    type: Number,
    required: true
  },
  
  userName: {
    type: String,
    required: true
  } 
  
   
})


const WineSubTask = mongoose.model('WineSubTask', schema)

module.exports = WineSubTask