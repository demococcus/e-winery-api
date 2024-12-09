const express = require('express')
const auth = require('../middleware/auth')
const Additive = require('../models/additive')
const AdditiveDelivery = require('../models/additiveDelivery')

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

    // get the latest deliveries
    const deliveries = await AdditiveDelivery
    .find({refAdditive: _id})
    .sort({date: -1})
    .limit(10)
    .lean()
    .exec()

    additive.deliveries = deliveries

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
  const allowedUpdates = ["quantity", "supplier"]
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' })
  }

  try {
    const _id = req.params.id
    const company = req.user.company._id
    const searchCriteria = {company, _id}
    const additive = await Additive.findOne(searchCriteria)

    const data = req.body
  
    if (!additive) {
      return res.status(404).send()    
    }

    // create delivery
    const delivery = new AdditiveDelivery({
      company: req.user.company._id,
      date: data.date || new Date(),
      supplier: data.supplier,
      quantity: data.quantity,
      refAdditive: additive._id
    })
    await delivery.save()


    const newQuantity = additive.quantity + data.quantity;
    additive.quantity = Math.round(newQuantity * 1000) / 1000
    // additive['quantity'] += req.body['quantity']   

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

// Delete additive delivery
router.delete('/additive/undoReceive/:id', auth, async (req, res) => {
  const _id = req.params.id
  const company = req.user.company._id
  const searchCriteria = {company, _id}

  try {
    const delivery = await AdditiveDelivery.findOne(searchCriteria)

    // If the additive does not exist, return a 404 error
    if (!delivery) {
      res.status(404).send()
      return
    }

    // get the additive and substract the quantity
    const additive = await Additive.findOne({_id: delivery.refAdditive})
    if (!additive) {
      res.status(404).send()
      return
    }
    console.log('additive.quantity b', additive.quantity)

    const newQuantity = additive.quantity - delivery.quantity

    console.log('newQuantity', newQuantity)
    
    additive.quantity = Math.round(newQuantity * 1000) / 1000
    
    console.log('additive.quantity a', additive.quantity)

    await additive.save()    

    // delete delivery
    await delivery.deleteOne({ _id })

    res.send(delivery)
  } catch(e) {
    res.status(500).send()
    console.error(e)
  }
})


module.exports = router