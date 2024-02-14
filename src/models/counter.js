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

// creating a model method that gets the next sequence value
counterSchema.statics.getNextValue = async(sequenceName) => {


    const sequenceDocument = await Counter.findOneAndUpdate(
        { name: sequenceName },
        { $inc: { value: 1 } },
        { returnOriginal: false }
      );
    return sequenceDocument.value;
 
}



const Counter = mongoose.model('counter', counterSchema)

module.exports = Counter