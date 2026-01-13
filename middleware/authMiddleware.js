import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({
        message: 'Access token is missing'
      });
    }

    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      return res.status(401).json({
        message: 'Invalid token: user not found'
      });
    }

    // Attach user to request for controllers
    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token'
    });
  }
};

export default verifyJWT;
