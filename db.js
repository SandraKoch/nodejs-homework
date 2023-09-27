const mongoose = require("mongoose");

const connect = async () => {
  try {
    await mongoose.connect(mongoConnectionString);
  } catch (error) {
    console.error(error.message);
    throw new Error("Database connection failed");
  }
};

const disconnect = async () => {
  try {
    await mongoose.disconnect();
  } catch (error) {
    console.error(error.message);
    throw new Error("Cannot disconnect from database");
  }
};

module.exports = {
  connect,
  disconnect,
};
