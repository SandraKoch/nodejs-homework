// const app = require("./app");

// app.listen(PORT, () => {
//   console.log("Server running. Use our API on port: 3000");
// });

const { serverPort } = require("./config");
const { app } = require("./app");
const db = require("./db");

(async () => {
  try {
    await db.connect();
    console.log("Database connection successfull!");
    // console.log("log:", serverPort);
    app.listen(serverPort, async () => {
      console.log(`Server running. Use our API on port: ${serverPort}`);
    });
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
