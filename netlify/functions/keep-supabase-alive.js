const { schedule } = require("@netlify/functions");

const SUPABASE_URL = "https://xmlbknkjhliwnsubgqxk.supabase.co";
const SUPABASE_KEY = "sb_publishable_isUTFLRp4HcOiTPkY9sLVQ_qMWwT5l2";

// Runs every 5 days at 8:00 AM
const handler = schedule("0 8 */5 * *", async () => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    console.log(`Supabase ping successful! Status: ${response.status}`);
    console.log(`Pinged at: ${new Date().toISOString()}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Supabase keep-alive ping successful",
        status: response.status,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("Supabase ping failed:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Supabase ping failed",
        error: error.message,
      }),
    };
  }
});

module.exports = { handler };
