const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");

const Userschema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },

    photo: {
      type: String,
      required: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    refreshtoken: {
      type: String,
    },
  },
  { timestamps: true },
);
Userschema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

Userschema.methods.comparePassword = async function (oldPassword) {
  return bcrypt.compare(oldPassword, this.password);
};

Userschema.methods.generateToken = function () {
  return jwt.sign(
    {
      id: this._id,
      username: this.username,
      email: this.email,
    },
    process.env.SECRET_ACCESS_KEY,
    {
      expiresIn: process.env.ACCESS_KEY_EXPIRE,
    },
  );
};

Userschema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this._id,
    },
    process.env.REFRESH_TOKEN_KEY,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
    },
  );
};
const User = mongoose.model("User", Userschema);
module.exports = { User };
