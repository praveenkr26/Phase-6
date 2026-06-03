const mongoose = require("mongoose");

const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_BASE_DELAY_MS = 2000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getConnectionStateLabel() {
  switch (mongoose.connection.readyState) {
    case 0:
      return "disconnected";
    case 1:
      return "connected";
    case 2:
      return "connecting";
    case 3:
      return "disconnecting";
    default:
      return "unknown";
  }
}

async function connectWithRetry(uri, options = {}) {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const fallbackUri = options.fallbackUri || process.env.MONGO_URI_FALLBACK || "";

  if (!uri) {
    console.warn("⚠️  MONGO_URI is missing. Skipping database connection.");
    return false;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      console.log(`🔌 MongoDB connect attempt ${attempt}/${maxRetries}...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });

      console.log("✅ MongoDB connected");
      console.log(`📦 Database: ${mongoose.connection.name}`);
      console.log(`📍 State: ${getConnectionStateLabel()}`);
      return true;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const isSrvDnsError = /querySrv ECONNREFUSED|getaddrinfo ENOTFOUND|EAI_AGAIN/i.test(error.message);
      const extraHint = isSrvDnsError
        ? " - DNS/SRV lookup failed. Try Atlas IP access list, public DNS (8.8.8.8/1.1.1.1), or use a non-SRV connection string."
        : "";
      console.error(`❌ MongoDB connection attempt ${attempt} failed: ${error.message}${extraHint}`);

      if (isSrvDnsError && fallbackUri && fallbackUri !== uri) {
        try {
          console.log("🔁 Trying fallback MongoDB URI without SRV...");
          await mongoose.connect(fallbackUri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
          });

          console.log("✅ MongoDB connected using fallback URI");
          console.log(`📦 Database: ${mongoose.connection.name}`);
          console.log(`📍 State: ${getConnectionStateLabel()}`);
          return true;
        } catch (fallbackError) {
          console.error(`❌ Fallback MongoDB URI also failed: ${fallbackError.message}`);
        }
      }

      if (isLastAttempt) {
        console.error("🛑 MongoDB connection retries exhausted. Server will keep running without a database connection.");
        return false;
      }

      const waitMs = baseDelayMs * attempt;
      console.log(`⏳ Retrying in ${waitMs / 1000} seconds...`);
      await delay(waitMs);
    }
  }

  return false;
}

function registerMongoEvents() {
  mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB connection established");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("🔄 MongoDB reconnected");
  });

  mongoose.connection.on("disconnected", () => {
    console.log("⚠️  MongoDB disconnected");
  });

  mongoose.connection.on("error", (error) => {
    console.error("❌ MongoDB connection error:", error.message);
  });
}

module.exports = {
  connectWithRetry,
  registerMongoEvents,
  getConnectionStateLabel,
};