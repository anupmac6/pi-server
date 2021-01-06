const HealthSummary = require("./health.summary.class");

exports.summary = async () => {
  const healthSummary = new HealthSummary();

  const summary = await healthSummary.diagnose();

  return summary;
};
