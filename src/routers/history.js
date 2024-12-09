const express = require('express')
const auth = require('../middleware/auth')
const router = new express.Router()

const Wine = require('../models/wine')
const Grape = require('../models/grape')
const Counter = require('../models/counter')
const WineTask = require('../models/wineTask')
const WineSubTask = require('../models/wineSubTask')
const GrapeSubTask = require('../models/grapeSubTask')
const WineLab = require('../models/wineLab')
const GrapeLab = require('../models/grapeLab')
const Vessel = require('../models/vessel')
const Additive = require('../models/additive')

const wineTaskSimpleTypes = ["aerate", "decant", "drain-press", "filter", "freeze",  "remontage",]


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
    .populate({path: 'grapeSubTasks'})
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
    wineTask.seqNumber = await Counter.getNextValue('wineTaskSeq',  req.user.company._id)
    wineTask.date = data.date || new Date()
    wineTask.note = data.note
    wineTask.user = req.user._id
    wineTask.userName = req.user.name 
    
    
    // find the wine
    wineTask.wine = data.wine
    const wine = await Wine.findOne({ _id: data.wine, company: req.user.company._id})
    if (!wine) {
      res.status(404).send({"error": "Wine not found"})
      return
    }
    wineTask.wineLot = wine.lot
    wineTask.wineVintage = wine.vintage
    wineTask.quantityBefore = wine.quantity 
    wineTask.wineAccounting = wine.accounting

    // find the current vessel
    const populateWineOptions = {path: 'vessel', select: 'label'}
    await wine.populate(populateWineOptions)
    wineTask.vessel = wine.vessel._id
    wineTask.vesselLabel = wine.vessel.label

    // add data according to the type of the task

    if (data.type === 'split-from') { 

      // the quantity transferred to the new wine
      wineTask.quantity = data.quantity

      // find the nextVessel
      wineTask.nextVessel = data.nextVessel
      const nextVessel = await Vessel.findOne({ _id: data.nextVessel, company: req.user.company._id})
      if (!nextVessel) {
        res.status(404).send({"error": "nextVessel not found"})
        return
      }
      wineTask.nextVesselLabel = nextVessel.label

      // crate a new wine with the same properties as the existing one    
      const nextWine = new Wine({
        company: req.user.company._id,
        vintage: wine.vintage,
        lot: wine.lot,
        status: wine.status,
        quantity: data.quantity,
        vessel: data.nextVessel,
        accounting: wine.accounting,
      })
      await nextWine.save()


      // save the modifications in the current wine
      wine.quantity -= data.quantity
      await wine.save()

      // create a subtask for the new wine
      const subTask = new WineSubTask({
        company: req.user.company._id,
        type: "split-to",
        wineTask: wineTask._id,
        seqNumber: wineTask.seqNumber,        
        date: wineTask.date,
        user: wineTask.user,
        userName: wineTask.userName,

        // that would be the new wine
        wine: nextWine._id,
        wineLot: nextWine.lot,
        wineVintage: nextWine.vintage,
        vessel: nextVessel._id,
        vesselLabel: nextVessel.label,

        // parent wine details
        refWine: wine._id,
        refWineLot: wine.lot,
        refWineVintage: wine.vintage,
        refVesselLabel: wine.vessel.label,

        // parent vessel details
        refVessel:  wineTask.vessel,
        refVesselLabel:  wineTask.vesselLabel,
        
        // the quantity transferred to the new wine
        quantity: data.quantity,
        
      })

      await subTask.save()


    } else if (data.type === 'transfer') {

      // find the vessel
      const nextVessel = await Vessel.findOne({ _id: data.nextVessel, company: req.user.company._id})
      if (!nextVessel) {
        res.status(404).send({"error": "nextVessel not found"})
        return
      }
      wineTask.nextVessel = nextVessel._id
      wineTask.nextVesselLabel = nextVessel.label

      // change the vessel of the wine
      wine.vessel = nextVessel._id;
      await wine.save()


    } else if (data.type === 'blend') {      

      // wineTask.nextQuantity = data.nextQuantity
      // change the quantity of the wine
      // wine.quantity = data.nextQuantity
      // await wine.save()

      // create the subTasks

      let blendQuantity = 0
  
      // do for each ingredient (subWine)
      for (const dataSubWine of data.subWines || []) {

        // the quantity that is added to the blend
        blendQuantity += dataSubWine.quantity
  
        // create the subTask
        const subTask = new WineSubTask()

        subTask.type = "transfer-out"
        subTask.wineTask = wineTask._id
        subTask.seqNumber = wineTask.seqNumber
        subTask.date = wineTask.date
        subTask.user = wineTask.user
        subTask.userName = wineTask.userName
        subTask.company = req.user.company._id

        subTask.refWine = wineTask.wine
        subTask.refWineLot = wineTask.wineLot
        subTask.refWineVintage = wineTask.wineVintage

        subTask.refVessel = wineTask.vessel
        subTask.refVesselLabel = wineTask.vesselLabel
          
        // find the subWine and its vessel
        const subWine = await Wine.findOne({ _id: dataSubWine.id,  company: req.user.company._id})
        if (!subWine) {
          res.status(404).send({"error": "subWine not found"})
          return
        }
        const populateWineOptions = {path: 'vessel', select: 'label'}
        await subWine.populate(populateWineOptions)       

        subTask.wine = subWine.id
        subTask.wineLot = subWine.lot
        subTask.wineVintage = subWine.vintage
        subTask.vessel = subWine.vessel._id
        subTask.vesselLabel = subWine.vessel.label
        
        subTask.quantityBefore = subWine.quantity
        subTask.quantity = dataSubWine.quantity
 
        await subTask.save()
  
        // modify the quantity of the source wine
        subWine.quantity -= dataSubWine.quantity

        // archive the wine if it has no quantity left
        if (subWine.quantity <= 0) {
          subWine.archived = true
          subWine.tank = null
        };


        await subWine.save()      
      }

      // modify the quantity of the blend
      wine.quantity += blendQuantity
      
      await wine.save()


    } else if (data.type === 'vinification') {      

      // wineTask.nextQuantity = data.nextQuantity
      // change the quantity of the wine
      // wine.quantity = data.nextQuantity
      // await wine.save()

      // create the subTasks

      let blendQuantity = 0
  
      // do for each ingredient (subWine)
      for (const dataSubGrape of data.subGrapes || []) {

        // the quantity that is added to the blend
        blendQuantity += dataSubGrape.quantity
  
        // create the subTask
        const subTask = new GrapeSubTask()

        subTask.type = "vinification"
        subTask.wineTask = wineTask._id
        subTask.seqNumber = wineTask.seqNumber
        subTask.date = wineTask.date
        subTask.user = wineTask.user
        subTask.userName = wineTask.userName
        subTask.company = req.user.company._id

        subTask.refWine = wineTask.wine
        subTask.refWineLot = wineTask.wineLot
        subTask.refWineVintage = wineTask.wineVintage

        subTask.refVessel = wineTask.vessel
        subTask.refVesselLabel = wineTask.vesselLabel
          
        // find the subWine and its vessel
        const subGrape = await Grape.findOne({ _id: dataSubGrape.id,  company: req.user.company._id})
        if (!subGrape) {
          res.status(404).send({"error": "subGrape not found"})
          return
        }
  

        subTask.grape = subGrape.id
        subTask.grapeParcel = subGrape.parcel
        subTask.grapeVariety = subGrape.variety      

        subTask.quantity = dataSubGrape.quantity
 
        await subTask.save()
     
      }

      // modify the quantity of the blend
      wine.quantity += blendQuantity
      
      await wine.save()


    } else if (data.type === 'additive') {      


      // create the subTasks  
      for (const element of data.additives || []) {
  
        const subTask = new WineSubTask()

        subTask.type = data.type
        subTask.wineTask = wineTask._id
        subTask.seqNumber = wineTask.seqNumber
        subTask.date = wineTask.date
        subTask.user = wineTask.user
        subTask.userName = wineTask.userName
        subTask.company = req.user.company._id,

        subTask.refWine = wineTask.wine
        subTask.refWineLot = wineTask.wineLot
        subTask.refWineVintage = wineTask.wineVintage
        subTask.refWineAccounting = wineTask.wineAccounting

        subTask.refVessel = wineTask.vessel
        subTask.refVesselLabel = wineTask.vesselLabel
        
        // find the additive
        const additive = await Additive.findOne({ _id: element.id, company: req.user.company._id})
        if (!additive) {
          res.status(404).send({"error": "additive not found"})
          return
        }       
        subTask.additive = additive.id
        subTask.additiveLabel = additive.label
        subTask.additiveUnit = additive.unit
        subTask.additiveAccounting = additive.accounting
        subTask.quantity = element.quantity
   
        await subTask.save()   
        
        // substract the quantity from the additive balance
        const newQuantity = additive.quantity - element.quantity
        additive.quantity = Math.round(newQuantity * 1000) / 1000
        // additive.quantity -= element.quantity

        await additive.save()


      }
    } else if (!wineTaskSimpleTypes.includes(wineTask.type)) {
      res.status(400).send({'error': 'Unknown task type'})
      return
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

    // verify if at leas one of these value is present and not null: alcohol, sugars, SO2, tSO2, vAcids, pH, tAcids, density, mAcid
    if (
        !data.alcohol 
        && !data.sugars 
        && !data.SO2 
        && !data.tSO2 
        && !data.corrSO2 
        && !data.vAcids 
        && !data.pH 
        && !data.tAcids 
        && !data.density 
        && !data.mAcid 
        && !data.hot 
        && !data.cold 
      ) {
      res.status(400).send({error: 'At least one value must be present.'})
      return
    }


    const wineLab  = new WineLab({
      ...data,
      company: req.user.company._id,

      type: 'lab',
      date: data.date || new Date(),
      user: req.user._id,
      userName: req.user.name,
      vesselLabel: wine.vessel.label,
      wine: wine._id,
      wineLot: wine.lot,  
      wineVintage: wine.vintage,  

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

// create grape lab
router.post('/grapeLab', auth, async (req, res) => {

  try {
    const data = req.body

    // verify if at leas one of these value is present and not null: sugars, pH, tAcids
    if (!data.alcohol && !data.sugars && !data.pH && !data.tAcids ) {
      res.status(400).send({error: 'At least one value must be present.'})
      return
    }

     // find the grape
     const grape = await Grape.findOne({ _id: data.grape})


    const wineLab  = new GrapeLab({
      ...data,
      company: req.user.company._id,

      type: 'lab',
      date: data.date || new Date(),
      user: req.user._id,
      userName: req.user.name,
      grapeParcel: grape.parcel,
      grapeVariety: grape.variety, 

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

// get the labs and the tasks of a given wine
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
    .sort({ date: -1, seqNumber: -1 }) // Sort by "date" in descending order
    .limit(100) // Limit the results to 100
    .populate({path: 'subTasks'})
    .populate({path: 'grapeSubTasks'})
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

// get the labs and the tasks of a given grape
router.get('/history/grape/:id', auth, async (req, res) =>{

  const company = req.user.company._id
  const searchCriteria = {company, grape: req.params.id} 


  try {   
    
     // get the labs
     const labResults = await GrapeLab
     .find(searchCriteria)
     .sort({ date: -1 }) // Sort by "date" in descending order
     .limit(100) // Limit the results to 100
     .lean()
     .exec()

     // get the subTasks
    const subTaskResults = await GrapeSubTask
    .find(searchCriteria)
    .sort({ date: -1 }) // Sort by "date" in descending order
    .limit(100) // Limit the results to 100
    .lean()
    .exec()
    
        
    res.send([...labResults, ...subTaskResults])
  } catch(e) {    
    res.status(500).send()
    console.log(e)
  } 
})

// delete wineLab by id
router.delete('/wineLab/:id', auth, async (req, res) => {
  const _id = req.params.id
  const company = req.user.company._id
  const searchCriteria = {company, _id}

  try {
    const wineLab = await WineLab.findOne(searchCriteria)

    // If does not exist, return a 404 error
    if (!wineLab) {
      res.status(404).send()
      return
    }

    await wineLab.deleteOne({ _id })
    res.send(wineLab)
  } catch(e) {
    res.status(500).send()
    console.error(e)
  }
})

// delete grapeLab by id
router.delete('/grapeLab/:id', auth, async (req, res) => {
  const _id = req.params.id
  const company = req.user.company._id
  const searchCriteria = {company, _id}

  try {
    const grapeLab = await GrapeLab.findOne(searchCriteria)

    // If does not exist, return a 404 error
    if (!grapeLab) {
      res.status(404).send()
      return
    }

    await grapeLab.deleteOne({ _id })
    res.send(grapeLab)
  } catch(e) {
    res.status(500).send()
    console.error(e)
  }
})

// get wine task
router.get('/wineTask/:id', auth, async (req, res) => {

  const _id = req.params.id
  const company = req.user.company._id
  const searchCriteria = {company, _id}

  try {
    const wineTask = await WineTask
    .findOne(searchCriteria)
    .populate({path: 'subTasks'})
    .populate({path: 'grapeSubTasks'})
    .lean()
    .exec()

    res.send(wineTask)
    
  } catch(e) {
    res.status(500).send()
  } 

})

// delete wineTask by id
router.delete('/wineTask/:id', auth, async (req, res) => {
  const _id = req.params.id
  const company = req.user.company._id
  const searchCriteria = {company, _id}

  try {
    // find the task
    const task = await WineTask.findOne(searchCriteria)
    if (!task) {
      res.status(404).send({'error': 'Task not found'})
      return
    }    

    // find the wine
    const wine = await Wine.findOne({ _id: task.wine, company: req.user.company._id})
    if (!wine) {
      res.status(404).send({'error': 'Wine not found'})
      return
    }

    // find the last tasks of the wine
    const lastTackCheck = await isLastTask(wine, task.seqNumber)

    // reject the request if the task is not the last one
    if (!lastTackCheck) {
      res.status(400).send({'error': 'Cannot delete a task that is not the last one'})
      return
    }

    if (wineTaskSimpleTypes.includes(task.type)) {

      await task.deleteOne({ _id })
      res.send(task)
      return

    } else if (task.type === 'transfer') {

      // change the vessel of the wine
      wine.vessel = task.vessel;
      await wine.save()

      // delete the task
      await task.deleteOne({ _id: task._id })
      res.send(task)
      return

    } else if (task.type === 'additive') { 

      // find the sub tasks
      const subTasks = await WineSubTask.find({wineTask: task._id, company: req.user.company._id})
      if (!subTasks) {
        res.status(404).send({'error': 'subTasks not found'})
        return
      }

      // iterate again to take actions
      for (const subTask of subTasks) {

        // find the additive
        const additive = await Additive.findOne({ _id: subTask.additive, company: req.user.company._id})
        if (!additive) {return res.status(404).send({'error': 'Additive not found'})}

        // restore the quantity
        const newQuantity = additive.quantity + subTask.quantity
        additive.quantity = Math.round(newQuantity * 1000) / 1000
        // additive.quantity += subTask.quantity

        await additive.save()

        // delete the subTasks
        await WineSubTask.deleteOne({ _id: subTask._id })

      }      

      // // delete the subTasks
      // await WineSubTask.deleteMany({wineTask: task._id, company: req.user.company._id})

      // delete the task
      await task.deleteOne({ _id: task._id })
      res.send(task)
      return

      // in the future, if we track the quantity of the additives, should restore the quantity

    } else if (task.type === 'split-from') {

    // find the subTask
    const subTask = await WineSubTask.findOne({wineTask: task._id, company: req.user.company._id})
    if (!subTask) {
      res.status(404).send({'error': 'subTask not found'})
      return
    }
    
    // find the next wine
    const nextWine = await Wine.findOne({ _id: subTask.wine, company: req.user.company._id})
    if (!nextWine) {
      res.status(404).send({'error': 'nextWine wine not found'})
      return
    }
      
    // find the last tasks of the nextWine
    const lastTackCheck = await isLastTask(nextWine, task.seqNumber)
    if (!lastTackCheck) {
      res.status(400).send({'error': 'Cannot delete a task that is not the last one of the nextWine wine'})
      return
    }

    // restore the quantity of the wine
    wine.quantity = task.quantityBefore
    await wine.save()

    // delete the nextWine wine
    await nextWine.deleteOne({ _id: nextWine.id })

    // delete the subtask
    await subTask.deleteOne({ _id: subTask.id })
    
    // delete the task
    await task.deleteOne({ _id: task._id })
    res.send(task)      
    return

    } else if (task.type === 'blend') {

    // find the sub tasks
    const subTasks = await WineSubTask.find({wineTask: task._id, company: req.user.company._id})
    if (!subTasks) {
      res.status(404).send({'error': 'subTasks not found'})
      return
    }

    // iterate over the subTasks to validate if they have other tasks after the one being deleted
    for (const subTask of subTasks) {
      // find the parent wine
      const parentWine = await Wine.findOne({ _id: subTask.wine, company: req.user.company._id})
      if (!parentWine) {  
        res.status(404).send({'error': 'Parent wine not found'})
        return
      }
      
      // find the last tasks of the parentWine
      const lastTackCheck = await isLastTask(parentWine, task.seqNumber)
      if (!lastTackCheck) {
        res.status(400).send({'error': 'Cannot delete a task that is not the last one of the parent wine'})
        return
      }
    }

    // iterate again to take actions
    for (const subTask of subTasks) {
      // find the parent wine
      const parentWine = await Wine.findOne({ _id: subTask.wine, company: req.user.company._id})
      if (!parentWine) {  
        res.status(404).send({'error': 'Parent wine not found'})
        return
      }      
      // restore the quantity of the parent wine
      parentWine.quantity = subTask.quantityBefore

      // un-archive the source wine if it was archived
      parentWine.archived = false
      
      // restore the vessel of the source wine if it was archived
      parentWine.vessel = subTask.vessel

      // save the modifications
      await parentWine.save()

      
    }
    
    // delete the subtasks
    await WineSubTask.deleteMany({ wineTask: task._id })        

    // restore the quantity of the wine
    wine.quantity = task.quantityBefore
    await wine.save()

    // delete the task
    await task.deleteOne({ _id: task._id })

    // send and exit
    res.send(task)      
    return

    
    } else if (task.type === 'vinification') {

    // find the sub tasks
    const subTasks = await GrapeSubTask.find({wineTask: task._id, company: req.user.company._id})
    if (!subTasks) {
      res.status(404).send({'error': 'subTasks not found'})
      return
    }

    
    // delete the subtasks
    await GrapeSubTask.deleteMany({ wineTask: task._id })        

    // restore the quantity of the wine
    wine.quantity = task.quantityBefore
    await wine.save()

    // delete the task
    await task.deleteOne({ _id: task._id })

    // send and exit
    res.send(task)      
    return

    } else {
      res.status(400).send({'error': 'Unknown task type'})
      return
    }


  } catch(e) {
    res.status(500).send()
    console.error(e)
  }
})

// get additives report
router.get('/additive/report', auth, async (req, res) => {

const { accounting, dateFrom, dateTo } = req.query;  // Get query parameters

const searchCriteria = {
  company: req.user.company._id,
  type: "additive",
}

if (accounting) {
  searchCriteria.$or = [
    { refWineAccounting: accounting },
    { additiveAccounting: accounting }
  ];
}

if (dateFrom && dateTo) {
  searchCriteria.date = {
    $gte: new Date(dateFrom),  // Greater than or equal to dateFrom
    $lte: new Date(dateTo)     // Less than or equal to dateTo
  };
} else if (dateFrom) {
  searchCriteria.date = { $gte: new Date(dateFrom) };  // Only filter on dateFrom
} else if (dateTo) {
  searchCriteria.date = { $lte: new Date(dateTo) };  // Only filter on dateTo
}

// console.log("searchCriteria", searchCriteria)

  try {

    const results = await WineSubTask
    .find(searchCriteria)
    .sort({ date: -1 }) // Sort by "date" in descending order
    .limit(3000) // Limit the results
    .lean()
    .exec()

    res.send(results)
    
  } catch(e) {
    res.status(500).send()
  } 

})

const isLastTask = async (wine, taskNumber) => {
  const lastTask  = await WineTask.findOne({wine: wine._id}).sort({number: -1}).exec()
  const lastTaskNumber = lastTask ? lastTask.seqNumber : null

  const lastSubTask  = await WineSubTask.findOne({wine: wine._id}).sort({number: -1}).exec()
  const lastSubTaskNumber = lastSubTask ? lastSubTask.seqNumber : null  

  if (lastTaskNumber > taskNumber || lastSubTaskNumber > taskNumber) {
    return false
  } else {
    return true
  }


}



module.exports = router