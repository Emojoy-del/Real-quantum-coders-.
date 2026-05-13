const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  try {
    if (uri && !uri.includes('<db_password>')) {
      const conn = await mongoose.connect(uri);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    }

    throw new Error('Invalid MongoDB URI');
  } catch (error) {
    console.warn('Atlas connect failed, falling back to in-memory MongoDB:', error.message);

    const mongod = await MongoMemoryServer.create();
    const memoryUri = mongod.getUri();

    const conn = await mongoose.connect(memoryUri);
    console.log(`In-memory MongoDB Connected: ${conn.connection.host}`);
  }
};

module.exports = connectDB;