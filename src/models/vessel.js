const mongoose = require('mongoose')
const validator = require('validator')

const vesselSchema = new mongoose.Schema({

    company: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Companie'
      },

    label: {
        type: String,
        required: true,
        trim: true,
        // unique: true, not a good idea of the same database is used for more than one company
        validate: {
            validator: function(value) {
                return value.length >= 2;
            },
            message: 'Label must have a length greater than 6.'
        }
    },

    capacity: {
        type: Number,
        required: true,
        default: false,
        validate: {
            validator: function(value) {
                return value > 0;
            },
            message: 'Capacity must be greater than 0.'
        }
    },

    type: {
        type: String,
        required: true,
        default: 1,
        validate: {
            validator: function(value) {
                return ["barrel", "tank"].includes(value);
            },
            message: 'Type must be either "barrel" or "tank".'
        }
    },

    height: {
        type: Number,
        required: false,
        default: 1,
        validate: {
            validator: function(value) {
                return value > 0
            },
            message: 'Height must be greater than 0.'
        }
    },

    number: {
        type: Number,
        required: false,
        default: 1,
        validate: {
            validator: function(value) {
                return value > 0 && value < 100;
            },
            message: 'Number must be greater than 0 and lower than 100.'
        },
    },

    // calculated value
    status: {
        type: String,
        required: false,
    },
    
    // calculated value
    usedCapacity: {
        type: Number,
        required: false,
    },
})

// Vessel - Wine
vesselSchema.virtual('wines', {
    ref: 'Wine',
    localField: '_id',
    foreignField: 'vessel'
})


const Vessel = mongoose.model('Vessel', vesselSchema)

module.exports = Vessel