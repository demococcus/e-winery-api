const mongoose = require('mongoose')
const validator = require('validator')

const grapeSubTaskTypes = ["vinification"]

// schema for an event that represents an operation on a wine
const schema = new mongoose.Schema({

  type: {
    type: String,
    required: true,
    validate(value) {
      if (!grapeSubTaskTypes.includes(value)) {
        throw new Error('Invalid type.')
      }
    },
  },

  // the parent wine task
  wineTask: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'wineTask'
  }, 

  seqNumber: {
    type: Number,
    required: true
  },

  date: {
    type: Date,
    required: true
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },

  userName: {
    type: String,
    required: true
  },

  company: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Companie'
  },

  grape: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: 'Grape'
  },

  grapeParcel: {
    type: String,
    required: false
  },

  grapeVariety: {
    type: String,
    required: false
  }, 
 

  refWine: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Wine'
  },

  refWineLot: {
    type: String,
    required: true
  },

  refWineVintage: {
    type: Number,
    required: false
  }, 

  refVessel: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Vessel'
  },

  refVesselLabel: {
    type: String,
    required: true
  },  
   
  quantity: {
    type: Number,
    required: true
  },
  
   
})


const GrapeSubTask = mongoose.model('GrapeSubTask', schema)

module.exports = GrapeSubTask, grapeSubTaskTypes