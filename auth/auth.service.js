const { secret } = require("../config");
const jwt = require("jsonwebtoken");

const tokenFromHeaders = (headers) => {
  return headers.authorization?.replace("Bearer ", "");
};

const authMiddleware = async (req, res, next) => {
  try {
    const token = tokenFromHeaders(req.headers);
    console.log("auth", token);

    const decodedToken = jwt.verify(token, secret);
    const userId = decodedToken.userId;
    console.log("decodedToken", userId);

    if (!decodedToken) {
      res.status(401).json({
        status: "Unauthorized",
        code: 401,
        message: "Not authorized",
      });
    }

    req.userId = userId;
    next();
  } catch (error) {
    return res.status(401).send({ message: error.message });
  }
};

module.exports = {
  authMiddleware,
};
