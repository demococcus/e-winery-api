const express = require('express')
const Event = require('../models/event')
const auth = require('../middleware/auth')
const router = new express.Router()
const Vessel = require('../models/vessel')
const Wine = require('../models/wine')
const Counter = require('../models/counter')


// Function to get the next sequence value
async function getNextSequenceValue(sequenceName) {
    const sequenceDocument = await Counter.findOneAndUpdate(
      { name: sequenceName },
      { $inc: { value: 1 } },
      { returnOriginal: false }
    );
    return sequenceDocument.value;
  }
 


router.get('/events', auth, async (req, res) =>{

    
    // If req.query.source is 'lab' or 'op' use it, otherwise use 'any'
    const source  = ["lab", "op"].includes(req.query.source) ? req.query.source : "any";

    // if req.query.resultsNumber is 90 or less, use it, otherwise use 30
    const resultsNumber = req.query.resultsNumber <= 90 ? req.query.resultsNumber : 30;

    // if source is 'any', the teh query empty, if the source is lab, find records with type 'lab', if the source is op, find records with type different than 'lab' and 'blend-out'
    const query = source === 'any' ? {} : source === 'lab' ? {type: 'lab'} : {type: {$nin: ['lab', 'blend-out']}};

    try {       
        const events = await Event
            .find(query)
            .sort({ date: -1 }) // Sort by "date" in descending order
            .limit(resultsNumber) // Limit the results
            .lean()
            .exec();
          
        res.send(events)
    } catch(e) {    
        res.status(500).send()


    } 
})


// Route that returns all the events that match a specific wine_id
router.get('/events/wine/:id', auth, async (req, res) => {
    const wineId = req.params.id

    
    try {
        const events = await Event
        .find({wine: wineId})
        .sort({ date: -1 }) // Sort by "date" in descending order
        .limit(100) // Limit the results
        .lean()
        .exec();
        
        res.send(events)
    } catch (e) {
        res.status(500).send()
    }
})


router.post('/event', auth, async (req, res) => {

    const data = req.body
   
    try {
        
        const serNo = await getNextSequenceValue('event_seq');
    
        
        // get the wine and the vessel
        const wine = await Wine.findOne({ _id: data.targetWine })
        await wine.populate({path: 'vessel', select: 'label'})
        const tankLabel = wine.vessel.label     
           
    
        const wineTag = `${wine.vintage} ${wine.lot}`
           
    
        const event  = new Event({
            serNo: serNo,
            type: data.type,
            tankLabel,
            wineTag,
            note: data.note,
            date: data.date,
            user: req.user.name,
            userId: req.user._id,
            wine: data.targetWine,
        })


        await event.save()
        res.status(201).send(event)
    } catch(e) {
        res.status(400).send(e)
        console.log(e)
     }
})


module.exports = router