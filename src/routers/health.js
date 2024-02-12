const express = require('express')
const Health = require('../models/health')
const auth = require('../middleware/auth')
const router = new express.Router()


router.get('/health', async (req, res) => {

  res.send({health: 'OK'})

})

router.get('/health-db', async (req, res) => {

  try {
      const health = await Health.findOne({ category: 1})

      if (!health) {
          res.status(404).send()
          return
      } 
      res.send(health)
  } catch(e) {
      res.status(500).send()
  }
  
})



module.exports = router