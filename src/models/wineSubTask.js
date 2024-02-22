const mongoose = require('mongoose')
const validator = require('validator')

const wineSubTaskTypes = ["transfer-out", "split-to", "additive"]

// schema for an event that represents an operation on a wine
const schema = new mongoose.Schema({

  type: {
    type: String,
    required: true,
    validate(value) {
      if (!wineSubTaskTypes.includes(value)) {
        throw new Error('Invalid type.')
      }
    },
  },

  // the parent task
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

  wine: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: 'Wine'
  },

  wineLot: {
    type: String,
    required: false
  },

  wineVintage: {
    type: Number,
    required: false
  }, 

  vessel: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: 'Vessel'
  },

  vesselLabel: {
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
   
  additive: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: 'Additive'
  },

  additiveLabel: {
    type: String,
    required: false
  }, 

  additiveUnit: {
    type: String,
    required: false
  }, 

  quantityBefore: {
    type: Number,
    required: false
  },

  quantity: {
    type: Number,
    required: true
  },
  
   
})


const WineSubTask = mongoose.model('WineSubTask', schema)

module.exports = WineSubTask, wineSubTaskTypes