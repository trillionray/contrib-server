const User = require('../models/User');

const bcrypt = require("bcryptjs");
const auth = require("../auth");
const { errorHandler } = require("../auth");

const {
    OAuth2Client
} = require("google-auth-library");

const googleClient =
    new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID
    );


// Check if email already exists
module.exports.checkEmailIfNotExist = (req, res) => {

    if (!req.body.email.includes("@")) {
        return res.status(400).send({
            message: "Invalid email format"
        });
    }

    return User.find({ email: req.body.email })
        .then(result => {

            if (result.length > 0) {
                return res.status(409).send({
                    message: "Duplicate email found"
                });
            }

            return res.status(200).send({
                message: "No duplicate email found"
            });
        })
        .catch(err => errorHandler(err, req, res));
};

// User Registration
module.exports.registerUser = (req, res) => {

    if (!req.body.email.includes("@")) {
        return res.status(400).send({
            message: "Invalid email format"
        });
    }

    // Designation is required
    if (!req.body.designation) {
        return res.status(400).send({
            message: "Designation is Required"
        });
    }

    // User ID is optional
    if (
        req.body.userId !== undefined &&
        req.body.userId !== null &&
        req.body.userId !== ""
    ) {
        if (!Number.isInteger(Number(req.body.userId))) {
            return res.status(400).send({
                message: "User ID must be a whole number"
            });
        }
    }

    return User.find({ email: req.body.email })
        .then(result => {

            if (result.length > 0) {
                return res.status(409).send({
                    message: "Duplicate email found"
                });
            }

            const newUser = new User({
                // Optional
                ...(req.body.userId !== undefined &&
                    req.body.userId !== null &&
                    req.body.userId !== "" && {
                        userId: Number(req.body.userId)
                    }),

                fullName: req.body.fullName,
                email: req.body.email,
                password: bcrypt.hashSync(req.body.password, 10),

                // Required
                designation: req.body.designation,

                isAdmin: false
            });

            return newUser.save()
                .then(result => res.status(201).send(result))
                .catch(err => errorHandler(err, req, res));

        })
        .catch(err => errorHandler(err, req, res));
};

// User Login
module.exports.loginUser = (req, res) => {

    if (!req.body.email.includes("@")) {
        return res.status(400).send({
            message: "Invalid email format"
        });
    }

    return User.findOne({ email: req.body.email })
        .then(result => {

            if (result == null) {
                return res.status(404).send({
                    message: "Email not found"
                });
            }

            const isPasswordCorrect = bcrypt.compareSync(
                req.body.password,
                result.password
            );

            if (isPasswordCorrect) {
                return res.send({
                    access: auth.createAccessToken(result)
                });
            }

            return res.status(401).send({
                message: "Incorrect password"
            });
        })
        .catch(err => errorHandler(err, req, res));
};

// Get User Profile
module.exports.getProfile = (req, res) => {

    return User.findById(req.user.id)
        .then(result => res.status(200).send(result))
        .catch(err => {

            console.log(err);

            return res.status(500).send({
                message: "Error retrieving profile"
            });
        });
};

// Google Login
module.exports.googleLogin = async (req, res) => {

    try {

        const { credential } = req.body;

        if (!credential) {
            return res.status(400).send({
                message: "Google credential is required"
            });
        }


        // Verify Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });


        const payload = ticket.getPayload();

        const {
            email,
            name,
            sub,
            email_verified
        } = payload;


        // Make sure Google verified the email
        if (!email_verified) {
            return res.status(401).send({
                message: "Google email is not verified"
            });
        }


        console.log("Google User:", {
            email,
            name,
            googleId: sub
        });


        // Check if user already exists
        let user = await User.findOne({
            email: email
        });


        // Create account if user doesn't exist
        if (!user) {

            user = new User({
                fullName: name,
                email: email,

                // Temporary password
                password: bcrypt.hashSync(
                    Math.random().toString(36),
                    10
                ),

                // Required by the schema
                designation: "User",

                // userId is intentionally omitted
                // because it is optional

                isAdmin: false
            });

            await user.save();
        }


        // Create your application's JWT
        const token =
            auth.createAccessToken(user);


        return res.status(200).send({
            access: token
        });

    } catch (error) {

        console.error(
            "GOOGLE LOGIN ERROR:",
            error
        );

        return res.status(401).send({
            message: "Invalid Google login"
        });

    }
};


// Get All Users
module.exports.getAllUsers = (req, res) => {

    return User.aggregate([

        // Sort users with User ID first,
        // then users without User ID last
        {
            $addFields: {
                userIdSort: {
                    $cond: [
                        {
                            $or: [
                                { $eq: ["$userId", null] },
                                { $not: ["$userId"] }
                            ]
                        },
                        1,
                        0
                    ]
                }
            }
        },

        {
            $sort: {
                userIdSort: 1,
                userId: 1
            }
        },

        // Remove password
        {
            $project: {
                password: 0,
                userIdSort: 0
            }
        }

    ])

    .then(result => {

        return res.status(200).send(result);

    })

    .catch(err =>
        errorHandler(err, req, res)
    );
};

