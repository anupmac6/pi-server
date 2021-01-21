const Agenda = require("agenda");
const config = require("config");
const MONGO_DB = config.get("MongoDb");

const connectionString = `mongodb+srv://${MONGO_DB.user}:${MONGO_DB.password}@pi-server.9i0wb.mongodb.net/${MONGO_DB.database}?retryWrites=true&w=majority&useUnifiedTopology=true`;

const agenda = new Agenda({
  name: "Pi-Server",
  db: { address: connectionString, collection: "cronjob" },
  processEvery: "5 seconds",
  maxConcurrency: 20,
});

agenda.start();

module.exports = agenda;
