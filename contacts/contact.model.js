const { Schema, model } = require("mongoose");

const contactSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name has to be present"],
      index: true,
    },
    email: { type: String, unique: true },
    phone: {
      type: String,
      required: true,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

const Contact = model("contacts", contactSchema);

module.exports = {
  Contact,
};
