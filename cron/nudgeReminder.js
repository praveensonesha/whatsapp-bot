const cron = require("node-cron");
const axios = require("axios");
const mysql = require("mysql2/promise");
const dbConfig = require("../config/db");

const cubeClubPool = mysql.createPool(dbConfig.cube_club);

const GALLABOX_API_URL = "https://server.gallabox.com/devapi/messages/whatsapp";
const GALLABOX_API_KEY = process.env.WAAPIKEY;
const GALLABOX_API_SECRET = process.env.WAAPISECRET;

// Function to format phone numbers
function formatPhoneNumber(phoneNumber) {
  // Remove non-digit characters
  phoneNumber = phoneNumber.replace(/\D/g, "");

  // Check if the phone number is exactly 10 digits
  if (phoneNumber.length !== 10) {
    throw new Error("Invalid phone number: must be exactly 10 digits.");
  }

  // Add +91 prefix to the number
  return `91${phoneNumber}`;
}

// Function to send WhatsApp reminders
async function sendWhatsAppReminder(phone, name, nudgeMessage) {
  try {
    const payloaddata = {
      channelId: "628ce04877212400045f14d5",
      channelType: "whatsapp",
      recipient: {
        name: name,
        phone: phone,
      },
      whatsapp: {
        type: "text",
        text: {
          body: nudgeMessage,
        },
      },
    };

    const options = {
      method: "POST",
      url: GALLABOX_API_URL,
      headers: {
        apiSecret: GALLABOX_API_SECRET,
        apiKey: GALLABOX_API_KEY,
        "Content-Type": "application/json",
      },
      data: JSON.stringify(payloaddata),
    };

    const result = await axios(options);
    console.log(`Reminder sent to ${phone}`);
  } catch (error) {
    console.error(`Failed to send reminder to ${phone}:`, error);
  }
}

// Function to check users and send nudges
async function sendNudges() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const formattedDate = yesterday.toISOString().split("T")[0];

  console.log("Bhai ye kal ka din hai ", formattedDate);

  console.log("Running daily workout reminder job...");

  try {
    // Query to find users who subscribed for nudges
    const [users] = await cubeClubPool.query(`
      SELECT u.id, u.first_name, u.mobile
      FROM users u
      WHERE u.nudge_request_subscription = 1
    `);

    for (const user of users) {
      // Check if the user made a post yesterday
      console.log("user id", user.id);
      const [postRows] = await cubeClubPool.query(
        `
        SELECT p.id
        FROM posts p
        WHERE p.user_id = ? AND DATE(p.created_at) = ?
      `,
        [user.id, formattedDate]
      );

      // Format the user's phone number
      const formattedPhone = formatPhoneNumber(user.mobile);

      let nudgeMessage;

      // Select motivational message based on post presence
      if (postRows.length > 0) {
        console.log("post length", postRows.length);
        
        // Fetch random motivational message for regular exercise
        const [messageRows] = await cubeClubPool.query(`
          SELECT nudge FROM motivational_messages 
          WHERE category = 'regular_exercise' 
          ORDER BY RAND() LIMIT 1
        `);
      
        const motivationalMessage =
          messageRows.length > 0 ? messageRows[0].nudge : "Keep up the great work!";
      
        // Regular exercise message template with string appending
        nudgeMessage = `💪 **Great job, ${user.first_name}! 🌟**\n\n`;
        nudgeMessage += `**${motivationalMessage}**\n\n`;
        nudgeMessage += `Let's make today another productive day! 🚀\n\n`;
        nudgeMessage += `🏆 *Note:* Keep exercising to maintain your milestones and earn rewards! 💰\n`;
        nudgeMessage += `Don't miss out on those coins! 🪙\n`;
        
      } else {
        console.log("post length", postRows.length);
      
        // Fetch random motivational message for no exercise
        const [messageRows] = await cubeClubPool.query(`
          SELECT nudge FROM motivational_messages 
          WHERE category = 'no_exercise' 
          ORDER BY RAND() LIMIT 1
        `);
      
        const motivationalMessage =
          messageRows.length > 0 ? messageRows[0].nudge : "You can do it!";
      
        // No exercise message template with string appending
        nudgeMessage = `😔 Hey **${user.first_name},**\n\n`;
        nudgeMessage += `Every journey begins with a single step. Let's take it today!\n\n`;
        nudgeMessage += `**${motivationalMessage}**\n\n`;
        nudgeMessage += `Today is a new opportunity to get moving! Remember, every step counts! 🏃‍♂️💨\n\n`;
        nudgeMessage += `⚠️ *Note:* If you skip exercising, you might lose out on your milestones and rewards! 🌟\n`;
        nudgeMessage += `Don't let that happen! Stay on track and keep pushing forward! 🚀\n`;
      }
      
      console.log("nudge message", nudgeMessage);

      await sendWhatsAppReminder(formattedPhone, user.first_name, nudgeMessage);
    }
  } catch (error) {
    console.error("Error running reminder job:", error);
  }
}

// Cron job to run daily at 8:00 AM
cron.schedule('0 8 * * *', sendNudges);

// Cron job to run every minute for testing
// cron.schedule("*/10 * * * * *", sendNudges);
