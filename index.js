const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config(); 
require('./cron/nudgeReminder'); 
require('./cron/fitnessPlan'); 
require('./cron/fetchProducts');
require('./cron/botIntroduction');
// require('./cron/serverActive');


const userRoutes = require('./src/routes/userRoutes');

const app = express();
const port = 3000;

app.use(bodyParser.json());


app.get('/',(req,res)=>{
    res.send('hello world');
})
app.use('/api/users', userRoutes);


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});