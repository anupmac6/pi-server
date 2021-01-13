const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Joi = require("@hapi/joi");
const { string } = require("@hapi/joi");
const { trimEnd } = require("lodash");

const biblePlanSchema = new Schema(
  {
    startDay: {
      type: Date,
      default: Date.now,
    },
    activationDate: {
      type: Date,
      default: Date.now,
    },
    includeAdventureBibleTimePeriod: {
      type: Boolean,
      default: true,
    },
    bibleTranslation: {
      type: String,
      default: "RSVCE",
    },
    receiveFormat: {
      type: Number,
      default: 1,
    },
    preferredTime: {
      type: Number,
      default: 1,
    },
    isPaused: {
      type: Boolean,
      default: false,
    },
    pausedFor: {
      type: Number,
    },
    isUnsubscribed: {
      type: Boolean,
      default: false,
    },
    isFinished: {
      type: Boolean,
      default: false,
    },
    isCancelled: {
      type: Boolean,
      default: false,
    },
    currentDay: {
      type: Number,
      default: 1,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * RECEIVE FORMAT
 * 1 = EMAIL
 * 2 = PDF
 * 3 = EMAIL & PDF
 */

/**
 * PREFERRED TIME
 * 0 = Midnight
 * 1 = Early Morning
 * 2 = Morning
 * 3 = Evening
 * 4 = Night
 */
const BiblePlan = mongoose.model("Bibleplan", biblePlanSchema);

const validateBiblePlan = async (biblePlan) => {
  const schema = Joi.object({
    startDay: Joi.date().optional(),
    activationDate: Joi.date().optional(),
    includeAdventureBibleTimePeriod: Joi.boolean().optional(),
    bibleTranslation: Joi.string().optional(),
    receiveFormat: Joi.number().optional(),
    preferredTime: Joi.number().optional(),
    isPaused: Joi.boolean().optional(),
    pausedFor: Joi.number().optional(),
    isUnsubscribed: Joi.boolean().optional(),
    isFinished: Joi.boolean().optional(),
    isCancelled: Joi.boolean().optional(),
    currentDay: Joi.number().optional(),
    user: Joi.string().required(),
  });
  try {
    await schema.validateAsync(biblePlan);
    return null;
  } catch (error) {
    const message = error.details.map((i) => i.message).join(",");
    const exception = new Error(message);
    exception.statusCode = 406;
    return exception;
  }
};

exports.BiblePlan = BiblePlan;
exports.validateBiblePlan = validateBiblePlan;
