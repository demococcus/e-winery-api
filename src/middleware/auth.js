const jwt = require('jsonwebtoken')
const User = require('../models/user')


// read the jwt secret
const jwtSecret = process.env.JWT || require('../../secrets').jwtSecret


const auth = async (req, res, next) => {
    try {
        // read the token        
        const token = req.header('Authorization').replace('Bearer ', '')

        // verify the token
        const decoded = jwt.verify(token, jwtSecret)
        
        // find a user that has this token
        const user = await User.findOne({_id: decoded._id, 'tokens.token': token})
        if (!user) { throw new Error() }
        
        // attach the user and teh token to the request so that the routes can have access to it
        req.user = user
        req.token = token

        // let the request through
        next()


    } catch(e) {
        res.status(401).send({error: 'Please authenticate'})
    }

}


module.exports = auth