const mongoose = require("mongoose");

const config = require("config");
const MONGO_DB = config.get("MongoDb");

module.exports = async () => {
  const response = await mongoose.connect(
    `mongodb+srv://${MONGO_DB.user}:${MONGO_DB.password}@pi-server.9i0wb.mongodb.net/${MONGO_DB.database}?retryWrites=true&w=majority`,
    {
      poolSize: 10,
      user: MONGO_DB.user,
      pass: MONGO_DB.password,
      useUnifiedTopology: true,
    }
  );
  return response;
};
