const os = require("os");

// Import database
const connectToDatabase = require("../../database/database.connect");

class HealthSummary {
  async diagnoseOperatingSystem() {
    const freeMem = await os.freemem();
    const totalMem = await os.totalmem();
    const cpu = await os.cpus();
    const hostname = await os.hostname();

    this._freeMem = freeMem / 1e9;
    this._totalMem = totalMem / 1e9;
    this._cpu = cpu;
    this._hostname = hostname;
  }
  async diagnoseDatabase() {
    await connectToDatabase()
      .then((result) => {
        this._databaseConnection = true;
        this._databaseMessage = null;
        return result;
      })
      .catch((err) => {
        this._databaseConnection = false;
        this._databaseMessage = err.message;
      });
  }
  getResult() {
    const result = {
      database: {
        connected: this._databaseConnection,
        message: this._databaseMessage,
      },
      memory: {
        free: this._freeMem,
        total: this._totalMem,
      },
      os: {
        cpus: this._cpu,
        hostname: this._hostname,
      },
    };
    return result;
  }
  async diagnose() {
    await this.diagnoseDatabase();
    await this.diagnoseOperatingSystem();
    return this.getResult();
  }
}

module.exports = HealthSummary;
