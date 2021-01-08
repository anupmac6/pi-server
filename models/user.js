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
    local: {
      email: {
        type: String,
        unique: true,
        required: true,
      },
      hash: { type: String },
      salt: { type: String },
    },
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpires: { type: String, required: false },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = function (password) {
  this.local.salt = crypto.randomBytes(16).toString("hex");
  this.local.hash = crypto
    .pbkdf2Sync(password, this.local.salt, 128, 128, "sha512")
    .toString("hex");
};

userSchema.methods.validatePassword = function (password) {
  const hash = crypto
    .pbkdf2Sync(password, this.local.salt, 128, 128, "sha512")
    .toString("hex");

  return this.local.hash === hash;
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
    email: this.local.email,
    token: token,
    username: this.username,
  };
};

const User = mongoose.model("User", userSchemas);

const validateUser = async (user) => {
  const schema = Joi.object({
    name: Joi.string(),
    local: Joi.object({
      email: Joi.string().required(),
      hash: Joi.string(),
      salt: Joi.string(),
    }),
    resetPasswordToken: Joi.string(),
    resetPasswordExpires: Joi.string(),
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
