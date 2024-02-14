const mongoose = require('mongoose')
const validator = require('validator')


const wineSchema = new mongoose.Schema({

    vintage: {
        type: Number,
        required: true,  
        // validate the vintage is a number between 2000 and the current year      
        validate(value) {
            if (value < 2000 || value > new Date().getFullYear()) {
                throw new Error('Vintage must be a number between 2000 and the current year')
            }
        }
    },

    lot: {
        type: String,
        required: true,
        minlength: 3,        
        trim: true,
        // unique: true, // should not be unique
    },

    status: {
        type: String,
        default: ''
    },

    quantity: {
        type: Number,
        required: true, 
        validate(value) {
            if (value < 0) {
                throw new Error('Quantity must be a positive number')
            }
        }       
    },

    archived: {
        type: Boolean,
        required: false,  
        default: false      
    },

    
    // Link Wine - Vessel
    vessel: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Vessel'
    }    
})

// Wine - Event
wineSchema.virtual('events', {
    ref: 'Event',
    localField: '_id',
    foreignField: 'wine'
})
// Wine - Event
wineSchema.virtual('lastLab', {
    ref: 'Event',
    localField: '_id',
    foreignField: 'wine'
})


// Gives more control over what is sent back in the response
wineSchema.methods.toJSON = function () {
    const wine = this
    const wineObject = wine.toObject()

    wineObject.archived = wineObject.archived || false

    // delete wineObject.someProperty

    return wineObject

}

// Runs before each save
wineSchema.pre('save', async function (next) {
    const wine = this
    
    // Wine is being archived: removing it from the vessel
    if (wine.isModified('archived') && wine.archived === true) {
        wine.vessel = null
        console.log('Wine is being archived: removing it from the vessel')
    }

    // Wine is being added to a vessel: removing the archived status
    if (wine.isModified('vessel') && wine.vessel !== null) {
        wine.archived = false
    }                
    
    next()    
})



const Wine = mongoose.model('Wine', wineSchema)

module.exports = Wine