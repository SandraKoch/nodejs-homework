const { User } = require("./user.model");
const { userValidation } = require("./user.validator");
const bcrypt = require("bcryptjs");
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { secret, emailAddress, emailPassword, baseUrl } = require("../config");
const { authMiddleware, invalidateToken } = require("../auth/auth.middleware");
const fs = require("fs/promises");
const gravatar = require("gravatar");
const multer = require("multer");
const path = require("path");
const Jimp = require("jimp");
const nodemailer = require("nodemailer");
const uuid = require("uuid");

router.post("/verify", async (req, res) => {
  try {
    const { email, verify } = req.body;
    const user = await User.findOne({ email });

    if (!email) {
      res.status(400).json({
        status: "Bad request",
        code: 400,
        message: "Missing required email field",
      });
    }
    if (verify === true) {
      res.status(400).json({
        status: "Bad request",
        code: 400,
        message: "Verification has already been passed",
      });
    }

    //another attempt to send a new verification token
    const verificationToken = uuid.v4();
    user.verificationToken = verificationToken;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailAddress,
        pass: emailPassword,
      },
    });

    const mailOptions = {
      from: emailAddress,
      to: emailAddress,
      subject: "Email Signup Verification",
      text: `Click the following link to verify your email: ${baseUrl}/api/users/verify/${verificationToken}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: "Email sending failed" });
      } else {
        console.log("Email sent: " + info.response);
        return res.status(200).json({
          status: "OK",
          code: 200,
          message: "Verification email sent",
        });
      }
    });
  } catch (error) {}
});

router.get("/verify/:verificationToken", async (req, res) => {
  const verificationToken = req.params.verificationToken;

  try {
    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res
        .status(404)
        .json({ status: "Not found", code: 404, message: "User not found" });
    }

    if (user.verify === true) {
      return res.status(400).json({
        status: "Bad request",
        code: 400,
        message: "Verification has already been passed",
      });
    }
    user.verify = true;
    await user.save();
    return res.status(200).json({
      status: "OK",
      code: 200,
      message:
        "Your email was verified successfully! You can log in now and start using this app",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

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
        //email verification
        const verificationToken = uuid.v4();
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: emailAddress,
            pass: emailPassword,
          },
        });

        const mailOptions = {
          from: emailAddress,
          to: emailAddress,
          subject: "Email Signup Verification",
          text: `Click the following link to verify your email: ${baseUrl}/api/users/verify/${verificationToken}`,
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.error(error);
            return res.status(500).json({ message: "Email sending failed" });
          } else {
            console.log("Email sent: " + info.response);
          }
        });
        //user password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const newUser = new User({
          email,
          password: hash,
          avatarURL: gravatar.url(email, { d: "identicon" }),
          verificationToken,
        });
        await newUser.save();

        res.status(201).json({
          user: {
            email: newUser.email,
            subscription: newUser.subscription,
            avatarURL: newUser.avatarURL,
            verify: newUser.verify,
            verificationToken: newUser.verificationToken,
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
