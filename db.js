/** Database setup for BizTime. */

const {Client} = require("pg");

const client = new Client({conStr: "postgresql:///biztime"});

client.connect();

module.exports = client;