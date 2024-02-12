const express = require('express')
const User = require('../models/user')
const router = new express.Router()
const auth = require('../middleware/auth')


router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        
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

router.post('/users', async (req, res) => {
    const user = new User(req.body)

    // Disable creation of new users except the ones from the list
    if (!["georgi.gatin@gmail.com"].includes(user.email)) {
        res.status(401).send({error: 'Please contact the administrator to create a new user.'})
        return
    }


    try {
        await user.save()
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