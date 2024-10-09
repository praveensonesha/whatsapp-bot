const dbConfig = require('../../config/db.js'); 
const mysql = require('mysql2/promise');
const fitnessCoachPool = mysql.createPool(dbConfig.fitness_coach);
const cubeClubPool = mysql.createPool(dbConfig.cube_club);

const updateProfileService = async (payload) => {
    const {name,phone,email,age,goal,diet} = payload;
    console.log(name,phone,email,age,goal,diet);
    try {
        const query = `
        INSERT INTO users (name, phone, email, age, goal, diet)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          phone = VALUES(phone),
          age = VALUES(age),
          goal = VALUES(goal),
          diet = VALUES(diet);
        `;
  
        // Execute the query
        await fitnessCoachPool .query(query, [name, phone, email, age, goal, diet]);
        return {"message":"Profile updated !"};
        
    } catch (error) {
        console.error("Error in signUpUserService:", error);
        throw error;
    }
};

const logWorkoutService = async (payload) => {
   const { phone,description} = payload;
   const phone1 = phone[0];
   const payld = {phone:phone1,description:description};
   console.log(JSON.stringify(payld));
    try {
        const [[result]] = await fitnessCoachPool .query(`CALL handleMomentum(?)`,[JSON.stringify(payld)]);
        console.log(result);
    
        return {"message": `Workout logged !\nYour Momentum Score : ${result[0].momentum} 🚀🚀\nStreak: ${result[0].streak} ⚡`};
        
    } catch (error) {
        console.error("Error in signUpUserService:", error);
        throw error;
    }
};

const generateReportService = async(payload)=>{
    const { phone} = payload;
    console.log('agye')
    try {
        const query = `
    SELECT u.*,COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'description', w.description,
            'workout_date', w.workout_date
          )
        ), 
        JSON_ARRAY()
      ) AS workouts
    FROM users u
    LEFT JOIN workout w ON w.phone = u.phone
    WHERE u.phone = ? 
    GROUP BY u.id;
  `;
    const result=  await fitnessCoachPool .query(query, [phone]);
    console.log(result);
    return result;
        
    } catch (error) {
        console.error("Error in signUpUserService:", error);
        throw error;
    }
    
}

const userQueryService = async(payload)=>{
  const { phone} = payload;
  try {
      const query = `
      SELECT 
      u.*, 
        IFNULL(
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'description', w.description,
              'workout_date', w.workout_date
            )
          ), 
          JSON_ARRAY()  -- Return an empty JSON array if no workouts are found
        ) AS workouts
      FROM users u 
      LEFT JOIN workout w ON w.phone = u.phone
      AND w.workout_date >= CURDATE() - INTERVAL 7 DAY
      WHERE u.phone = ?
      GROUP BY u.id;
          `;
  const result=  await fitnessCoachPool .query(query, [phone]);
  console.log(result);
  return result;
      
  } catch (error) {
      console.error("Error in userQueryService:", error);
      throw error;
  }
  
}

const qnaDocQueryService = async(payload)=>{
  const { phone} = payload;
  try {
      const query = `
      SELECT 
      u.*, 
        IFNULL(
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'description', w.description,
              'workout_date', w.workout_date
            )
          ), 
          JSON_ARRAY()  -- Return an empty JSON array if no workouts are found
        ) AS workouts
      FROM users u 
      LEFT JOIN workout w ON w.phone = u.phone
      AND w.workout_date >= CURDATE() - INTERVAL 7 DAY
      WHERE u.phone = ?
      GROUP BY u.id;
          `;
  const result=  await fitnessCoachPool .query(query, [phone]);
  console.log(result);
  return result;
      
  } catch (error) {
      console.error("Error in userQueryService:", error);
      throw error;
  }
  
}

const checkCoinsService = async (payload) => {
  const { phone } = payload;

  try {
      // Query to retrieve coins for the user
      const query = `
        SELECT total_coins 
        FROM users 
        WHERE mobile  = ?
      `;
      
      // Execute the query
      const [[result]] = await cubeClubPool.query(query, [phone]);
      
      if (result) {
          console.log(`Coins for user: ${result.total_coins}`);
          return { "message": `You have ${result.total_coins} coins 🪙` };
      } else {
                return { "message": "User not found" };
      }
      
  } catch (error) {
      console.error("Error in checkCoinsService:", error);
      throw error;
  }
};

