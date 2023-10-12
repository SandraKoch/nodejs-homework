const { User } = require("./user.model");
const { userValidation } = require("./user.validator");
const bcrypt = require("bcryptjs");
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { secret } = require("../config");
const {
  authMiddleware,
  invalidateToken,
  isTokenInvalidated,
} = require("../auth/auth.service");

router.post(
  "/signup",
  (req, res, next) => userValidation(req, res, next),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const newUser = new User({
          email,
          password: hash,
        });
        await newUser.save();
        //token

        res.status(201).json({
          user: {
            email: newUser.email,
            subscription: newUser.subscription,
          },
        });
      } else {
        res
          .status(409)
          .json({ status: "Conflict", code: 409, message: "Email in use" });
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ status: "Internal Server Error", code: 500 });
    }
  }
);
router.get("/current", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userId;
    const userData = await User.findOne({ userId });
    console.log("userData", userData);
    if (!userData) {
      return res.status(401).json({
        status: "Unauthorized",
        code: 401,
        message: "No data here",
      });
    } else {
      res.status(200).json({
        status: "OK",
        code: 200,
        message: "Here is current user data:",
        userData: {
          email: userData.email,
          subscription: userData.subscription,
        },
      });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error", code: 500 });
  }
});

router.get("/logout", authMiddleware, async (req, res) => {
  try {
    invalidateToken(req.token);
    res.status(200).json({
      message: "ok",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error", code: 500 });
  }
});
router.post(
  "/login",
  (req, res, next) => userValidation(req, res, next),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      console.log(user.password);
      if (!user) {
        return res.status(401).json({
          status: "Unauthorized",
          code: 401,
          message: "Email or password is wrong",
        });
      } else {
        const passwordComparison = await bcrypt.compare(
          password,
          user.password
        );

        // console.log("passwordComparison", passwordComparison);
        if (!passwordComparison) {
          return res.status(401).json({
            status: "Unauthorized",
            code: 401,
            message: "Email or password is wrong",
          });
        } else {
          // const secret = config.secret;
          // console.log("secret", secret);
          console.log("user._id", user._id);

          const token = jwt.sign({ userId: user._id }, secret, {
            expiresIn: "4w",
          });

          // user.token = token;
          // await user.save();

          res.status(200).json({
            status: "Success",
            code: 200,
            message: "Successful login!",
            token,
            user: { email: user.email, subscription: user.subscription },
          });
        }
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ status: "Internal Server Error", code: 500 });
    }
  }
);
module.exports = router;
