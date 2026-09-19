const Contribution = require('../models/Contribution');
const { errorHandler } = require('../auth');

// Create Contribution
module.exports.createContribution = (req, res) => {

    const newContribution = new Contribution({
        user: req.body.user,
        contributedTo: req.body.contributedTo,
        description: req.body.description,
        amount: req.body.amount
    });

    return newContribution.save()
        .then(result => {
            return res.status(201).send(result);
        })
        .catch(err => errorHandler(err, req, res));
};

// Get All Contributions
module.exports.getAllContributions = (req, res) => {

    return Contribution.find()
        .populate('user', 'userId fullName email designation')
        .sort({ createdAt: -1 })
        .then(result => {
            return res.status(200).send(result);
        })
        .catch(err => errorHandler(err, req, res));
};

// Get Contribution by ID
module.exports.getContribution = (req, res) => {

    return Contribution.findById(req.params.contributionId)
        .populate('user', 'userId fullName email designation')
        .then(result => {

            if (!result) {
                return res.status(404).send({
                    message: 'Contribution not found'
                });
            }

            return res.status(200).send(result);
        })
        .catch(err => errorHandler(err, req, res));
};

// Get Contributions by User
module.exports.getUserContributions = (req, res) => {

    return Contribution.find({
        user: req.params.userId
    })
        .populate('user', 'userId fullName email designation')
        .sort({ createdAt: -1 })
        .then(result => {
            return res.status(200).send(result);
        })
        .catch(err => errorHandler(err, req, res));
};

// Update Contribution
module.exports.updateContribution = (req, res) => {

    const updates = {
        user: req.body.user,
        contributedTo: req.body.contributedTo,
        description: req.body.description,
        amount: req.body.amount
    };

    return Contribution.findByIdAndUpdate(
        req.params.contributionId,
        updates,
        {
            new: true,
            runValidators: true
        }
    )
        .populate('user', 'userId fullName email designation')
        .then(result => {

            if (!result) {
                return res.status(404).send({
                    message: 'Contribution not found'
                });
            }

            return res.status(200).send(result);
        })
        .catch(err => errorHandler(err, req, res));
};

// Delete Contribution
module.exports.deleteContribution = (req, res) => {

    return Contribution.findByIdAndDelete(
        req.params.contributionId
    )
        .then(result => {

            if (!result) {
                return res.status(404).send({
                    message: 'Contribution not found'
                });
            }

            return res.status(200).send({
                message: 'Contribution deleted successfully'
            });
        })
        .catch(err => errorHandler(err, req, res));
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
                            input: "$contributedTo"
                        }
                    }
                },

                // Keep the first original casing
                contributedTo: {
                    $first: "$contributedTo"
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

            console.log(result)

            return res.status(200).send(result);

        })
        .catch(err =>
            errorHandler(err, req, res)
        );
};
