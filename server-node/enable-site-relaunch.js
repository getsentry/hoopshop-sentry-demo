// Script to enable the SITE_RELAUNCH flag for demo
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'flags.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database", err.message);
    process.exit(1);
  }
  
  console.log("Connected to the SQLite database.");
  
  // Update SITE_RELAUNCH flag to true, make sure other flags are in proper state
  db.run(`
    UPDATE flags 
    SET defaultValue = CASE 
      WHEN name = 'SITE_RELAUNCH' THEN 1 
      WHEN name = 'BACKEND_V2' THEN 0
      WHEN name = 'STORE_CHECKOUT_ENABLED' THEN 1
      WHEN name = 'MAIN_STORE' THEN 0
      ELSE defaultValue 
    END
  `, (err) => {
    if (err) {
      console.error("Error updating SITE_RELAUNCH flag:", err.message);
      db.close();
      return;
    }
    
    console.log("SITE_RELAUNCH flag enabled.");
    
    // Query all flags to see the current state
    db.all("SELECT name, defaultValue FROM flags", [], (err, rows) => {
      if (err) {
        console.error("Error querying flags", err.message);
      } else {
        console.log("\nCurrent flags in database:");
        rows.forEach(row => {
          console.log(`- ${row.name}: ${Boolean(row.defaultValue)}`);
        });
      }
      
      // Close the database
      db.close(err => {
        if (err) {
          console.error("Error closing database", err.message);
        } else {
          console.log("Database connection closed.");
        }
      });
    });
  });
});