const getLeaderboardService = async (mobile) => {
  try {
      // Query to get user ID from mobile
      const userIdQuery = `  SELECT id, first_name 
                            FROM users 
                            WHERE mobile LIKE CONCAT('%', RIGHT(?, 10))`; // Fetch first_name as well
      const [[user]] = await cubeClubPool.query(userIdQuery, [mobile]);

      if (!user) {
          return { success: false, message: "User not found" };
      }

      const userId = user.id;
      

      // Prepare input for the stored procedure
      const inputJson = JSON.stringify({ user_id: userId, size: 10, page: 0 });

      // Call the stored procedure for leaderboard stats
      const leaderboardQuery = `CALL CubeClub_Stag.getLeaderboardStats(?)`;
      const [leaderboardData] = await cubeClubPool.query(leaderboardQuery, [inputJson]);

      // Get the total number of records
      const totalRecords = leaderboardData[1][0].total;

      // Find the rank of the user
      const userRank = leaderboardData[0].findIndex(user => user.user_id === userId) + 1; // Rank is index + 1

      // Find the logged-in user's total coins and name from leaderboard data
      const loggedInUserData = leaderboardData[0].find(user => user.user_id === userId);
      const userCoins = loggedInUserData ? loggedInUserData.total_coins : 0;
      // const userName = loggedInUserData ? loggedInUserData.first_name : "Unknown";
      const userName = user.first_name || "Unknown";

      // Construct the formatted leaderboard string
      let leaderboardString = `✨ *Your Rank*: ${userRank > 0 ? userRank : "Not ranked"}\n`;
      leaderboardString += `👤 *Name*: ${userName}\n`;
      leaderboardString += `💰 *Total Coins*: ${userCoins}🪙\n\n`;

      leaderboardString += `📊  *Top 10 Leaderboard*  📊\n\n`;

      leaderboardData[0].slice(0, 9).forEach((user, index) => {
        const rank = index + 1; // Calculate the rank
        leaderboardString += `${rank}️⃣ *Name*: ${user.first_name}\n 🎖️ *Coins* : ${user.total_coins}🪙\n\n`;
      });

      // Ensure to handle the case for rank 10 separately if needed
      if (leaderboardData[0].length >= 10) {
        leaderboardString += `🔟 *Name*: ${leaderboardData[0][9].first_name}\n  🎖️ *Coins* : ${leaderboardData[0][9].total_coins} 🪙\n\n`;
      }

      leaderboardString += `💪 Keep pushing! Your hard work will pay off! 🚀`;

      return {
          success: true,
          message: "Leaderboard Data",
          leaderboard: leaderboardString, // Add the formatted string to the response
          totalUsers: totalRecords,
      };

  } catch (error) {
      console.error("Error in getLeaderboardByMobile:", error);
      throw error; // Re-throw the error to be caught in the controller
  }
};

const getActiveScoreService = async (mobile) => {
  try {
      // Query to get user details from mobile
      const userQuery = `
          SELECT id, first_name, active_score 
          FROM users 
          WHERE mobile LIKE CONCAT('%', RIGHT(?, 10))
      `;
      const [[user]] = await cubeClubPool.query(userQuery, [mobile]);

      if (!user) {
          return { success: false, message: "User not found" };
      }

      const { first_name, active_score } = user;

      // Construct the response message
      let responseMessage = `✨ *Hello ${first_name}*, here’s your Active Score: `;

      // Check if active_score is a valid number
      if (active_score !== null && !isNaN(active_score)) {
          // Convert active_score to a number if it is a string
          const score = Number(active_score);
          responseMessage += `${parseFloat(score).toString()} % \n`;  // Remove unnecessary zeros
          // Prepare motivational message based on the score range
          if (score >= 90) {
              responseMessage += `🎉 Amazing work! You're really killing it! Keep it up! 💪`;
          } else if (score >= 70) {
              responseMessage += `🔥 Great job! You're on fire! Just a little more effort to reach the top! 🚀`;
          } else if (score >= 50) {
              responseMessage += `💪 Good work! You're doing well, but there’s still room for improvement! Let's push harder!`;
          } else {
              responseMessage += `🤔 You can do better! Let’s get moving and boost that score! Every workout counts! 🏋️‍♂️`;
          }
      } else {
          responseMessage += `Not available. It seems you haven't posted any workouts yet. Let's get started and boost that score! 🏃‍♂️💨`;
      }

      return {
          success: true,
          message: "Active Score Data",
          activeScore: responseMessage,
      };

  } catch (error) {
      console.error("Error in getActiveScoreService:", error);
      throw error; 
  }
};


module.exports = { updateProfileService,logWorkoutService,generateReportService,userQueryService,qnaDocQueryService,checkCoinsService,getLeaderboardService,getActiveScoreService};
