const mongoose = require('mongoose')
const validator = require('validator')

const supportedTypes = ["blend-out"]

// schema for an event that represents an operation on a wine
const schema = new mongoose.Schema({


  wineTask: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'wineOp'
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

  // supplied by the frontend
  wine: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Wine'
  },

  // supplied by the frontend
  quantity: {
    type: Number,
    required: false
  },
  

  // from the partent op
  destVesselLabel: {
    type: String,
    required: false
  },

  // from the partent op
  destWineTag: {
    type: String,
    required: false
  },

  // supplied by the frontend
  quantity: {
    type: Number,
    required: false
  },
  
   
})


const WineSubTask = mongoose.model('WineSubTask', schema)

module.exports = WineSubTask