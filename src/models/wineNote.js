const mongoose = require('mongoose')
const validator = require('validator')

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
    validate(value) {if (value !== 'note' ) {throw new Error('Invalid type.')}
    },
  },


  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: 'User'
  },

  wine: {
  type: mongoose.Schema.Types.ObjectId,
  required: true,
    ref: 'Wine'
  },

  date: {type: Date, required: false},
  
  userName: {type: String, required: false},
  vesselLabel: {type: String, required: false},
  wineLot: {type: String, required: false},
  wineVintage: {type: String, required: false},
  
  note: {type: String, required: true},

})


const WineNote = mongoose.model('WineNote', schema)

module.exports = WineNote