const jwt = require("jsonwebtoken");
const verifyAccessToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Thiếu token" });

  const token = authHeader.split(" ")[1];
  try {
    // console.log(token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded);
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token hết hạn hoặc không hợp lệ" });
  }
};

module.exports = verifyAccessToken;
