const { User } = require("./user.model");
const { userValidation } = require("./user.validator");
const bcrypt = require("bcryptjs");
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { secret } = require("../config");
const { authMiddleware, invalidateToken } = require("../auth/auth.middleware");
const fs = require("fs/promises");
const gravatar = require("gravatar");
const multer = require("multer");
const path = require("path");
const Jimp = require("jimp");

const upload = multer({
  dest: path.join(__dirname, "../tmp"),
});
router.patch(
  "/avatars",
  authMiddleware,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const { userId } = req.userId;
      const user = await User.findOne({ userId });

      if (!user) {
        return res
          .status(401)
          .json({ message: "Unauthorized: no user authentication" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // console.log("user", user);
      // console.log("req.file", req.file);

      Jimp.read(req.file.path)
        .then((avatar) => {
          return avatar.resize(250, 250);
        })
        .catch((e) => console.error(e));
      const avatarName = req.file.originalname;
      const extensionIndex = avatarName.lastIndexOf(".");
      const extension = avatarName.slice(extensionIndex);
      const newAvatarName = `${user.email}_${user._id}${extension}`;
      const newAvatarPath = path.join(
        process.cwd(),
        "public/avatars",
        newAvatarName
      );
      try {
        await fs.rename(req.file.path, newAvatarPath);
        user.avatarURL = `/avatars/${newAvatarName}`;
        await user.save();
        return res.status(200).send({
          status: "OK",
          code: 200,
          update: { avatarURL: user.avatarURL },
        });
      } catch (error) {
        console.error(error);
        return null;
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ status: "Internal Server Error", code: 500 });
    }
  }
);

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
          avatarURL: gravatar.url(email, { d: "identicon" }),
        });
        await newUser.save();

        res.status(201).json({
          user: {
            email: newUser.email,
            subscription: newUser.subscription,
            avatarURL: newUser.avatarURL,
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

        if (!passwordComparison) {
          return res.status(401).json({
            status: "Unauthorized",
            code: 401,
            message: "Email or password is wrong",
          });
        } else {
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
