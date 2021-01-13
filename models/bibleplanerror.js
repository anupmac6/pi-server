const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Joi = require("@hapi/joi");

const biblePlanErrorSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    planDay: {
      type: Number,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const BiblePlanError = mongoose.model("Bibleplanerror", biblePlanErrorSchema);

const validateBiblePlanError = async (biblePlanError) => {
  const schema = Joi.object({
    user: Joi.string().optional(),
    planDay: Joi.number().optional(),
    error: Joi.string().required(),
  });
  try {
    await schema.validateAsync(biblePlanError);
    return null;
  } catch (error) {
    const message = error.details.map((i) => i.message).join(",");
    const exception = new Error(message);
    exception.statusCode = 406;
    return exception;
  }
};

exports.BiblePlanError = BiblePlanError;
exports.validateBiblePlanError = validateBiblePlanError;
