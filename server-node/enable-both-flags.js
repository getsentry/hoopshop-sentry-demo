// Script to enable both SITE_RELAUNCH and BACKEND_V2 flags for demo
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'flags.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database", err.message);
    process.exit(1);
  }
  
  console.log("Connected to the SQLite database.");
  
  // Begin transaction
  db.run("BEGIN TRANSACTION;", (err) => {
    if (err) {
      console.error("Error starting transaction:", err.message);
      db.close();
      return;
    }
    
    // Update both flags to true, ensure other flags have proper values
    db.run(`
      UPDATE flags 
      SET defaultValue = CASE 
        WHEN name = 'SITE_RELAUNCH' THEN 1 
        WHEN name = 'BACKEND_V2' THEN 1
        WHEN name = 'STORE_CHECKOUT_ENABLED' THEN 1
        WHEN name = 'MAIN_STORE' THEN 0
        ELSE defaultValue 
      END
    `, (err) => {
      if (err) {
        console.error("Error updating flags:", err.message);
        db.run("ROLLBACK;");
        db.close();
        return;
      }
      
      // Commit changes
      db.run("COMMIT;", (err) => {
        if (err) {
          console.error("Error committing transaction:", err.message);
          db.run("ROLLBACK;");
          db.close();
          return;
        }
        
        console.log("SITE_RELAUNCH and BACKEND_V2 flags enabled.");
        
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
  });
});