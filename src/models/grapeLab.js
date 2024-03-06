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

  grape: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
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

  sugars: {type: Number, required: false},
  tAcids: {type: Number, required: false},
  pH: {type: Number, required: false},
   
})


const GrapeLab = mongoose.model('GrapeLab', schema)

module.exports = GrapeLab