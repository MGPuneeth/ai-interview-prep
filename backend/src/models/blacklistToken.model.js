import mongoose from "mongoose";

const blacklistTokenSchema = mongoose.Schema(
  {
    token: {
      type: String,
      required: [true, "Token required to be added in the model "],
    },
  },
  {
    timeStamps: true,
  },
);

const blacklistTokenModel = mongoose.model(
  "blacklistToken",
  blacklistTokenSchema,
);

export { blacklistTokenModel };
