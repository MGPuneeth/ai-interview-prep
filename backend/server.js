import { app } from "./src/app.js";
import { configDotenv } from "dotenv";
import { connectDB } from "./src/config/databaseConfig.js";

connectDB();
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
