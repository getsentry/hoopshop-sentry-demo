require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose(); // Use verbose for better debugging
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Use port 3001 or environment variable

const SENTRY_WEBHOOK_URL = process.env.SENTRY_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.FEATURE_FLAG_WEBHOOK_SECRET;

// Log configuration details
console.log('=== SERVER CONFIGURATION ===');
console.log(`API Server Port: ${PORT}`);
console.log(`Sentry Webhook URL: ${SENTRY_WEBHOOK_URL}`);
console.log(`Webhook Secret Present: ${WEBHOOK_SECRET ? 'Yes' : 'No'}`);
console.log(`Webhook Secret Length: ${WEBHOOK_SECRET?.length || 0} characters`);
console.log('===========================');

// --- Database Setup ---
const dbPath = path.resolve(__dirname, 'flags.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database", err.message);
  } else {
    console.log("Connected to the SQLite database.");
    // Create table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS flags (
        name TEXT PRIMARY KEY,
        defaultValue BOOLEAN NOT NULL
    )`, (err) => {
      if (err) {
        console.error("Error creating table", err.message);
      } else {
        // Initialize default flags (idempotent)
        initializeDefaultFlags();
      }
    });
  }
});

// Define the default flags here (matches frontend initially)
const defaultFlagsConfig = {
  STORE_CHECKOUT_ENABLED: true, // Legacy flag, maintained for compatibility
  MAIN_STORE: false, // Legacy flag, maintained for compatibility
  SITE_RELAUNCH: false, // Neo-brutalism basketball theme (disabled by default)
  BACKEND_V2: false, // Required for checkout with SITE_RELAUNCH (disabled by default)
};

function initializeDefaultFlags() {
    const insertStmt = db.prepare(`INSERT OR IGNORE INTO flags (name, defaultValue) VALUES (?, ?)`);
    Object.entries(defaultFlagsConfig).forEach(([name, value]) => {
        insertStmt.run(name, value, (err) => {
            if (err) {
                console.error(`Error inserting flag ${name}:`, err.message);
            }
        });
    });
    insertStmt.finalize((err) => {
        if (err) {
            console.error("Error finalizing insert statement", err.message);
        } else {
            console.log("Default flags initialization complete.");
        }
    });
}
// --- End Database Setup ---

if (!WEBHOOK_SECRET) {
    console.error('FATAL ERROR: FEATURE_FLAG_WEBHOOK_SECRET is not defined in the environment.');
    process.exit(1); // Exit if the secret is missing
}

// --- CORS Configuration ---
// Allow requests from your frontend development server
// TODO: In production, replace with your actual frontend domain
const allowedOrigins = ['http://localhost:5173']; 

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['POST', 'OPTIONS', 'GET', 'PATCH'], // Allow POST, preflight OPTIONS, GET, and PATCH
  allowedHeaders: ['Content-Type'] // Allow only necessary headers from frontend
};

app.use(cors(corsOptions));

// Middleware to parse JSON bodies
app.use(express.json());

// --- Helper function for HMAC SHA256 (Node.js crypto) ---
function hmacSha256HexDigest(secret, message) {
    return crypto.createHmac('sha256', secret)
                 .update(message, 'utf-8')
                 .digest('hex');
}

// --- Helper to send Sentry webhook notification ---
async function sendSentryNotification(flagName, action) {
    console.log(`\n📣 SENDING SENTRY NOTIFICATION 📣`);
    console.log(`🏷️  Flag: ${flagName}`);
    console.log(`🔄  Action: ${action}`);
    
    const now = new Date();
    const createdAt = now.toISOString().replace(/\.\d{3}Z$/, '+00:00');
    
    // Final fix approach: Use a string representation of the integer
    // that we're certain won't have decimal places
    const changeId = Math.floor(Date.now()).toString();
    
    console.log(`🔑 Using change_id: ${changeId} (${typeof changeId})`);

    // Construct the payload with change_id as a string, but it will be parsed as integer by Sentry
    const payload = {
        meta: { version: 1 },
        data: [{
            action: action,
            change_id: changeId, // Using string format of integer
            created_at: createdAt,
            created_by: {
                id: 'admin-menu@hoopshop.app',
                type: 'email',
            },
            flag: flagName,
        }],
    };
    
    console.log(`📦 Payload: ${JSON.stringify(payload, null, 2)}`);
    
    // Manually replace the change_id string with a raw integer in the JSON
    let body = JSON.stringify(payload);
    // This regex replaces "change_id":"123456" with "change_id":123456
    body = body.replace(/"change_id":"(\d+)"/g, '"change_id":$1');
    
    console.log(`📦 Modified body: ${body.substring(0, 100)}...`);
    
    const signature = hmacSha256HexDigest(WEBHOOK_SECRET, body);
    
    console.log(`🔑 Generated signature: ${signature.substring(0, 10)}...`);
    console.log(`🌐 Sending to webhook URL: ${SENTRY_WEBHOOK_URL}`);

    try {
        console.log(`⏳ Sending webhook request...`);
        const sentryResponse = await fetch(SENTRY_WEBHOOK_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'X-Sentry-Signature': signature 
            },
            body: body,
        });
        
        console.log(`📡 Webhook response status: ${sentryResponse.status}`);
        
        if (!sentryResponse.ok) {
            const errorText = await sentryResponse.text();
            console.error(`❌ Sentry webhook notification failed for ${flagName}: ${sentryResponse.status}`);
            console.error(`❌ Response body: ${errorText}`);
            return false;
        } else {
            const responseBody = await sentryResponse.text();
            console.log(`✅ Sentry notification sent successfully for ${flagName} (${action}).`);
            console.log(`✅ Response body: ${responseBody}`);
            return true;
        }
    } catch (error) {
        console.error(`❌ Error sending Sentry notification for ${flagName}:`, error);
        return false;
    } finally {
        console.log(`📣 SENTRY NOTIFICATION COMPLETE 📣\n`);
    }
}
// --------------------------------------------------------------

// --- GET Endpoint for Flags ---
app.get('/api/flags', (req, res) => {
    db.all("SELECT name, defaultValue FROM flags", [], (err, rows) => {
        if (err) {
            console.error("Error querying flags", err.message);
            res.status(500).json({ error: "Failed to retrieve flags" });
            return;
        }
        // Convert DB result (0/1) back to boolean for frontend consistency
        const flags = rows.reduce((acc, row) => {
            acc[row.name] = Boolean(row.defaultValue);
            return acc;
        }, {});
        res.json(flags);
    });
});

// --- POST Endpoint for LOCAL OVERRIDE Notifications ---
// This endpoint is called directly by the frontend FeatureFlagAdapter
// when a LOCAL override happens via Sentry Toolbar.
app.post('/api/notify-flag-change', async (req, res) => {
    // The request body for this already contains userId/userType from frontend
    const { flagName, action, userId, userType } = req.body;

    if (!flagName || !action || !userId || !userType) {
        return res.status(400).json({ error: 'Missing required fields for override notification' });
    }
    
    console.log(`Received request to notify Sentry for LOCAL override: ${flagName} (${action}) by ${userId}`);

    const now = new Date();
    const createdAt = now.toISOString().replace(/\.\d{3}Z$/, '+00:00'); 
    
    // Use string representation of integer
    const changeId = Math.floor(Date.now()).toString();
    
    console.log(`Using change_id for notification: ${changeId} (${typeof changeId})`);

    const payload = {
        meta: { version: 1 },
        data: [{
            action: action,
            change_id: changeId, // Using string format that will be converted to integer
            created_at: createdAt,
            created_by: { id: userId, type: userType }, // Use user info from request
            flag: flagName,
        }],
    };
    
    // Manually replace the change_id string with a raw integer in the JSON
    let body = JSON.stringify(payload);
    // This regex replaces "change_id":"123456" with "change_id":123456
    body = body.replace(/"change_id":"(\d+)"/g, '"change_id":$1');
    
    console.log(`Modified notification body: ${body.substring(0, 100)}...`);

    try {
        const signature = hmacSha256HexDigest(WEBHOOK_SECRET, body);
        const sentryResponse = await fetch(SENTRY_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Sentry-Signature': signature },
            body: body,
        });

        if (!sentryResponse.ok) {
            const errorText = await sentryResponse.text();
            console.error(`Sentry webhook request failed (local override): ${sentryResponse.status}`, errorText);
            return res.status(sentryResponse.status).json({ error: 'Failed to notify Sentry', sentryStatus: sentryResponse.status, sentryMessage: errorText });
        }
        
        console.log(`Successfully forwarded LOCAL override notification for '${flagName}' to Sentry.`);
        return res.status(201).json({ message: 'Notification sent successfully' });

    } catch (error) {
        console.error('Error processing LOCAL override notification:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});
// --------------------------------------------------------

// --- POST Endpoint to Update Default Flag Values (and Notify Sentry) ---
app.post('/api/flags/defaults', (req, res) => {
    const updatedDefaults = req.body;

    if (typeof updatedDefaults !== 'object' || updatedDefaults === null) {
        return res.status(400).json({ error: 'Invalid request body: Expected an object of flags.' });
    }

    db.serialize(() => {
        db.run("BEGIN TRANSACTION;");

        const selectStmt = db.prepare(`SELECT defaultValue FROM flags WHERE name = ?`);
        const updateStmt = db.prepare(`UPDATE flags SET defaultValue = ? WHERE name = ?`);
        let errorOccurred = false;
        const totalFlags = Object.keys(updatedDefaults).length;
        let completedDbOperations = 0;
        const flagsThatChanged = [];

        const checkCompletion = () => {
            completedDbOperations++;
            if (completedDbOperations === totalFlags) {
                finalizeTransaction();
            }
        };

        Object.entries(updatedDefaults).forEach(([name, newValue]) => {
            if (typeof newValue !== 'boolean') {
                console.warn(`Skipping flag '${name}': Invalid value type.`);
                checkCompletion();
                return;
            }

            selectStmt.get(name, (selectErr, row) => {
                if (selectErr) {
                    console.error(`Error selecting current value for '${name}':`, selectErr.message);
                    errorOccurred = true;
                    checkCompletion();
                    return;
                }
                
                const currentRow = row;
                const currentValue = currentRow ? Boolean(currentRow.defaultValue) : undefined;

                if (currentValue === undefined) {
                     console.warn(`Skipping flag '${name}': Not found in database.`);
                     checkCompletion();
                     return;
                }

                if (currentValue !== newValue) {
                    updateStmt.run(newValue, name, function(updateErr) {
                        if (updateErr) {
                            console.error(`Error updating default flag '${name}':`, updateErr.message);
                            errorOccurred = true;
                        } else if (this.changes > 0) {
                            console.log(`Default value for '${name}' changed from ${currentValue} to ${newValue}.`);
                            flagsThatChanged.push({ name, newValue });
                        }
                        checkCompletion();
                    });
                } else {
                     checkCompletion();
                }
            });
        });
        
        const finalizeTransaction = () => {
            selectStmt.finalize((err) => { if(err) console.error("Error finalizing selectStmt:", err.message); });
            updateStmt.finalize((err) => { if(err) console.error("Error finalizing updateStmt:", err.message); });

            if (errorOccurred) {
                db.run("ROLLBACK;", (rollbackErr) => {
                    if (rollbackErr) console.error("Rollback failed:", rollbackErr.message);
                    return res.status(500).json({ error: 'Failed to update one or more default flags.' });
                });
            } else {
                db.run("COMMIT;", async (commitErr) => { 
                    if (commitErr) {
                         console.error("Commit failed:", commitErr.message);
                         db.run("ROLLBACK;"); 
                         return res.status(500).json({ error: 'Failed to commit flag updates.' });
                    }
                    console.log(`Default flags committed successfully. ${flagsThatChanged.length} flags changed.`);
                    if (flagsThatChanged.length > 0) {
                         console.log("Sending Sentry notifications for changed default flags...");
                         await Promise.all(
                             flagsThatChanged.map(flag => 
                                 sendSentryNotification(flag.name, 'updated')
                             )
                         );
                         console.log("Finished sending Sentry notifications.");
                    }
                    return res.status(200).json({ message: 'Default flags updated successfully.' });
                });
            }
        };

        if (totalFlags === 0) {
             console.log("No flags provided in request body to update.");
             selectStmt.finalize((err) => { if(err) console.error("Error finalizing selectStmt (empty):", err.message); });
             updateStmt.finalize((err) => { if(err) console.error("Error finalizing updateStmt (empty):", err.message); });
             db.run("COMMIT;");
             return res.status(200).json({ message: 'No flags provided to update.' });
        }
    });
});
// ----------------------------------------------------

// --- NEW PATCH Endpoint to Update a SINGLE Default Flag Value --- 
app.patch('/api/flags/defaults/:flagName', async (req, res) => {
    const { flagName } = req.params;
    const { value: newValue } = req.body; 

    console.log(`\n🚀 PATCH REQUEST for flag: ${flagName} => ${newValue}`);

    if (typeof newValue !== 'boolean') {
        console.log(`❌ Invalid value type: ${typeof newValue}. Expected boolean.`);
        return res.status(400).json({ error: 'Invalid request body: Expected { value: boolean }.' });
    }

    const getFlagPromise = () => new Promise((resolve, reject) => {
         console.log(`🔍 Checking if flag exists in database: ${flagName}`);
         db.get(`SELECT defaultValue FROM flags WHERE name = ?`, [flagName], (err, row) => {
            if (err) {
                console.error(`❌ Database error checking flag:`, err);
                reject(new Error(`Database error checking flag: ${err.message}`));
            } else {
                console.log(`✅ Database query result:`, row);
                resolve(row);
            }
        });
    });

    try {
        const row = await getFlagPromise();
        if (!row) {
            console.log(`❌ Flag not found: ${flagName}`);
            return res.status(404).json({ error: `Flag '${flagName}' not found.` });
        }

        const currentValue = Boolean(row.defaultValue);
        console.log(`ℹ️ Current value: ${currentValue}, New value: ${newValue}`);

        if (currentValue === newValue) {
             console.log(`ℹ️ Default value for '${flagName}' is already ${newValue}. No update needed.`);
             return res.status(200).json({ message: 'Flag default value already up-to-date.' }); 
        }

        const updatePromise = () => new Promise((resolve, reject) => {
            console.log(`🔄 Updating flag in database: ${flagName} => ${newValue}`);
            db.run(`UPDATE flags SET defaultValue = ? WHERE name = ?`, [newValue, flagName], function(err) {
                if (err) {
                    console.error(`❌ Database error updating flag:`, err);
                    reject(new Error(`Database error updating flag: ${err.message}`));
                } else if (this.changes === 0) {
                    console.error(`❌ Flag found but not updated: ${flagName}`);
                    reject(new Error(`Flag '${flagName}' found but not updated.`)); 
                } else {
                    console.log(`✅ Database update successful: ${this.changes} row(s) affected`);
                    resolve(undefined);
                }
            });
        });
        
        await updatePromise();
        console.log(`✅ Database update complete for '${flagName}' => ${newValue}`);

        console.log(`🔔 Calling sendSentryNotification for flag: ${flagName}`);
        const sentryResult = await sendSentryNotification(flagName, 'updated');
        console.log(`🔔 Sentry notification result: ${sentryResult ? 'Success' : 'Failed'}`);

        return res.status(200).json({ 
            message: `Default flag '${flagName}' updated successfully. Sentry notification: ${sentryResult ? 'sent' : 'failed'}` 
        });

    } catch (error) {
        console.error(`❌ Error processing PATCH /api/flags/defaults/${flagName}:`, error);
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal Server Error' });
    } finally {
        console.log(`\n🏁 PATCH REQUEST COMPLETE for flag: ${flagName}\n`);
    }
});
// -----------------------------------------------------------------

// Handle preflight requests for the endpoints
app.options('/api/notify-flag-change', cors(corsOptions));
app.options('/api/flags', cors(corsOptions));
app.options('/api/flags/defaults', cors(corsOptions));
app.options('/api/flags/defaults/:flagName', cors(corsOptions)); // Add for PATCH

// Basic root route for testing server is up
app.get('/', (req, res) => {
    res.send('Sentry Webhook Proxy Server is running.');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Allowed frontend origin: ${allowedOrigins.join(', ')}`);
}); 