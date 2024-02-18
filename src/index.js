const express = require('express')
const cors = require('cors');
require('./db/mongoose')

const healthRouter = require('./routers/health')
const historyRouter = require('./routers/history')
const userRouter = require('./routers/user')
const vesselRouter = require('./routers/vessel')
const wineRouter = require('./routers/wine')
const companyRouter = require('./routers/company')
const invitationRouter = require('./routers/invitation')
const additiveRouter = require('./routers/additive')


const app = express()
const port = process.env.PORT || 3001

// TODO enable it only for localhost and the frontend app
app.use(cors()); // Enable CORS for all routes


// app.use((req, res, next) => {
//     res.status(503).send('The server is under maintenance. Please try again later.')
// })


app.use(express.json())


app.use(express.static('public'));

app.get('', (req, res) => { res.sendFile('index.html', { root: 'public' });});
app.use(healthRouter)
app.use(historyRouter)
app.use(userRouter)
app.use(vesselRouter)
app.use(wineRouter)
app.use(wineRouter)
app.use(companyRouter)
app.use(invitationRouter)
app.use(additiveRouter)



// Start the server

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})