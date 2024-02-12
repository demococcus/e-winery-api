const mongoose = require('mongoose')
const validator = require('validator')

const eventSchema = new mongoose.Schema({

    serNo: {
        type: Number,
        required: false
    },

    type: {
        type: String,
        required: true
    },
   
    tankLabel: {
      type: String,
      required: false
    },
    
    wineTag: {
      type: String,
      required: false
    },    
    
    note: {
      type: String,
      required: false
    },
    
    date: {
      type: Date,
      required: true
    },
    
    user: {
      type: String,
      required: false
    },

    // Link Event - Wine
    wine: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Wine'
    }
    
})


const Event = mongoose.model('Event', eventSchema)

module.exports = Event