const express = require('express')
const User = require('../models/user')
const router = new express.Router()
const auth = require('../middleware/auth')
const UserInvitation = require('../models/invitation')


router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()

        await user.populate({path: 'company', select: 'name'})
        
        res.send({user, token})

    } catch(e) {
        res.status(400).send()
        console.log(e)
    }

})

router.get('/users/logout', auth, async (req, res) => {

    try {
        // remove the token from the list of the active tokens
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send()

    } catch(e) {
        res.status(500).send()
    }

})

router.get('/users/logoutAll', auth, async (req, res) => {

    try {
        req.user.tokens = []
        await req.user.save()
        res.send()

    } catch(e) {
        res.status(500).send()
    }

})

router.post('/users/signup', async (req, res) => {

    // verify if the user already exists
    existingUser = await User.findOne({email: req.body.email})
    if (existingUser) { 
        res.status(400).send({error: 'User already exists.'})
        return
    }
    
    // verify if the user is invited
    const invitation = await UserInvitation.findOne({email: req.body.email})
    
    if (!invitation) {
        res.status(401).send({error: 'You are not invited.'})
        return
    }
    
    const user = new User(req.body)

    // copy the properties from the invitation
    user.name = invitation.name
    user.role = invitation.role
    user.company = invitation.company
    user.language = invitation.language


    try {
        // save the user
        await user.save()

        // populate the company info
        await user.populate({path: 'company', select: 'name'})
        
        // generate token
        const token = await user.generateAuthToken()
        
        res.status(201).send({user, token})
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/users/me', auth, async (req, res) => {

    res.status(200).send(req.user)

})

router.patch('/users/me', auth, async (req, res) => {
    
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'password']

    const invalidProperties = updates.every((update) => {
        return allowedUpdates.includes(update)
    })

    if (!invalidProperties) {
        res.status(400).send({'error': 'Invalid property detected!'})
        return
    }

    try {       
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()        
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }

})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }

})


module.exports = router