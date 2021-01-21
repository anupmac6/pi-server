const { required } = require("@hapi/joi");
const { User, validateUser } = require("../../models/user");
const Joi = require("@hapi/joi");
const crypto = require("crypto");
const config = require("config");
const EMAIL = config.get("Email");
const sgMail = require("@sendgrid/mail");
const { validateSubscriber, Subscriber } = require("../../models/subscriber");
const { subscribe } = require("./auth.routes");
const { firestore } = require("../../firebase");
const { Collection } = require("../../collection");
sgMail.setApiKey(EMAIL.key);

const checkUserExist = async (email) => {
  const user = await User.findOne({ "local.email": email });
  if (user) {
    const exception = new Error("User already exists.");
    throw exception;
  }
};
exports.signup = async (user) => {
  //* Validate the object first
  const error = await validateUser(user);
  if (error) {
    throw error;
  }
  //* Ensure user does not exists
  await checkUserExist(user.email);
  //* Create a new user
  const newUser = new User({ name: user.name, email: user.email });
  //* Set the encrypted password
  newUser.setPassword(user.password);
  //* save the new user
  const response = await newUser.save();
  return { _id: response._id };
};
const isValidEmail = async (email) => {
  const schema = Joi.string().email().required();
  try {
    await schema.validateAsync(email);
  } catch (error) {
    const message = error.details.map((i) => i.message).join(",");
    const exception = new Error(message);
    exception.statusCode = 406;
    throw exception;
  }
};
const createResetPasswordToken = async () => {
  const promise = new Promise((resolve, reject) => {
    crypto.randomBytes(20, (err, buf) => {
      const token = buf.toString("hex");
      if (err) {
        reject(err);
      }
      resolve(token);
    });
  });
  return promise;
};
const updateUserWithResetPasswordToken = async (email, token) => {
  const user = await User.findOne({ email });
  if (!user) {
    const exception = new Error("No account with the email address exists.");
    throw exception;
  }
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000;

  const response = await user.save();
  return response;
};
const sendForgotPasswordEmail = async (name, email, token) => {
  const msg = {
    to: email, // Change to your recipient
    from: "anupmac6@gmail.com", // Change to your verified sender
    subject: "Password Change Request",
    text: `Hi ${name} \n  ${token}`,
  };
  try {
    const response = sgMail.send(msg);
    return response;
  } catch (error) {
    if (error.response) {
      console.error(error.response.body);
    }
    throw error;
  }
};
exports.forgotPassword = async (email) => {
  //* Make sure email is valid
  await isValidEmail(email);
  //* Create a reset password token
  const token = await createResetPasswordToken();
  //* Update the user
  const updatedUser = await updateUserWithResetPasswordToken(email, token);
  //* Send Email
  const response = await sendForgotPasswordEmail(
    updatedUser.name,
    updatedUser.email,
    token
  );
  return response;
};
const validateChangePasswordRequest = async (request) => {
  const schema = Joi.object({
    token: Joi.string().required(),
    oldPassword: Joi.string().min(6).required(),
    newPassword: Joi.string().min(6).required(),
  });
  try {
    await schema.validateAsync(request);
  } catch (error) {
    const message = error.details.map((i) => i.message).join(",");
    const exception = new Error(message);
    exception.statusCode = 406;
    throw exception;
  }
};
const updateUserFromToken = async (oldPassword, newPassword, token) => {
  const user = await User.findOne({ resetPasswordToken: token });
  if (!user) {
    throw new Error("No user found");
  }

  //* Check token expiration
  const now = Date.now();
  if (now > user.resetPasswordExpires) {
    throw new Error("Token Expired");
  }
  //* Validate old password
  if (!user.validatePassword(oldPassword)) {
    throw new Error("Old Password does not match");
  }
  //* Update password
  user.setPassword(newPassword);
  await user.updateOne({ salt: user.salt, hash: user.hash });

  return "Password changed";
};
exports.changePassword = async (request) => {
  //* Validate request
  await validateChangePasswordRequest(request);
  //* Find the user information from token
  const user = await updateUserFromToken(
    request.oldPassword,
    request.newPassword,
    request.token
  );
  return user;
};
exports.subsribeBiblePlan = async (request) => {
  //* Validate request
  const error = await validateSubscriber(request);
  if (error) {
    throw error;
  }
  try {
    await firestore.collection(Collection.SUBSCRIBER).add(request);
  } catch (error) {
    throw new Error("Failed to subscribe user, please try again later.");
  }

  return { subscribed: true };
};
