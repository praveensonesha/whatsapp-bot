const express = require('express');
const router = express.Router();

// Import controllers
const {updateProfile,logWorkout,generateReport,userQuery,qnaDocQuery,checkCoins,getLeaderboard,getActiveScore} = require('../controllers/userController.js');


// Define user routes
router.post('/updateProfile',updateProfile);
router.post('/logWorkout',logWorkout);
router.post('/generateReport',generateReport);
router.post('/userQuery',userQuery);
router.post('/qnaDocQuery',qnaDocQuery);

//cube club v2 requirements
router.post('/checkCoins',checkCoins);
router.post('/leaderBoard',getLeaderboard);
router.post('/activeScore',getActiveScore);




module.exports = router;
