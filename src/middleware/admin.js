const jwt = require('jsonwebtoken')
const User = require('../models/user')


// read the jwt secret
const jwtSecret = process.env.JWT || require('../../secrets').jwtSecret


const admin = async (req, res, next) => {
    try {

        // read the role
        if (req.user.role !== 'admin') {
            throw new Error()
        }

        // let the request through
        next()


    } catch(e) {
        res.status(401).send({error: 'You are not authorized to perform this action.'})
    }

}


module.exports = admin