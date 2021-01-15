const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Joi = require("@hapi/joi");

const subscriberSchema = new Schema({
  email: {
    type: String,
  },
});

const Subscriber = mongoose.model("Subscriber", subscriberSchema);

const validateSubscriber = async (subscriber) => {
  const schema = Joi.object({
    email: Joi.string().required(),
  });
  try {
    await schema.validateAsync(subscriber);
    return null;
  } catch (error) {
    const message = error.details.map((i) => i.message).join(",");
    const exception = new Error(message);
    exception.statusCode = 406;
    return exception;
  }
};

exports.Subscriber = Subscriber;
exports.validateSubscriber = validateSubscriber;
