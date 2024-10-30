const cron = require("node-cron");
const axios = require("axios");
const mysql = require("mysql2/promise");
const dbConfig = require("../config/db");

const cubeClubPool = mysql.createPool(dbConfig.cube_club);

const GALLABOX_API_URL = "https://server.gallabox.com/devapi/messages/whatsapp";
const GALLABOX_API_KEY = process.env.WAAPIKEY;
const GALLABOX_API_SECRET = process.env.WAAPISECRET;
const INTRO_TEMPLATE = "bot_introduction"; // Gallabox template for bot introduction

// Function to format phone numbers
function formatPhoneNumber(phoneNumber) {
  phoneNumber = phoneNumber.replace(/\D/g, "");
  if (phoneNumber.length !== 10) {
    throw new Error("Invalid phone number: must be exactly 10 digits.");
  }
  return `91${phoneNumber}`;
}

// Function to send WhatsApp bot introduction
async function sendBotIntroduction(phone, name) {
  try {
    const payloaddata = {
      channelId: "628ce04877212400045f14d5",
      channelType: "whatsapp",
      recipient: {
        name: name,
        phone: phone,
      },
      whatsapp: {
        type: "template",
        template: {
          templateName: INTRO_TEMPLATE,
          bodyValues: {
            name: name
          }
        }
      }
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

    await axios(options);
    console.log(`Bot introduction sent to ${phone}`);
  } catch (error) {
    console.error(`Failed to send bot introduction to ${phone}:`, error);
  }
}

// Function to check invoices and send bot introductions
async function checkAndSendIntroductions() {
  console.log("Running bot introduction job...");

  try {
    const [newUsers] = await cubeClubPool.query(`
      SELECT u.id, u.first_name, u.mobile
      FROM users u
      JOIN (
        SELECT user_id
        FROM customer_invoices
        GROUP BY user_id
        HAVING COUNT(user_id) = 1
      ) ci ON u.id = ci.user_id
      WHERE u.is_introduced = 0
    `);

    for (const user of newUsers) {
      const formattedPhone = formatPhoneNumber(user.mobile);

      await sendBotIntroduction(formattedPhone, user.first_name);

      // Update the user's introduction status
      await cubeClubPool.query(
        `UPDATE users SET is_introduced = 1 WHERE id = ?`,
        [user.id]
      );
    }
  } catch (error) {
    console.error("Error running bot introduction job:", error);
  }
}

// Cron job to run 4-5 times daily
cron.schedule("0 8,12,16,20 * * *", checkAndSendIntroductions);


// // Cron job to run every minute for testing
// cron.schedule("*/1 * * * *", checkAndSendIntroductions);
