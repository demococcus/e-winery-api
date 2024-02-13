const express = require('express')
const cors = require('cors');
require('./db/mongoose')

const healthRouter = require('./routers/health')
const userRouter = require('./routers/user')
const vesselRouter = require('./routers/vessel')
const wineRouter = require('./routers/wine')
const eventRouter = require('./routers/event')

const app = express()
const port = process.env.PORT || 3001

// TODO enable it only for localhost and the frontend app
app.use(cors()); // Enable CORS for all routes


// app.use((req, res, next) => {
//     res.status(503).send('The server is under maintenance. Please try again later.')
// })


app.use(express.json())


app.use(express.static('public'));

app.get('', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
});
app.use(healthRouter)
app.use(userRouter)
app.use(vesselRouter)
app.use(wineRouter)
app.use(eventRouter)
app.use(eventRouter)



// Start the server

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})