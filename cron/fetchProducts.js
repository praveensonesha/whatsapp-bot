const cron = require('node-cron');
const mysql = require('mysql2/promise');
const dbConfig = require('../config/db'); 

// Create database pools
const fitnessCoachPool = mysql.createPool(dbConfig.fitness_coach);
const cubeClubPool = mysql.createPool(dbConfig.cube_club);

// Function to synchronize products
const syncProducts = async () => {
  let connectionUsers;
  let connectionInvoices;

  try {
    // Query to get products bought by each user
    const userQuery = `
      SELECT DISTINCT(phone) FROM users;
    `;
    
    // Fetch user phone numbers
    const [rows] = await fitnessCoachPool.query(userQuery);
    const normalizedPhones = rows.map(row => row.phone.slice(-10));
    const jsonPhones = JSON.stringify(normalizedPhones);
    
    console.log("Normalized phones:", normalizedPhones);
    console.log("JSON phones:", jsonPhones);

    // Query to fetch invoice data from the Cube Club database
    const invoiceQuery = `
      SELECT u.mobile, GROUP_CONCAT(pdc.product_name) AS products
      FROM customer_invoices ci
      LEFT JOIN users u ON u.id = ci.user_id
      LEFT JOIN product_details_cubeclub pdc ON pdc.ean_code = ci.ean_code
      WHERE JSON_CONTAINS(?, JSON_QUOTE(u.mobile))
      GROUP BY u.id;
    `;
    
    // Fetch invoice data
    const [invoiceRows] = await cubeClubPool.query(invoiceQuery, [jsonPhones]);
    console.log("Invoice rows:", invoiceRows);

    // Prepare and execute update queries
    const updatePromises = invoiceRows.map(async (user) => {
      const updateProductQuery = `
        UPDATE users
        SET products = ?
        WHERE phone = ?;
      `;
      // Use parameterized queries to prevent SQL injection
      await fitnessCoachPool.query(updateProductQuery, [user.products, `91${user.mobile}`]);
    });

    // Wait for all update queries to complete
    await Promise.all(updatePromises);

  } catch (err) {
    console.error("Error in syncProducts:", err);
  } 
};

// Schedule the cron job
// cron.schedule('*/10 * * * * *', () => {  // Runs every 10 seconds
cron.schedule('0 10 * * 0', () => {  // Runs every sunday
  console.log('Running synchronization');
  syncProducts();
});
