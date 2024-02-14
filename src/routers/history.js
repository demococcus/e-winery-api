const express = require('express')
const auth = require('../middleware/auth')
const router = new express.Router()

const Wine = require('../models/wine')
const Counter = require('../models/counter')
const WineTask = require('../models/wineTask')
const WineSubTask = require('../models/wineSubTask')
const Vessel = require('../models/vessel')


router.get('/wineTasks', auth, async (req, res) =>{

    
  // if req.query.resultsNumber is 90 or less, use it, otherwise use 30
  const resultsNumber = req.query.results <= 90 ? req.query.results : 30;


  try {       
    const events = await WineTask
    .find()
    .sort({ date: -1 }) // Sort by "date" in descending order
    .limit(resultsNumber) // Limit the results
    .populate({path: 'subTasks'})
    .lean()
    .exec();
        
    res.send(events)
  } catch(e) {    
    res.status(500).send()
    console.log(e)


  } 
})


// create wine task
router.post('/wineTask', auth, async (req, res) => {

  try {
    const data = req.body

    const wineTask  = new WineTask({})

    wineTask.type = data.type
    wineTask.number = await Counter.getNextValue('event_seq')
    wineTask.date = data.date || new Date()
    wineTask.note = data.note
    wineTask.user = req.user._id
    wineTask.userName = req.user.name    
    wineTask.quantity = data.quantity


    if (data.type === 'blend-new') { 
      
      // find the vessel
      const vessel = await Vessel.findOne({ _id: data.vessel})
      wineTask.vessel = vessel._id
      wineTask.vesselLabel = vessel.label

      // crate a new wine      
      const newWine = new Wine({
        vintage: data.wineVintage,
        lot: data.wineLot,
        status: 'AG',
        quantity: data.quantity,
        vessel: vessel._id,
      })
      const wine = await newWine.save()

      wineTask.wine = wine._id
      wineTask.wineTag = `${wine.vintage} ${wine.lot}`

      
    } else {

      // find the wine and its vessel
      const wine = await Wine.findOne({ _id: data.wine})
      const populateWineOptions = {path: 'vessel', select: 'label'}
      await wine.populate(populateWineOptions)


      wineTask.wine = wine._id
      wineTask.wineTag = `${wine.vintage} ${wine.lot}`
      wineTask.vessel = wine.vessel._id
      wineTask.vesselLabel = wine.vessel.label

    }

    if (data.type === 'transfer') {

      // find the vessel
      const nextVessel = await Vessel.findOne({ _id: data.nextVessel})
      wineTask.nextVessel = nextVessel._id
      wineTask.nextVesselLabel = nextVessel.label

      // change the vessel of the wine


    }

    if (data.type === 'blend-in') {      
      wineTask.nextQuantity = data.nextQuantity
    }


    // create the subTasks

    for (const ingredient of data.ingredients || []) {

      const subTask = new WineSubTask()

      // find the wine and its vessel
      const wine = await Wine.findOne({ _id: ingredient.wine})
      const populateWineOptions = {path: 'vessel', select: 'label'}
      await wine.populate(populateWineOptions)


      subTask.type = "blend-out"
      subTask.wineTask = wineTask._id
      subTask.number = wineTask.number
      subTask.date = wineTask.date
      subTask.wine = ingredient.wine
      subTask.wineTag = `${wine.vintage} ${wine.lot}`
      subTask.vesselLabel = wine.vessel.label
      subTask.destWine = wineTask.wine
      subTask.destWineTag = wineTask.wineTag
      subTask.destVesselLabel = wineTask.vesselLabel
      subTask.quantity = ingredient.quantity

      await subTask.save()

      
    }


    // save it
    await wineTask.save()

    //send it back
    res.status(201).send(wineTask)

  } catch(e) {
    res.status(400).send(e)
    console.log(e)
  }

  return 



})


module.exports = router