const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Joi = require("@hapi/joi");

const scheduleSchema = new Schema(
  {
    _id: {
      type: Number,
    },
    period: {
      type: String,
      index: false,
    },
    firstReading: [
      {
        _id: {
          type: Number,
          index: false,
          default: 1,
        },
        verse: {
          type: String,
          index: false,
        },
      },
    ],
    secondReading: [
      {
        _id: {
          type: Number,
          index: false,
          default: 1,
        },
        verse: {
          type: String,
          index: false,
        },
      },
    ],
    psalm: [
      {
        _id: {
          type: Number,
          index: false,
          default: 1,
        },
        verse: {
          type: String,
          index: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Schedule = mongoose.model("Schedule", scheduleSchema);

const validateSchedule = async (schedule) => {
  const schema = Joi.object({
    _id: Joi.number().required(),
    period: Joi.string().required(),
    firstReading: Joi.array().items({ _id: Joi.number(), verse: Joi.string() }),
    secondReading: Joi.array().items({
      _id: Joi.number(),
      verse: Joi.string(),
    }),
    psalm: Joi.array().items({ _id: Joi.number(), verse: Joi.string() }),
  });
  try {
    await schema.validateAsync(schedule);
    return null;
  } catch (error) {
    const message = error.details.map((i) => i.message).join(",");
    const exception = new Error(message);
    exception.statusCode = 406;
    return exception;
  }
};

exports.Schedule = Schedule;
exports.validateSchedule = validateSchedule;
