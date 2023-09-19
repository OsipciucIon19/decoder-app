const amqplib = require("amqplib");
const db = require("./models");

const RABBIT_QUEUE_NAME = "messages";
const RABBIT_URL = "amqp://rabbitmq";

(async () => {
  const connection = await amqplib.connect(RABBIT_URL);

  const channel = await connection.createChannel();
  await channel.assertQueue(RABBIT_QUEUE_NAME);

  channel.prefetch(10);

  console.log(`Waiting for messages in ${RABBIT_QUEUE_NAME}`);

  channel.consume(RABBIT_QUEUE_NAME, async (msg) => {
    if (msg !== null) {
      const data = JSON.parse(msg.content.toString());
      const messages = data.map((message) => JSON.parse(message));

      try {
        console.log(messages);
        const result = await db.Message.bulkCreate(messages);

        if (result) {
          channel.ack(msg);
        }
      } catch (e) {
        console.log("RabbitMQ error", e);
      }
    }
  });
})();
