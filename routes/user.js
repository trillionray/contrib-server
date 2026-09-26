const express = require('express');
const userController = require('../controllers/user');

const router = express.Router();

const { verify, verifyAdmin } = require("../auth");

// Check if email already exists
router.post("/check-email", userController.checkEmailIfNotExist);

// Register
router.post("/register", userController.registerUser);

// Login
router.post("/login", userController.loginUser);

// Get profile
router.get("/details", verify, userController.getProfile);


router.post(
  "/google-login",
  userController.googleLogin
);


router.get(
    '/all', verify, verifyAdmin,
    userController.getAllUsers
);

// Add Member
router.post(
    '/add-member', 
    userController.addMember
);


router.put(
    "/:id",
    userController.updateMember
);

module.exports = router;