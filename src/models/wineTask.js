const mongoose = require('mongoose')
const validator = require('validator')

const supportedTypes = [
  "transfer", "blend-new", "blend-in",
  "aerate", "decant", "filter", "freeze",  "remontage", "note"
]

// schema for an event that represents an operation on a wine
const schema = new mongoose.Schema({

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

  // calculated at creation (auto increment)
  number: {
    type: Number,
    required: false
  },

  // use current date if not supplied by the frontend
  date: {
    type: Date,
    required: false
  },

  // supplied by the frontend
  note: {
    type: String,
    required: false
  },

  // the current user
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: 'User'
  },

  // extracted from the user
  userName: {
    type: String,
    required: false
  },

  // supplied by the frontend
  vessel: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Vessel'
  },

  // extracted from the provided vessel
  vesselLabel: {
    type: String,
    required: false
  },

  // supplied by the frontend (if any)
  nextVessel: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: 'Vessel'
  },

  // extracted from the provided vessel
  nextVesselLabel: {
    type: String,
    required: false
  },

  // supplied by the frontend
  wine: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Wine'
  },

  // extracted from the wine
  wineTag: {
    type: String,
    required: false
  },

  // supplied by the frontend
  quantity: {
    type: Number,
    required: false
  },

  // supplied by the frontend (for opNumber === 'blend')
  nextQuantity: {
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