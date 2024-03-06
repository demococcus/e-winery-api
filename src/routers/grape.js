const express = require('express')
const Grape = require('../models/grape')
const auth = require('../middleware/auth')
const router = new express.Router()




router.get('/grapes', auth, async (req, res) => {
  try {

    const company = req.user.company._id
    const searchCriteria = {company, archived: {$ne: true}} 
    
    const wines = await Grape.find()
    .find(searchCriteria)
   
    
    res.send(wines)
  } catch(e) {
    res.status(500).send()
  }
})

router.get('/grape/:id', auth, async (req, res) => {
  const _id = req.params.id
  const company = req.user.company._id
  const searchCriteria = {company, _id}

  try {
    const grape = await Grape.findOne(searchCriteria)
    
    if (!grape) {
      res.status(404).send()
      return
    }
    
    res.send(grape)
  } catch(e) {
    res.status(500).send()
  }
  
})

router.patch('/grape/:id', auth, async (req, res) => {

  const updates = Object.keys(req.body)
  const allowedUpdates = ['parcel', 'variety', 'area', 'status', "archived"]
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
  
  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' })
  }

  try {
    const _id = req.params.id
    const company = req.user.company._id
    const searchCriteria = {company, _id}
    const grape = await Grape.findOne(searchCriteria)

    if (!grape) {
      return res.status(404).send()
    }

    updates.forEach((update) => grape[update] = req.body[update])
    await grape.save()
    res.send(grape)
  } catch (e) {
    res.status(400).send(e)
    console.log(e)
  }
})

router.post('/grape', auth, async (req, res) => {

  const grape = new Grape({
      ...req.body,
      company: req.user.company._id
  })

  try {
      await grape.save()
      res.status(201).send(grape)
  } catch(e) {
      res.status(400).send(e)
      console.log(e)
   }
})


module.exports = router