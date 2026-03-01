import Nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";
import "dotenv/config";

const TOKEN = process.env.TOKEN || "";

console.log("MAILTRAP TOKEN: ", TOKEN ? "Loaded" : "Missing");

const transport = Nodemailer.createTransport(
  MailtrapTransport({
    token: TOKEN,
  }),
);

const sender = {
  address: "hello@demomailtrap.co",
  name: "To-Du",
};

export { transport, sender };
