import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: [true, "Username is already in use"],
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: [true, "User already exists throught this email"],
  },
  password: {
    type: String,
    required: true,
  },
});

const userModel = mongoose.model("users", userSchema);

export { userModel };
