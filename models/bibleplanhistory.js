const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Joi = require("@hapi/joi");

const biblePlanHistorySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planDay: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const BiblePlanHistory = mongoose.model(
  "BiblePlanHistory",
  biblePlanHistorySchema
);

const validateBiblePlanHistory = async (biblePlanHistory) => {
  const schema = Joi.object({
    user: Joi.string().required(),
    planDay: Joi.number().required(),
  });
  try {
    await schema.validateAsync(biblePlanHistory);
    return null;
  } catch (error) {
    const message = error.details.map((i) => i.message).join(",");
    const exception = new Error(message);
    exception.statusCode = 406;
    return exception;
  }
};

exports.BiblePlanHistory = BiblePlanHistory;
exports.validateBiblePlanHistory = validateBiblePlanHistory;
