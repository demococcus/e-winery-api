const express = require('express')
const auth = require('../middleware/auth')
const router = new express.Router()

const Wine = require('../models/wine')
const Counter = require('../models/counter')
const WineTask = require('../models/wineTask')
const WineSubTask = require('../models/wineSubTask')
const Vessel = require('../models/vessel')


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

    // find the vessel

    if (data.type === 'blend-new') { 
      
      // find the vessel
      const vessel = await Vessel.findOne({ _id: data.vessel})
      wineTask.vessel = vessel._id
      wineTask.vesselLabel = vessel.label

      // crate a new wine      
      const newWine = new Wine({
        vintage: data.newWine.vintage,
        lot: data.newWine.lot,
        status: 'AG',
        quantity: data.quantity,
        vessel: vessel._id,
      })
      const wine = await newWine.save()

      wineTask.wine = wine._id
      wineTask.wineTag = `${wine.vintage} ${wine.lot}`

      
    } else {

      // find the wine
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
      const vessel = await Vessel.findOne({ _id: data.vessel})
      wineTask.nextVessel = vessel._id
      wineTask.nextVesselLabel = vessel.label

    }


    // create the subTasks

    for (const subData of data.subTasks || []) {

      const subTask = new WineSubTask()

      subTask.wineTask = wineTask._id
      subTask.type = "blend-out"
      subTask.wine = subData.wine._id
      subTask.quantity = subData.quantity
      subTask.destVesselLabel = wineTask.vesselLabel
      subTask.destWineTag = wineTask.wineTag

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