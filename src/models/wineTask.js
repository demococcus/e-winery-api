const mongoose = require('mongoose')
const validator = require('validator')

const supportedTypes = [
  "aerate", "decant", "filter", "freeze",  "remontage",
  "transfer", "transfer-partial", "blend",
]

// schema for an event that represents an operation on a wine
const schema = new mongoose.Schema({

  company: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Companie'
  },

  // type of operation - supplied by the frontend (and validated at creation)
  type: {
    type: String,
    required: true,
    validate(value) {
      if (!supportedTypes.includes(value)) {
        throw new Error('Invalid type.')
      }
    },
  },

  number: {
    type: Number,
    required: false
  },

  date: {
    type: Date,
    required: false
  },

  note: {
    type: String,
    required: false
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: 'User'
  },

  userName: {
    type: String,
    required: false
  },

  vessel: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Vessel'
  },

  vesselLabel: {
    type: String,
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

  wine: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Wine'
  },

  wineTag: {
    type: String,
    required: false
  },

  quantity: {
    type: Number,
    required: false
  },

  nextQuantity: {
    type: Number,
    required: false
  },

  ingredients: {
    type: Array,
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