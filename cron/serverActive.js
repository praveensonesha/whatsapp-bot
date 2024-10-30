const axios = require('axios');
const cron = require('node-cron');

//Cron job for keeping server active is set up to run every 5 minutes.


const renderServerUrl = 'https://whatsapp-bot-34gt.onrender.com';
// Function to ping the server
const keepServerActive = async () => {
  try {
    // Send a GET request to your Render server URL
    const response = await axios.get(renderServerUrl);
    console.log(`Server pinged successfully at ${new Date().toISOString()}:`, response.status);
  } catch (error) {
    console.error('Error pinging server:', error.message);
  }
};

// Schedule the keepServerActive function to run every 5 minutes
cron.schedule('*/5 * * * *', () => {
  keepServerActive();
});
