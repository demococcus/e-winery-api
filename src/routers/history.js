const express = require('express')
const auth = require('../middleware/auth')
const router = new express.Router()

const Wine = require('../models/wine')
const Counter = require('../models/counter')
const WineTask = require('../models/wineTask')
const WineSubTask = require('../models/wineSubTask')
const WineLab = require('../models/wineLab')
const Vessel = require('../models/vessel')
const Additive = require('../models/additive')


// get wine tasks
router.get('/wineTasks', auth, async (req, res) =>{

    
  // if req.query.resultsNumber is 90 or less, use it, otherwise use 30
  const resultsNumber = req.query.results <= 90 ? req.query.results : 30;

  const company = req.user.company._id
  const searchCriteria = {company}   


  try {       
    const results = await WineTask
    .find(searchCriteria)
    .sort({ date: -1 }) // Sort by "date" in descending order
    .limit(resultsNumber) // Limit the results
    .populate({path: 'subTasks'})
    .lean()
    .exec()
        
    res.send(results)
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

    wineTask.company = req.user.company._id

    wineTask.type = data.type
    wineTask.number = await Counter.getNextValue('wineTaskSeq',  req.user.company._id)
    wineTask.date = data.date || new Date()
    wineTask.note = data.note
    wineTask.user = req.user._id
    wineTask.userName = req.user.name 
    
    
    wineTask.quantity = data.quantity
    wineTask.wine = data.wine

    // find the wine and its vessel
    const wine = await Wine.findOne({ _id: data.wine})
    const populateWineOptions = {path: 'vessel', select: 'label'}
    await wine.populate(populateWineOptions)

    wineTask.wineTag = `${wine.vintage} ${wine.lot}`
    wineTask.vessel = wine.vessel._id
    wineTask.vesselLabel = wine.vessel.label

    wineTask.nextQuantity = data.nextQuantity;    

    if (data.type === 'transfer-partial') { 
      
      // find the nextVessel
      const nextVessel = await Vessel.findOne({ _id: data.nextVessel})
      wineTask.nextVessel = nextVessel._id
      wineTask.nextVesselLabel = nextVessel.label

      // crate a new wine with the same properties as the existing one    
      const nextWine = new Wine({
        vintage: wine.vintage,
        lot: wine.lot,
        status: wine.status,
        quantity: data.nextQuantity,
        vessel: nextVessel._id,
      })
      await nextWine.save()

      // save the modifications in the current wine
      wine.quantity -= data.nextQuantity
      await wine.save()


      // create a subtask for the original wine
      const subTask = new WineSubTask({
        company: req.user.company._id,
        type: "transfer-out",
        wineTask: wineTask._id,
        number: wineTask.number,
        date: wineTask.date,
        wine: wine._id,
        wineTag: `${wine.vintage} ${wine.lot}`,
        vesselLabel: wine.vessel.label,
        destWine: nextWine._id,
        destWineTag: `${wine.vintage} ${wine.lot}`,
        destVesselLabel: nextVessel.label,
        quantity: data.nextQuantity,
        userName: wineTask.userName,
      })

      await subTask.save()
      

      // now modify the task so that it reflects the actions on the new wine
      wineTask.wine = nextWine._id
      wineTask.wineTag = `${wine.vintage} ${wine.lot}`


      
    } else if (data.type === 'transfer') {

      // find the vessel
      const nextVessel = await Vessel.findOne({ _id: data.nextVessel})
      wineTask.nextVessel = nextVessel._id
      wineTask.nextVesselLabel = nextVessel.label

      // change the vessel of the wine
      wine.vessel = nextVessel._id;
      await wine.save()


    } else if (data.type === 'blend') {      
      wineTask.nextQuantity = data.nextQuantity

      // change the quantity of the wine
      wine.quantity = data.nextQuantity
      await wine.save()

      // create the subTasks
  
      for (const ingredient of data.ingredients || []) {
  
        const subTask = new WineSubTask()
  
        // find the wine and its vessel
        const wine = await Wine.findOne({ _id: ingredient.wine})
        const populateWineOptions = {path: 'vessel', select: 'label'}
        await wine.populate(populateWineOptions)
  
        subTask.company = req.user.company._id,
        subTask.type = "transfer-out"
        subTask.wineTask = wineTask._id
        subTask.number = wineTask.number
        subTask.date = wineTask.date
        subTask.wine = ingredient.wine
        subTask.wineTag = `${wine.vintage} ${wine.lot}`
        subTask.vessel = wine.vessel._id
        subTask.vesselLabel = wine.vessel.label
        subTask.destWine = wineTask.wine
        subTask.destWineTag = wineTask.wineTag
        subTask.destVesselLabel = wineTask.vesselLabel
        subTask.quantity = ingredient.quantity
        subTask.quantityAfter = wine.quantity - ingredient.quantity
        subTask.userName = wineTask.userName
 
        await subTask.save()
  
        // modify the quantity of the source wine
        wine.quantity = subTask.quantityAfter

        // archive the wine if it has no quantity left
        if (wine.quantity <= 0) {
          wine.archived = true
          wine.tank = null
        };


        await wine.save()      
      }


    } else if (data.type === 'additive') {      


      // create the subTasks  
      for (const element of data.additives || []) {
  
        const subTask = new WineSubTask()
  
        // find the additive
        const additive = await Additive.findOne({ _id: element.id})
  
        subTask.company = req.user.company._id,
        subTask.type = data.type
        
        subTask.wineTask = wineTask._id
        subTask.number = wineTask.number
        subTask.date = wineTask.date
        subTask.userName = wineTask.userName

        subTask.additive = additive.id
        subTask.additiveLabel = additive.label
        subTask.additiveUnit = additive.unit
        subTask.quantity = element.quantity
        
        subTask.destWine = wineTask.wine
        subTask.destWineTag = wineTask.wineTag
        subTask.destVesselLabel = wineTask.vesselLabel
 
        await subTask.save()      
      }
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

// create wine lab
router.post('/wineLab', auth, async (req, res) => {

  try {
    const data = req.body

    // find the wine and its vessel
    const wine = await Wine.findOne({ _id: data.wine})
    const populateWineOptions = {path: 'vessel', select: 'label'}
    await wine.populate(populateWineOptions)

    const wineLab  = new WineLab({
      ...data,
      company: req.user.company._id,

      type: 'lab',
      date: data.date || new Date(),
      user: req.user._id,
      userName: req.user.name,
      vesselLabel: wine.vessel.label,
      wine: wine._id,
      wineTag: `${wine.vintage} ${wine.lot}`,  

    })



    // save it
    await wineLab.save()

    //send it back
    res.status(201).send(wineLab)

  } catch(e) {
    res.status(400).send(e)
    console.log(e)
  }

  return 



})

// get wine labs
router.get('/wineLabs', auth, async (req, res) =>{

    
  // if req.query.resultsNumber is 90 or less, use it, otherwise use 30
  const resultsNumber = req.query.results <= 90 ? req.query.results : 30;

  const company = req.user.company._id
  const searchCriteria = {company} 


  try {       
    const results = await WineLab
    .find(searchCriteria)
    .sort({ date: -1 }) // Sort by "date" in descending order
    .limit(resultsNumber) // Limit the results
    .lean()
    .exec()
        
    res.send(results)
  } catch(e) {    
    res.status(500).send()
    console.log(e)


  } 
})

// get teh labs and the tasks of a given wine
router.get('/history/wine/:id', auth, async (req, res) =>{

  const company = req.user.company._id
  const searchCriteria = {company, wine: req.params.id} 


  try {   
    
     // get the labs
     const labResults = await WineLab
     .find(searchCriteria)
     .sort({ date: -1 }) // Sort by "date" in descending order
     .limit(100) // Limit the results to 100
     .lean()
     .exec()
    

    // get the tasks
    const taskResults = await WineTask
    .find(searchCriteria)
    .sort({ date: -1 }) // Sort by "date" in descending order
    .limit(100) // Limit the results to 100
    .populate({path: 'subTasks'})
    .lean()
    .exec()

   

    // get the subTasks
    const subTaskResults = await WineSubTask
    .find(searchCriteria)
    .sort({ date: -1 }) // Sort by "date" in descending order
    .limit(100) // Limit the results to 100
    .lean()
    .exec()


        
    res.send([...labResults, ...taskResults, ...subTaskResults])
  } catch(e) {    
    res.status(500).send()
    console.log(e)
  } 
})




module.exports = router