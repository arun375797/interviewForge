const mongoose = require('mongoose');

function normalizeMongoUri(uri) {
  try {
    if (/mongodb(\+srv)?:\/\//.test(uri) && /\/\/[^/]+\/(\?|$)/.test(uri)) {
      return uri.replace(/\/\/([^/]+)\/(\?|$)/, '//$1/mern_interview_prep$2');
    }
  } catch {
    /* keep original */
  }
  return uri;
}

let connecting;

const connectDB = async () => {
  // Reuse connection across Vercel serverless invocations
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (connecting) return connecting;

  const raw = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mern_interview_prep';
  const uri = normalizeMongoUri(raw);
  mongoose.set('strictQuery', true);

  connecting = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      maxPoolSize: 5,
      bufferCommands: false,
    })
    .then((conn) => {
      console.log('MongoDB connected');
      connecting = null;
      return conn;
    })
    .catch((err) => {
      connecting = null;
      throw err;
    });

  return connecting;
};

module.exports = connectDB;
