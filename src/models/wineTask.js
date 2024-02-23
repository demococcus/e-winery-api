const mongoose = require('mongoose')
const validator = require('validator')

const wineTaskSimpleTypes = ["aerate", "decant", "drain-press", "filter", "freeze",  "remontage",]
const wineTaskComplexTypes = ["transfer", "split-from", "blend", "additive",]
const wineTaskTypes = [...wineTaskSimpleTypes, ...wineTaskComplexTypes]


// schema for an event that represents an operation on a wine
const schema = new mongoose.Schema({

  // type of operation - supplied by the frontend (and validated at creation)
  type: {
    type: String,
    required: true,
    validate(value) {
      if (!wineTaskTypes.includes(value)) {
        throw new Error('Invalid type.')
      }
    },
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
  
  note: {
    type: String,
    required: false
  },

  wine: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Wine'
  },

  wineLot: {
    type: String,
    required: true
  },

  wineVintage: {
    type: Number,
    required: false
  },  

  vessel: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Vessel'
  },

  vesselLabel: {
    type: String,
    required: true
  },  

  quantityBefore: {
    type: Number,
    required: false
  },

  nextVessel: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: 'Vessel'
  },

  nextVesselLabel: {
    type: String,
    required: false
  },

  quantity: {
    type: Number,
    required: false
  },

 
})

// wineTask - wineSubOp
schema.virtual('subTasks', {
  ref: 'WineSubTask',
  localField: '_id',
  foreignField: 'wineTask'
})


const WineTask = mongoose.model('WineTask', schema)

module.exports = WineTask