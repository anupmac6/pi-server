const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Joi = require("@hapi/joi");

const scheduledataSchema = new Schema(
  {
    firstReadingData: [
      {
        _id: {
          type: Number,
          index: false,
        },
        verse: {
          type: String,
          index: false,
        },
      },
    ],
    secondReadingData: [
      {
        _id: {
          type: Number,
          index: false,
        },
        verse: {
          type: String,
          index: false,
        },
      },
    ],
    psalmData: [
      {
        _id: {
          type: Number,
          index: false,
        },
        verse: {
          type: String,
          index: false,
        },
      },
    ],
    schedule: {
      type: Number,
      ref: "Schedule",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ScheduleData = mongoose.model("Scheduledata", scheduledataSchema);

const validate = async (scheduleData) => {
  const schema = Joi.object({
    firstReadingData: Joi.array().items({
      _id: Joi.number(),
      text: Joi.string(),
    }),
    secondReadingData: Joi.array().items({
      _id: Joi.number(),
      text: Joi.string(),
    }),
    psalmData: Joi.array().items({
      _id: Joi.number(),
      text: Joi.string(),
    }),
    schedule: Joi.number().required(),
  });

  try {
    await schema.validateAsync(scheduleData);
    return null;
  } catch (error) {
    const message = error.details.map((i) => i.message).join(",");
    const exception = new Error(message);
    exception.statusCode = 406;
    return exception;
  }
};

exports.ScheduleData = ScheduleData;
exports.validate = validate;
