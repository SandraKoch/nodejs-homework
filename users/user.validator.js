const Joi = require("joi");

const userSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
});

const userValidation = (req, res, next) => {
  const newUser = req.body;

  const { error } = userSchema.validate(newUser);

  if (error) {
    return res
      .status(400)
      .json({ message: "User validation error" })
      .send({ error: error.message });
  }
  return next();
};

module.exports = { userValidation };
