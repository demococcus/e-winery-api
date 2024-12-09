const express = require('express')
const Wine = require('../models/wine')
const auth = require('../middleware/auth')
const router = new express.Router()




router.get('/wines', auth, async (req, res) => {
  try {

    const company = req.user.company._id
    const searchCriteria = {
      company, 
      archived: {$ne: true},
      status: {$ne: 'BT'},
    } 

    // populate the tank field with the label of the tank
    const populateVesselOptions = {path: 'vessel', select: 'label capacity number type'}

    // populate the event field with the lab events ordered by date
    const populateEventOptions = {path: 'lastLab', select: 'date', options: { sort: { 'date': -1 } }}

    
    const wines = await Wine.find()
    .find(searchCriteria)
    .populate(populateVesselOptions)
    .populate(populateEventOptions)
    .sort({ vintage: -1, lot: 1 })
    .lean()
    .exec()

    // iterate over all results and keep only the first date in the lastLab list
    wines.forEach(wine => {
      if (wine.lastLab.length > 0) {
        wine.lastLab = wine.lastLab[0].date
      } else {
        wine.lastLab = null
      }
    })    
    
    res.send(wines)
  } catch(e) {
    res.status(500).send()
  }
})

router.get('/wines/bottled', auth, async (req, res) => {
  try {

    const { lot, dateFrom, dateTo } = req.query;  // Get query parameters

    const company = req.user.company._id
    const searchCriteria = {
      company, 
      archived: {$ne: true},
      status: "BT",
    } 

    if (dateFrom && dateTo) {
      const dateToPlusOne = new Date(dateTo);
      dateToPlusOne.setDate(dateToPlusOne.getDate() + 1); // Add one day

      searchCriteria.dateBottled = {
        $gte: new Date(dateFrom),  // Greater than or equal to dateFrom
        $lte: new Date(dateToPlusOne)     // Less than or equal to dateTo
      };
    }

    if (lot && lot.length >= 3) {
      searchCriteria.lot = { $regex: lot, $options: 'i' }; // Case-insensitive "like"
    }

    // console.log('searchCriteria', searchCriteria)
    
    const wines = await Wine.find()
    .find(searchCriteria)
    .sort({ lot: 1 })
    .limit(100) // Limit the results
    .lean()
    .exec()  
    
    res.send(wines)
  } catch(e) {
    res.status(500).send()
  }
})

router.get('/wine/:id', auth, async (req, res) => {
  const _id = req.params.id
  const company = req.user.company._id
  const searchCriteria = {company, _id}

  try {
    const wine = await Wine.findOne(searchCriteria)
    
    // Populate the vessel field with the label and capacity of the vessel
    const populateWineOptions = {path: 'vessel', select: 'label capacity number type'}
    
    if (!wine) {
      res.status(404).send()
      return
    }

    await wine.populate(populateWineOptions)
    
    res.send(wine)
  } catch(e) {
    res.status(500).send()
  }
  
})

router.patch('/wine/:id', auth, async (req, res) => {

  const updates = Object.keys(req.body)
  const allowedUpdates = ['vintage', 'status', 'lot', 'vessel', "quantity", "archived", "accounting"]
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
  
  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' })
  }

  try {
    const _id = req.params.id
    const company = req.user.company._id
    const searchCriteria = {company, _id}
    const wine = await Wine.findOne(searchCriteria)

    if (!wine) {
      return res.status(404).send()
    }

    updates.forEach((update) => wine[update] = req.body[update])
    await wine.save()
    res.send(wine)
  } catch (e) {
    res.status(400).send(e)
    console.log(e)
  }
})

router.post('/wine', auth, async (req, res) => {

  const wine  = new Wine({
      ...req.body,
      company: req.user.company._id
  })

  try {
      await wine.save()
      res.status(201).send(wine)
  } catch(e) {
      res.status(400).send(e)
      console.log(e)
   }
})


// router.delete('/wine/:id', auth, async (req, res) => {
//     try {
//         const wine = await Wine.findByIdAndDelete(req.params.id)

//         if (!wine) {
//             res.status(404).send()
//             return
//         } 
//         res.send(wine)
//     } catch (e) {
//         res.status(500).send()
//     }

// })


module.exports = router