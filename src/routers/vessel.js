const express = require('express')
const Vessel = require('../models/vessel')
const auth = require('../middleware/auth')
const Wine = require('../models/wine')
const router = new express.Router()


// Get all vessels
router.get('/vessels', auth, async (req, res) => {

    // Read the query parameter 'type' and create a search criteria
    const company = req.user.company._id
    const searchCriteria = {company}   
    if (["barrel", "tank"].includes(req.query.type)) {
        searchCriteria.type = req.query.type
    }

   // Search the database for vessels
    try {
        const vessels = await Vessel
        .find(searchCriteria)
        .populate('wines', 'vintage lot quantity')
        .lean()
        .exec()


        // Iterate over each vessel and add a property 'status' to it
        vessels.forEach(vessel => {

            // Calculate the max capacity of the vessel                                                                                                 
            const totalCapacity = vessel.capacity * vessel.number

            // Calculate the total quantity of wine in the vessel

            if (vessel.wines.length === 0) {
                // No vines inside - must be empty
                vessel.status = 'empty'

            } else if (vessel.wines.length > 0) {
                // Calculate the volume of the wines inside the vessel
                usedCapacity = vessel.wines.reduce((acc, wine) => {
                    return acc + wine.quantity
                }, 0)

                vessel.usedCapacity = Math.round(usedCapacity);
                

                // Calculate the available volume in the vessel
                availableCapacity = totalCapacity - vessel.usedCapacity
     
                // Set the status of the vessel
                if (vessel.usedCapacity > totalCapacity) {
                    vessel.status = 'over-capacity'
                } else if (vessel.usedCapacity === totalCapacity) {
                    vessel.status = 'full'
                } else if (availableCapacity >= vessel.capacity) {
                    vessel.status = 'available'
                } else {
                    vessel.status = 'need-top-up'
                }              

            }
 
        })

        let filteredVessels = vessels

        if (req.query.status === "available") {
            // filter teh vessels to keep only the ones with status 'available' and 'empty'
            // vessels = vessels.filter(vessel => vessel.status === 'available' || vessel.status === 'empty')
            filteredVessels = vessels.filter(vessel => vessel.status === 'available' || vessel.status === 'empty')
        }
     
    
        res.send(filteredVessels)
    } catch(e) {    
        res.status(500).send()
    } 
})


// Get a vessel by id
router.get('/vessel/:id', auth, async (req, res) => {
    const _id = req.params.id  
    const company = req.user.company._id
    const searchCriteria = {company, _id}
    try {
      const vessel = await Vessel
      .findOne(searchCriteria)
      .populate('wines', 'vintage name')
      .lean()
      .exec()
      
      if (!vessel) {
          res.status(404).send()
          return
      } 
  
      res.send(vessel)
    } catch(e) {
      res.status(500).send()
    }    
})

// Create a new vessel
router.post('/vessel', auth, async (req, res) => {

    const vessel  = new Vessel(req.body)
    vessel.company = req.user.company._id
  
    try {
        await vessel.save()
        res.status(201).send(vessel)
    } catch(e) {
        res.status(400).send(e)
     }
  })


// Delete a vessel by id
router.delete('/vessel/:id', auth, async (req, res) => {
    const _id = req.params.id
    const company = req.user.company._id
    const searchCriteria = {company, _id}

    try {
        const vessel = await Vessel.findOne(searchCriteria)

        // Find wines that are linked to the vessel
        const wines = await Wine.find({ vessel: _id })

        // If the vessel does not exist, return a 404 error
        if (!vessel) {
            res.status(404).send()
            return
        }

        // If there are wines linked to the vessel, return a 400 error
        if (wines.length > 0) {
            res.status(400).send({ error: 'Cannot delete vessel with wines linked to it' })
            return
        }

        // Delete the vessel
        await vessel.deleteOne({ _id })     
        
        res.send(vessel)
    } catch(e) {
        res.status(500).send()
        console.error(e)
    }
})


module.exports = router