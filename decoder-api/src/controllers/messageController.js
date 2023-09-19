const amqplib = require("amqplib");
// const redis = require("redis");
const db = require("../models");

const RABBIT_URL = "amqp://rabbitmq";
const RABBIT_QUEUE_NAME = "messages";

let messages = [];
let isExpired = false;
let lastInsert = new Date();

// const client = redis.createClient(6379, "redis");

// client.on("connect", () => {
//   console.log("Redis client connected");
// });

// client.on("error", () => {
//   console.log("Something went wrong when connecting to redis");
// });

(async () => {
  const connection = await amqplib.connect(RABBIT_URL);

  const channel = await connection.createChannel();

  channel.assertQueue(RABBIT_QUEUE_NAME, { durable: true });

  const sendItems = () => {
    if (messages.length > 99 || (messages.length > 0 && isExpired)) {
      const data = JSON.stringify(messages);

      channel.sendToQueue(RABBIT_QUEUE_NAME, Buffer.from(data), {
        persistent: true
      });

      messages = [];
      isExpired = false;
      lastInsert = new Date();
    }
  };

  setInterval(() => {
    isExpired = new Date() - 10000 >= lastInsert;
    sendItems();
  }, 1000);
})();

// const getCachedValue = async (cacheKey) =>
//   new Promise((resolve, reject) => {
//     client.get(cacheKey, (err, reply) => {
//       if (err) {
//         reject(new Error("redis error"));
//       }

//       if (reply) {
//         resolve(reply);
//       }

//       resolve(false);
//     });
//   });

// const writeValueToCache = (key, value) => {
//   client.set(key, parseInt(value, 10));
//   client.expire(key, 30);
// };

// const incrementMessageCache = async (cacheKey) => {
//   const value = await getCachedValue(cacheKey);

//   if (!value) {
//     await getResults();
//   }

//   client.incr(cacheKey);
//   client.expire(cacheKey, 30);
// };

const getResults = async () => {
  // let cachedMessage = await getCachedValue("cachedMessage");

  // if (!cachedMessage) {
    const dbResults = await db.Message.findAll({
      order: [['createdAt', 'DESC']]
    });

    console.log(dbResults)

    const lastInsertedMessage = dbResults[0]
    // save values to redis
    // writeValueToCache("cachedMessage", lastInsertedMessage);
  // }

  return {
    ...lastInsertedMessage
  };
};

const decodePayload = (hexPayload) => {
  const payload = Buffer.from(hexPayload, "hex");
  let value;

  // Extracting sensor data from the payload
  value = (payload[2] << 8) | payload[3];
  if (payload[2] & 0x80) {
    value |= 0xffff0000;
  }
  const temperature = value / 100; // SHT20, temperature, units: °C

  value = (payload[4] << 8) | payload[5];
  const humidity = value / 10; // SHT20, Humidity, units: %

  value = ((payload[0] << 8) | payload[1]) & 0x3fff;
  const battery = value / 1000; // Battery, units: mV

  value = (payload[7] << 8) | payload[8];
  if (payload[7] & 0x80) {
    value |= 0xffff0000;
  }
  const temperatureExt = value / 100; // DS18B20, temperature, units: °C

  // Creating the decoded object
  return {
    temperature,
    humidity,
    battery,
    temperatureExt
  };
};

const createMessage = async (req, res) => {
  let { hexPayload } = req.body;

  const message = decodePayload(hexPayload);

  messages.push(JSON.stringify({ ...message, createdAt: new Date() }));

  // increment value in redis
  // await incrementMessageCache("cachedMessage");

  const result = await getResults();
  return res.status(201).send(result);
};

module.exports = {
  createMessage
};
