const mongoose = require('mongoose')

const counterSchema = new mongoose.Schema({

    name: {
        type: String,
        required: false
    },
    value: {
        type: Number,
        required: false
    },
    
})


const Counter = mongoose.model('counter', counterSchema)

module.exports = Counter