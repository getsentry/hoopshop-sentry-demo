// Script to remove obsolete feature flags from the database
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'flags.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database", err.message);
    process.exit(1);
  }
  
  console.log("Connected to the SQLite database.");
  
  // List of flags to keep
  const flagsToKeep = [
    'STORE_CHECKOUT_ENABLED',
    'MAIN_STORE',
    'SITE_RELAUNCH',
    'BACKEND_V2'
  ];
  
  const flagsInClause = flagsToKeep.map(flag => `'${flag}'`).join(', ');
  
  // Begin transaction
  db.run("BEGIN TRANSACTION;", (err) => {
    if (err) {
      console.error("Error starting transaction:", err.message);
      db.close();
      return;
    }
    
    // First get the list of flags to be deleted for logging
    db.all(`SELECT name FROM flags WHERE name NOT IN (${flagsInClause})`, [], (err, rows) => {
      if (err) {
        console.error("Error querying flags to be deleted:", err.message);
        db.run("ROLLBACK;");
        db.close();
        return;
      }
      
      if (rows.length === 0) {
        console.log("No obsolete flags found. Database is already clean.");
        db.run("COMMIT;");
        showCurrentFlags();
        return;
      }
      
      console.log("Found the following obsolete flags to delete:");
      rows.forEach(row => console.log(`- ${row.name}`));
      
      // Now delete the obsolete flags
      db.run(`DELETE FROM flags WHERE name NOT IN (${flagsInClause})`, (err) => {
        if (err) {
          console.error("Error deleting obsolete flags:", err.message);
          db.run("ROLLBACK;");
          db.close();
          return;
        }
        
        console.log(`Successfully deleted ${rows.length} obsolete flags.`);
        db.run("COMMIT;");
        showCurrentFlags();
      });
    });
  });
  
  function showCurrentFlags() {
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