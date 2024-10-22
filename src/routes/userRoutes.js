const express = require('express');
const router = express.Router();
const {
    updateProfile,
    logWorkout,
    generateReport,
    userQuery,
    qnaDocQuery,
    checkCoins,
    getLeaderboard,
    getActiveScore,
    checkProfileCompletion, 
    botCommunityIntroduction, 
    requestNudgeSubscription,
    checkClubMembership,
    checkIfAdmin,
    clubActiveScore,
    clubLeaderboard
    
} = require('../controllers/userController.js');


// Define user routes
router.post('/updateProfile',updateProfile);
router.post('/logWorkout',logWorkout);
router.post('/generateReport',generateReport);
router.post('/userQuery',userQuery);
router.post('/qnaDocQuery',qnaDocQuery);


//cube club v2 requirements
router.post('/checkProfileCompletion',checkProfileCompletion);
router.post('/checkCoins',checkCoins);
router.post('/leaderBoard',getLeaderboard);
router.post('/activeScore',getActiveScore);
router.post('/botCommunityIntroduction', botCommunityIntroduction);
router.post('/requestNudgeSubscription', requestNudgeSubscription);
router.post('/checkClubMembership', checkClubMembership);
router.post('/checkIfAdmin', checkIfAdmin);
router.post('/clubActiveScore', clubActiveScore);
router.post('/clubLeaderboard', clubLeaderboard);



module.exports = router;
