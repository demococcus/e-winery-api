const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
// const Task = require('./tank')

// read the jwt secret
const jwtSecret = process.env.JWT || require('../../secrets').jwtSecret

const userSchema = new mongoose.Schema({
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
    password: {
        type: String,
        required: true,
        minlength: 8,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    role: {
        type: String,
        required: true,
        validate(value) {
            if (!["demo", "lab", "winemaker", "cellar-hand"].includes(value)) {
                throw new Error('The roles are lab, winemaker, and cellar-hand. Please choose one of these roles.')
            }
        },
    },

    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})



userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens

    return userObject
}

// creating an instance method
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user.id.toString() }, jwtSecret)

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token    
}

// creating a model method
userSchema.statics.findByCredentials = async(email, password) => {

    const user = await User.findOne({email})
    
    if (!user) {
        throw new Error('Unable to log in')
    }
    
    const isMatch = await bcrypt.compare(password, user.password)  

    if (!isMatch) {
        throw new Error('Unable to log in')        
    }    
    return user    
}



// Hash the plain password before saving using middleware
userSchema.pre('save', async function (next) {
    const user = this
    
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }    
    next()    
})




// Delete user tasks when user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ owner: user._id })    
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User