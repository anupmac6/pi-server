const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Joi = require("@hapi/joi");

const userSchema = new Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    hash: { type: String },
    salt: { type: String },
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpires: { type: String, required: false },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = function (password) {
  this.salt = crypto.randomBytes(16).toString("hex");
  this.hash = crypto
    .pbkdf2Sync(password, this.salt, 128, 128, "sha512")
    .toString("hex");
};

userSchema.methods.validatePassword = function (password) {
  const hash = crypto
    .pbkdf2Sync(password, this.salt, 128, 128, "sha512")
    .toString("hex");
  console.log(this.hash === hash);
  return this.hash === hash;
};

userSchema.methods.generateJWT = function () {
  const today = new Date();
  const expirationDate = new Date(today);
  expirationDate.setDate(today.getDate() + 60);

  return jwt.sign(
    {
      email: this.email,
      id: this._id,
      exp: parseInt(expirationDate.getTime() / 1000, 10),
    },
    "secret"
  );
};

userSchema.methods.toAuthJSON = function (token) {
  return {
    _id: this._id,
    email: this.email,
    token: token,
    username: this.username,
  };
};

const User = mongoose.model("User", userSchema);

const validateUser = async (user) => {
  const schema = Joi.object({
    name: Joi.string().min(3).trim().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    hash: Joi.string().optional(),
    salt: Joi.string().optional(),
    resetPasswordToken: Joi.string().optional(),
    resetPasswordExpires: Joi.string().optional(),
  });
  try {
    await schema.validateAsync(user);
    return null;
  } catch (error) {
    const message = error.details.map((i) => i.message).join(",");
    const exception = new Error(message);
    exception.statusCode = 406;
    return exception;
  }
};

exports.User = User;
exports.validateUser = validateUser;
