// Script to update the flags database with new flags
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'flags.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database", err.message);
    process.exit(1);
  }
  
  console.log("Connected to the SQLite database.");
  
  // Define the new flags to add
  const newFlags = [
    { name: 'SITE_RELAUNCH', defaultValue: false },
    { name: 'BACKEND_V2', defaultValue: false }
  ];
  
  // Insert each flag using INSERT OR IGNORE
  const insertStmt = db.prepare("INSERT OR IGNORE INTO flags (name, defaultValue) VALUES (?, ?)");
  
  newFlags.forEach(flag => {
    insertStmt.run(flag.name, flag.defaultValue ? 1 : 0, (err) => {
      if (err) {
        console.error(`Error inserting flag ${flag.name}:`, err.message);
      } else {
        console.log(`Flag ${flag.name} added or already exists.`);
      }
    });
  });
  
  // Finalize and check current state
  insertStmt.finalize((err) => {
    if (err) {
      console.error("Error finalizing insert statement", err.message);
    } else {
      console.log("Flag updates complete.");
      
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