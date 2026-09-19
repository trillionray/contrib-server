const Contribution = require('../models/Contribution');

const { errorHandler } = require('../auth');


// Create Contribution
module.exports.createContribution = (req, res) => {

    const newContribution = new Contribution({

        user:
            req.body.user,

        contributedTo:
            req.body.contributedTo,

        collectionType:
            req.body.collectionType,

        description:
            req.body.description,

        amount:
            req.body.amount

        // isDataAvailable is not required
        // Mongoose will use the default value: true

    });


    return newContribution.save()

        .then(result => {

            return res.status(201).send(result);

        })

        .catch(err =>
            errorHandler(err, req, res)
        );
};



// Get All Contributions
module.exports.getAllContributions = (req, res) => {

    return Contribution.aggregate([

        // Join User collection
        {
            $lookup: {

                from: "users",

                localField: "user",

                foreignField: "_id",

                as: "user"

            }
        },


        // Convert user array into an object
        {
            $unwind: {

                path: "$user",

                preserveNullAndEmptyArrays: true

            }
        },


        // Determine whether User ID exists
        {
            $addFields: {

                userIdSort: {

                    $cond: [

                        {
                            $or: [

                                {
                                    $eq: [
                                        "$user.userId",
                                        null
                                    ]
                                },

                                {
                                    $not: [
                                        "$user.userId"
                                    ]
                                }

                            ]
                        },

                        1,

                        0

                    ]

                }

            }

        },


        // Sort:
        // 1. Recent contributions first
        // 2. Users with User ID first
        // 3. User ID ascending
        {
            $sort: {

                createdAt: -1,

                userIdSort: 1,

                "user.userId": 1

            }

        },


        // Remove temporary field
        {
            $project: {

                userIdSort: 0,

                "user.password": 0

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

// Get All Available Contributions
module.exports.getAllAvailableContributions = (req, res) => {

    console.log("retrieving all unarchived... ")

    return Contribution.aggregate([

        // Only show available contributions
        {
            $match: {

                isDataAvailable: {
                    $ne: false
                }

            }

        },


        // Join User collection
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user"

            }

        },


        // Convert user array into an object
        {
            $unwind: {

                path: "$user",

                preserveNullAndEmptyArrays: true

            }

        },


        // Determine whether User ID exists
        {
            $addFields: {

                userIdSort: {

                    $cond: [

                        {
                            $or: [

                                {
                                    $eq: [
                                        "$user.userId",
                                        null
                                    ]
                                },

                                {
                                    $not: [
                                        "$user.userId"
                                    ]
                                }

                            ]

                        },

                        1,

                        0

                    ]

                }

            }

        },


        // Sort:
        // 1. Recent contributions first
        // 2. Users with User ID first
        // 3. User ID ascending
        {
            $sort: {

                createdAt: -1,

                userIdSort: 1,

                "user.userId": 1

            }

        },


        // Remove temporary field
        {
            $project: {

                userIdSort: 0,

                "user.password": 0

            }

        }

    ])

    .then(result => {
        console.log(result)
        return res.status(200).send(result);

    })

    .catch(err =>
        errorHandler(err, req, res)
    );
};



// Get Contribution by ID
module.exports.getContribution = (req, res) => {

    return Contribution.findById(
        req.params.contributionId
    )

        .populate(
            'user',
            'userId fullName email designation'
        )

        .then(result => {

            if (!result) {

                return res.status(404).send({

                    message:
                        'Contribution not found'

                });

            }


            return res.status(200).send(result);

        })

        .catch(err =>
            errorHandler(err, req, res)
        );

};



// Get Contributions by User
module.exports.getUserContributions = (req, res) => {

    return Contribution.find({

        user:
            req.params.userId

    })

        .populate(
            'user',
            'userId fullName email designation'
        )

        .sort({

            createdAt: -1

        })

        .then(result => {

            return res.status(200).send(result);

        })

        .catch(err =>
            errorHandler(err, req, res)
        );

};



// Update Contribution
module.exports.updateContribution = (req, res) => {

    const updates = {

        user:
            req.body.user,

        contributedTo:
            req.body.contributedTo,

        collectionType:
            req.body.collectionType,

        description:
            req.body.description,

        amount:
            req.body.amount,

        isDataAvailable:
            req.body.isDataAvailable

    };


    return Contribution.findByIdAndUpdate(

        req.params.contributionId,

        updates,

        {

            new: true,

            runValidators: true

        }

    )

        .populate(
            'user',
            'userId fullName email designation'
        )

        .then(result => {

            if (!result) {

                return res.status(404).send({

                    message:
                        'Contribution not found'

                });

            }


            return res.status(200).send(result);

        })

        .catch(err =>
            errorHandler(err, req, res)
        );

};



// Archive Contribution
module.exports.deleteContribution = (req, res) => {

    return Contribution.findByIdAndUpdate(

        req.params.contributionId,

        {
            isDataAvailable: false
        },

        {
            new: true
        }

    )

        .then(result => {

            if (!result) {

                return res.status(404).send({

                    message:
                        'Contribution not found'

                });

            }


            return res.status(200).send({

                message:
                    'Contribution archived successfully',

                contribution:
                    result

            });

        })

        .catch(err =>
            errorHandler(err, req, res)
        );
};



// Get All Distinct Contribution Purposes
module.exports.getDistinctContributedTo = (req, res) => {

    return Contribution.aggregate([

        // Ignore empty values
        {
            $match: {

                contributedTo: {

                    $exists: true,

                    $ne: ""

                }

            }

        },


        // Group regardless of casing
        {
            $group: {

                _id: {

                    $toLower: {

                        $trim: {

                            input:
                                "$contributedTo"

                        }

                    }

                },

                // Keep the first original casing
                contributedTo: {

                    $first:
                        "$contributedTo"

                }

            }

        },


        // Sort alphabetically
        {
            $sort: {

                contributedTo: 1

            }

        },


        // Return only contributedTo
        {
            $project: {

                _id: 0,

                contributedTo: 1

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


// Get All Distinct Collection Types
module.exports.getDistinctCollectionTypes = (req, res) => {

    return Contribution.aggregate([

        // Ignore empty values
        {
            $match: {

                collectionType: {

                    $exists: true,

                    $ne: ""

                }

            }

        },


        // Group regardless of casing
        {
            $group: {

                _id: {

                    $toLower: {

                        $trim: {

                            input:
                                "$collectionType"

                        }

                    }

                },

                // Keep the first original casing
                collectionType: {

                    $first:
                        "$collectionType"

                }

            }

        },


        // Sort alphabetically
        {
            $sort: {

                collectionType: 1

            }

        },


        // Return only collectionType
        {
            $project: {

                _id: 0,

                collectionType: 1

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