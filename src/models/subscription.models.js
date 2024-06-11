import mongoose, { Schema, Types, model } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: mongoose.model.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    channel: {
      type: mongoose.model.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
  },
  { timestamps: true }
);

export const subscription = model("Subscription", subscriptionSchema);
