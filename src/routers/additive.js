const express = require('express')
const auth = require('../middleware/auth')
const Additive = require('../models/additive')

const router = new express.Router()


// Get all additives
router.get('/additives', auth, async (req, res) => {

  // Read the query parameter 'type' and create a search criteria
  const company = req.user.company._id
  const searchCriteria = {company}  

  try {
    const additives = await Additive
    .find(searchCriteria)  
    
    res.send(additives)
  } catch(e) {    
    res.status(500).send()
  } 
})


// Get an additive by id
router.get('/additive/:id', auth, async (req, res) => {
  const _id = req.params.id  
  const company = req.user.company._id
  const searchCriteria = {company, _id}
  try {
    const additive = await Additive
    .findOne(searchCriteria)
    
    if (!additive) {
      res.status(404).send()
      return
    } 

    res.send(additive)
  } catch(e) {
    res.status(500).send()
  }    
})

// Create an additive
router.post('/additive', auth, async (req, res) => {

  // If the additive does exist, return a 404 error
  const company = req.user.company._id
  const searchCriteria = {company, label: req.body.label}
  const existingAdditive = await Additive.findOne(searchCriteria)
  if (existingAdditive) {
    res.status(404).send({"error": "Additive already exists."})
    return
  }

  const additive  = new Additive(req.body)
  additive.company = req.user.company._id

  try {
    await additive.save()
    res.status(201).send(additive)
  } catch(e) {
    res.status(400).send(e)
  }
})

// receive additive
router.patch('/additive/receive/:id', auth, async (req, res) => {

  const updates = Object.keys(req.body)
  const allowedUpdates = ["quantity"]
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' })
  }

  try {
    const _id = req.params.id
    const company = req.user.company._id
    const searchCriteria = {company, _id}
    const additive = await Additive.findOne(searchCriteria)
  
    if (!additive) {
      return res.status(404).send()    
    }
    
    additive['quantity'] += Number(req.body['quantity']);

    await additive.save()
    res.send(additive)

  } catch (e) {
    res.status(400).send(e)
    console.log(e)
  }

})


// Delete an additive by id
router.delete('/additive/:id', auth, async (req, res) => {
  const _id = req.params.id
  const company = req.user.company._id
  const searchCriteria = {company, _id}

  try {
    const additive = await Additive.findOne(searchCriteria)

    // If the additive does not exist, return a 404 error
    if (!additive) {
      res.status(404).send()
      return
    }

    await additive.deleteOne({ _id })
    res.send(additive)
  } catch(e) {
    res.status(500).send()
    console.error(e)
  }
})


module.exports = router