// Add Member
module.exports.addMember = (req, res) => {

    // Designation is required
    if (!req.body.designation) {
        return res.status(400).send({
            message: "Designation is Required"
        });
    }


    // User ID is optional
    if (
        req.body.userId !== undefined &&
        req.body.userId !== null &&
        req.body.userId !== ""
    ) {

        if (!Number.isInteger(Number(req.body.userId))) {
            return res.status(400).send({
                message: "User ID must be a whole number"
            });
        }

    }


    // Full Name is required
    if (!req.body.fullName) {
        return res.status(400).send({
            message: "Full Name is Required"
        });
    }


    // Check User ID if provided
    const userIdQuery =
        req.body.userId !== undefined &&
        req.body.userId !== null &&
        req.body.userId !== ""
            ? {
                userId: Number(req.body.userId)
            }
            : null;


    const createMember = () => {

        const newUser = new User({

            // Optional User ID
            ...(req.body.userId !== undefined &&
                req.body.userId !== null &&
                req.body.userId !== "" && {
                    userId: Number(req.body.userId)
                }),

            fullName:
                req.body.fullName,

            // Email omitted
            // Password omitted
            // This member does not have a login account

            designation:
                req.body.designation,

            isAdmin:
                false

        });


        return newUser.save()
            .then(result => {

                return res.status(201).send(result);

            })
            .catch(err =>
                errorHandler(err, req, res)
            );

    };


    // No User ID provided
    if (!userIdQuery) {
        return createMember();
    }


    // Check duplicate User ID
    return User.findOne(userIdQuery)
        .then(existingUser => {

            if (existingUser) {

                return res.status(409).send({
                    message: "Duplicate User ID found"
                });

            }


            return createMember();

        })
        .catch(err =>
            errorHandler(err, req, res)
        );
};

// Update Member
module.exports.updateMember = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            userId,
            fullName,
            email,
            designation
        } = req.body;


        // ---------------------------------------------
        // Validation
        // ---------------------------------------------

        // Full Name is required
        if (!fullName || !fullName.trim()) {

            return res.status(400).send({
                message: "Full Name is Required"
            });

        }


        // Designation is required
        if (!designation || !designation.trim()) {

            return res.status(400).send({
                message: "Designation is Required"
            });

        }


        // User ID is optional
        if (
            userId !== undefined &&
            userId !== null &&
            userId !== ""
        ) {

            if (!Number.isInteger(Number(userId))) {

                return res.status(400).send({
                    message: "User ID must be a whole number"
                });

            }

        }


        // Email is optional
        if (
            email !== undefined &&
            email !== null &&
            email !== ""
        ) {

            if (!email.includes("@")) {

                return res.status(400).send({
                    message: "Invalid email format"
                });

            }

        }


        // ---------------------------------------------
        // Find Existing User
        // ---------------------------------------------

        const existingUser =
            await User.findById(id);

        if (!existingUser) {

            return res.status(404).send({
                message: "User not found"
            });

        }


        // ---------------------------------------------
        // Check Duplicate User ID
        // ---------------------------------------------

        if (
            userId !== undefined &&
            userId !== null &&
            userId !== ""
        ) {

            const duplicateUserId =
                await User.findOne({
                    userId: Number(userId),
                    _id: { $ne: id }
                });

            if (duplicateUserId) {

                return res.status(409).send({
                    message: "Duplicate User ID found"
                });

            }

        }


        // ---------------------------------------------
        // Check Duplicate Email
        // ---------------------------------------------

        if (
            email !== undefined &&
            email !== null &&
            email !== ""
        ) {

            const duplicateEmail =
                await User.findOne({
                    email: email,
                    _id: { $ne: id }
                });

            if (duplicateEmail) {

                return res.status(409).send({
                    message: "Duplicate email found"
                });

            }

        }


        // ---------------------------------------------
        // Update Fields
        // ---------------------------------------------

        existingUser.fullName =
            fullName.trim();

        existingUser.designation =
            designation.trim();


        // User ID
        if (
            userId === undefined ||
            userId === null ||
            userId === ""
        ) {

            // Remove User ID if cleared
            existingUser.userId = undefined;

        } else {

            existingUser.userId =
                Number(userId);

        }


        // Email
        if (
            email === undefined ||
            email === null ||
            email.trim() === ""
        ) {

            // Remove email if cleared
            existingUser.email = undefined;

        } else {

            existingUser.email =
                email.trim();

        }


        // ---------------------------------------------
        // Save
        // ---------------------------------------------

        const updatedUser =
            await existingUser.save();


        // ---------------------------------------------
        // Remove Password From Response
        // ---------------------------------------------

        const userResponse =
            updatedUser.toObject();

        delete userResponse.password;


        return res.status(200).send(
            userResponse
        );


    } catch (err) {

        console.error(
            "Update member error:",
            err
        );

        return errorHandler(
            err,
            req,
            res
        );

    }

};