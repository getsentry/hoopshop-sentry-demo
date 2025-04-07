// Script to reset flags to a clean demo configuration
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'flags.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database", err.message);
    process.exit(1);
  }
  
  console.log("Connected to the SQLite database.");
  
  // Define the demo configuration
  const demoConfig = {
    'STORE_CHECKOUT_ENABLED': true,  // Legacy flag, maintained for compatibility
    'MAIN_STORE': false,             // Legacy flag, maintained for compatibility
    'SITE_RELAUNCH': false,          // Start with relaunch disabled
    'BACKEND_V2': false              // Start with backend v2 disabled
  };
  
  // Begin transaction
  db.run("BEGIN TRANSACTION;", (err) => {
    if (err) {
      console.error("Error starting transaction:", err.message);
      db.close();
      return;
    }
    
    // Update each flag
    const updateStmt = db.prepare("UPDATE flags SET defaultValue = ? WHERE name = ?");
    const flagEntries = Object.entries(demoConfig);
    let completed = 0;
    
    flagEntries.forEach(([name, value]) => {
      updateStmt.run(value ? 1 : 0, name, (err) => {
        if (err) {
          console.error(`Error updating flag ${name}:`, err.message);
        } else {
          console.log(`Flag ${name} set to ${value}.`);
        }
        
        completed++;
        if (completed === flagEntries.length) {
          // Finalize statement
          updateStmt.finalize((err) => {
            if (err) {
              console.error("Error finalizing statement:", err.message);
              db.run("ROLLBACK;");
              db.close();
              return;
            }
            
            // Commit changes
            db.run("COMMIT;", (err) => {
              if (err) {
                console.error("Error committing transaction:", err.message);
                db.run("ROLLBACK;");
              } else {
                console.log("Flag reset complete.");
                
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
              }
            });
          });
        }
      });
    });
  });
});