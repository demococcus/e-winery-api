const mongoose = require('mongoose')
const validator = require('validator')

const supportedTypes = ["transfer-out", "additive"]

// schema for an event that represents an operation on a wine
const schema = new mongoose.Schema({

  company: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Companie'
  },

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
    required: false,
    ref: 'Wine'
  },

  additive: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: 'Additive'
  },

  wineTag: {
    type: String,
    required: false
  },

  additiveLabel: {
    type: String,
    required: false
  },  

  additiveUnit: {
    type: String,
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

  quantityAfter: {
    type: Number,
    required: false
  },
  
  userName: {
    type: String,
    required: true
  } 
  
   
})


const WineSubTask = mongoose.model('WineSubTask', schema)

module.exports = WineSubTask