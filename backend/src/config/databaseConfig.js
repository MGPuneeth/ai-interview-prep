import mongoose from "mongoose";
import { configDotenv } from "dotenv";
configDotenv();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Successfully connected to DB");
  } catch (error) {
    console.log("Failed to connect to DB");

    console.log(error);
  }
}

export { connectDB };
