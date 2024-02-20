const mongoose = require('mongoose')
const validator = require('validator')

const invitationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    trim: true
  },  

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
          throw new Error('Email is invalid')
      }
    }
  },

  role: {
    type: String,
    required: true,
    validate(value) {
      if (!["admin", "demo", "lab", "winemaker", "cellar-hand"].includes(value)) {
        throw new Error('The roles are lab, winemaker, and cellar-hand. Please choose one of these roles.')
      }
    },
  },


  company: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Company'
  },

  language: {
    type: String,
    required: false,
    minlength: 2,
    default: 'en',
    trim: true
  }, 

})


const UserInvitation = mongoose.model('userInvitation', invitationSchema)

module.exports = UserInvitation