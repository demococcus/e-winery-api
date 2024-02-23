const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const admin = require('../middleware/admin')


const Invitation = require("../models/invitation")

router.post('/invitation', auth, admin, async (req, res) => {
// router.post('/invitation', async (req, res) => {

  const company  = new Invitation(req.body)
  
    try {
        await company.save()
        res.status(201).send(company)
    } catch(e) {
        res.status(400).send(e)
    }
})

module.exports = router