const mongoose = require("mongoose");

const Blog = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },

    description: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },

    image: {
      type: String,
      required: true,
    },

    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },

    likes: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
        comment: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    follow: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const blog = mongoose.model("BlogModel", Blog);
module.exports = { blog };
