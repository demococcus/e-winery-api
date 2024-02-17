const express = require('express')
const router = new express.Router()

const auth = require('../middleware/auth')
const admin = require('../middleware/admin')

const Company = require("../models/company")

router.post('/company', auth, admin, async (req, res) => {

  const company  = new Company(req.body)
  
    try {
        await company.save()
        res.status(201).send(company)
    } catch(e) {
        res.status(400).send(e)
    }
})

module.exports = router