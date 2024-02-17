const mongoose = require('mongoose')
const validator = require('validator')

const supportedTypes = [ "lab"]

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

  vesselLabel: {
    type: String,
    required: false
  },

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

  alcohol: {type: Number, required: false},
  sugars: {type: Number, required: false},
  tAcids: {type: Number, required: false},
  pH: {type: Number, required: false},
  SO2: {type: Number, required: false},
  tSO2: {type: Number, required: false},
  vAcids: {type: Number, required: false},
  density: {type: Number, required: false},
  mAcid: {type: Number, required: false},
   
})


const WineLab = mongoose.model('WineLab', schema)

module.exports = WineLab