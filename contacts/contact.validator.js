const Joi = require("joi");

const contactSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().required(),
  phone: Joi.string().required(),
  favorite: Joi.boolean().optional(),
});

const contactValidation = (req, res, next) => {
  const newContact = req.body;

  const { error } = contactSchema.validate(newContact);

  if (error) {
    return res.status(400).send({ error: error.message });
    // you can add .json({ message: "Contact validation error" })
  }
  return next();
};

module.exports = { contactValidation };
