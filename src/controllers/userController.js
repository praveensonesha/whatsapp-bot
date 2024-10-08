const { fitnessCoachPool } = require('../../config/db.js');
const {updateProfileService,logWorkoutService, generateReportService,userQueryService,qnaDocQueryService,checkCoinsService,getLeaderboardService,getActiveScoreService} = require('../services/userService.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
const { ChromaClient } = require('chromadb');

const updateProfile = async(req,res)=>{
    console.log('server call works!');
    const payload = req.body;
    const {name,phone,email,age,goal,diet} = payload;
    console.log(name,phone,email,age,goal,diet);
    try {
        const result = await updateProfileService(payload);
        return res.status(200).send(result);
    } catch (error) {
        console.log(error)
        res.status(500).send({
           success:false,
           message:'Error in signup',
           error ,
        });
        
    }
}

const logWorkout = async(req,res)=>{
    console.log('server call works!');
    const payload = req.body;
    const {phone,description} = payload;
    console.log(phone,description);
    try {
        const result = await logWorkoutService(payload);
        return res.status(200).send(result);
    } catch (error) {
        console.log(error)
        res.status(500).send({
           success:false,
           message:'Error in logging workout ! Please try again...',
           error ,
        });
        
    }
}

const generateReport = async(req,res)=>{
    console.log('server call works!');
    const payload = req.body;
    const {phone} = payload;
    console.log(phone);
    try {
        // Execute the query
        const [[result]] = await generateReportService(payload);
        //gemini call
        if(result.workouts[0].description==null && result.workouts[0].workout_date==null){
            res.status(200).send('Log Workouts to generate reports !😁');
        }
        else if(result.name==undefined|| result.name==null|| result.name==""){
            res.status(200).send('Please complete your profile first !');
        }
        else{
        const prompt = `User details: name & age:${result.name, result.age},goal:${result.goal},diet pref:${result.diet}.workouts history:${JSON.stringify(result.workouts)}.prepare a statistical report for this report considering his workout history so that he gets and overview of what he has done. Give only bold not tabular data.`
        console.log(prompt);
        const report = await model.generateContent(prompt);
        console.log("text",report.response.text);
        

        res.status(200).send(report.response.text());
        }
    } catch (error) {
        console.error('Error querying the database:', error);
        console.log(error)
            res.status(500).send({
            success:false,
            message:'Error in logging workout ! Please try again...',
            error ,
            });
    }
    
}

const userQuery = async(req,res)=>{
    const payload = req.body;
    const {phone,query} = payload;
    console.log(phone);
    try {
        // Execute the query
        const [[result]] = await userQueryService(payload);
        //gemini call
        console.log(result);
        if(!result.name)res.status(200).send('Complete your profile first !');
        const prompt = `User details: name & age:${result.name, result.age},goal:${result.goal},diet pref:${result.diet},equipments:${result.products}.workouts history:${JSON.stringify(result.workouts)}.Answer the user's query based on his profile. Query: ${query}`
        console.log(prompt);
        const report = await model.generateContent(prompt);
        console.log("text",report.response.text);
        

        res.status(200).send(report.response.text());
    } catch (error) {
        console.error('Error querying the database:', error);
        console.log(error)
            res.status(500).send({
            success:false,
            message:'Error in userQuery',
            error ,
            });
    }
    
}

const qnaDocQuery = async(req,res)=>{
    const payload = req.body;
    const {phone,query} = payload;
    console.log(phone);
    try {
        // Execute the query
        const client = new ChromaClient({ path: "https://chroma-latest-gzr9.onrender.com" });
        const collection = await client.getOrCreateCollection({
            name: "my_collection",
        });
      
        const results = await collection.query({
            queryTexts: [`${query}`], // Chroma will embed this for you
            // queryTexts: ["Will the products be safe to use?"], // Chroma will embed this for you
            nResults: 4, // How many results to return
        });
      
        console.log(results.documents);
        const prompt = `RAG for my pdf doc returns following documents from the pdf.Document:${results.documents}this is the user query. Query: ${query}.according to the documents returned construct a sentence with whole context in human language rewrite the sentence.`
        console.log(prompt);
        const report = await model.generateContent(prompt);
        console.log("text",report.response.text);
        

        res.status(200).send(report.response.text());

       
    } catch (error) {
        console.error('Error querying the database:', error);
        console.log(error)
            res.status(500).send({
            success:false,
            message:'Error in userQuery',
            error ,
            });
    }
    
}

const checkCoins = async(req,res)=>{
    console.log('server call works!');
    const payload = req.body;
    const {phone} = payload;
    console.log(phone);
    try {
        const result = await checkCoinsService(payload);
        return res.status(200).send(result);
    } catch (error) {
        console.log(error)
        res.status(500).send({
           success:false,
           message:'Error in checking the coins ! Please try again...',
           error ,
        });
        
    }
}

const getLeaderboard = async (req, res) => {
    const { mobile } = req.body;
     // Expecting mobile in the request body

    try {
        // Call the service to get leaderboard data
        const result = await getLeaderboardService(mobile);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getLeaderboard:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve leaderboard data",
            error: error.message,
        });
    }
};

const getActiveScore = async (req, res) => {
    const { mobile } = req.body;
     // Expecting mobile in the request body

    try {
        const result = await getActiveScoreService(mobile);
        // Log the user's name and active score for debugging
        if (result.success) {
            const activeScoreMatch = result.activeScore.match(/Hello (.*?),/);
            const userName = activeScoreMatch ? activeScoreMatch[1] : "User";
            console.log(`User: ${userName}, Active Score: ${result.activeScore}`);
        }
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching active score by mobile number:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error' ,
            error: error.message,
        });
    }
};


module.exports= {updateProfile,logWorkout,generateReport,userQuery,qnaDocQuery,checkCoins,getLeaderboard,getActiveScore};