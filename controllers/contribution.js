const Contribution = require('../models/Contribution');

const { errorHandler } = require('../auth');


// Create Contribution
module.exports.createContribution = (req, res) => {

    const newContribution = new Contribution({

        user:
            req.body.user,

        // =========================
        // Contribution Date
        // =========================

        date:
            req.body.date
                ? new Date(
                    `${req.body.date}T00:00:00+08:00`
                )
                : new Date(),

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
        // 1. Recent contribution date first
        // 2. Users with User ID first
        // 3. User ID ascending
        {
            $sort: {

                date: -1,

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

    console.log(
        "retrieving all unarchived... "
    );


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
        // 1. Recent contribution date first
        // 2. Users with User ID first
        // 3. User ID ascending
        {
            $sort: {

                date: -1,

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

        console.log(result);

        return res.status(200).send(result);

    })

    .catch(err =>
        errorHandler(err, req, res)
    );
};


module.exports.createReport = async (req, res) => {

    try {

        // =========================
        // Get Request Body
        // Case-insensitive fields
        // =========================

        const body =
            req.body || {};


        const getBodyValue = (
            fieldName
        ) => {

            const key =
                Object.keys(body)
                    .find(
                        key =>
                            key.toLowerCase() ===
                            fieldName.toLowerCase()
                    );


            return key
                ? body[key]
                : undefined;

        };


        const name =
            getBodyValue("name");

        const startDate =
            getBodyValue("startDate");

        const endDate =
            getBodyValue("endDate");

        const collectionType =
            getBodyValue("collectionType");

        const contributedTo =
            getBodyValue("contributedTo");

        const groupBy =
            getBodyValue("groupBy");


        console.log(
            name,
            startDate,
            endDate,
            collectionType,
            contributedTo,
            groupBy
        );


        // =========================
        // Validate Dates
        // =========================

        if (
            !startDate ||
            !endDate
        ) {

            return res.status(400).send({

                message:
                    "Start date and end date are required."

            });

        }


        // =========================
        // Date Range
        // =========================
        // Philippine time (UTC+8)

        const start =
            new Date(
                `${startDate}T00:00:00+08:00`
            );


        const end =
            new Date(
                `${endDate}T23:59:59.999+08:00`
            );


        if (
            isNaN(start.getTime()) ||
            isNaN(end.getTime())
        ) {

            return res.status(400).send({

                message:
                    "Invalid date range."

            });

        }


        if (
            start > end
        ) {

            return res.status(400).send({

                message:
                    "Start date cannot be later than end date."

            });

        }


        // =========================
        // Validate Group By
        // =========================

        const allowedGroupBy = [

            "user",

            "contributedTo",

            "collectionType",

            "date-user"

        ];


        const selectedGroupBy =
            typeof groupBy === "string" &&
            allowedGroupBy.includes(
                groupBy.trim()
            )
                ? groupBy.trim()
                : "";


        // =========================
        // Build Query
        // =========================

        const query = {

            isDataAvailable: {
                $ne: false
            },

            date: {

                $gte: start,

                $lte: end

            }

        };


        // =========================
        // Collection Type
        // Case-insensitive
        // =========================

        if (

            typeof collectionType ===
            "string" &&

            collectionType.trim()

        ) {

            query.collectionType = {

                $regex:
                    collectionType.trim(),

                $options:
                    "i"

            };

        }


        // =========================
        // Contributed To
        // Case-insensitive
        // =========================

        if (

            typeof contributedTo ===
            "string" &&

            contributedTo.trim()

        ) {

            query.contributedTo = {

                $regex:
                    contributedTo.trim(),

                $options:
                    "i"

            };

        }


        // =========================
        // Get Contributions
        // =========================

        let contributions =
            await Contribution.find(
                query
            )

            .populate(
                "user",
                "-password"
            )

            .sort({

                date: 1

            });


        // =========================
        // Filter By Name
        // Case-insensitive
        // =========================

        if (

            typeof name ===
            "string" &&

            name.trim()

        ) {

            const searchName =
                name
                    .trim()
                    .toLowerCase();


            contributions =
                contributions.filter(
                    contribution => {

                        return (

                            contribution.user &&

                            contribution.user.fullName &&

                            contribution.user.fullName
                                .toLowerCase()
                                .includes(
                                    searchName
                                )

                        );

                    }
                );

        }


        // =========================
        // Calculate Total
        // =========================

        const totalAmount =
            contributions.reduce(

                (
                    total,
                    contribution
                ) => {

                    return (

                        total +

                        Number(
                            contribution.amount
                        ) || 0

                    );

                },

                0

            );


        // =========================
        // Format Report Data
        // =========================

        const report =
            contributions.map(
                contribution => ({

                    _id:
                        contribution._id,

                    date:
                        contribution.date,

                    user:
                        contribution.user
                            ? {

                                _id:
                                    contribution.user._id,

                                userId:
                                    contribution.user.userId,

                                fullName:
                                    contribution.user.fullName,

                                designation:
                                    contribution.user.designation,

                                isAdmin:
                                    contribution.user.isAdmin

                            }
                            : null,

                    contributedTo:
                        contribution.contributedTo,

                    collectionType:
                        contribution.collectionType,

                    description:
                        contribution.description,

                    amount:
                        Number(
                            contribution.amount
                        ) || 0

                })

            );


        // =========================
        // Group Contributions
        // =========================

        const groups = {};


        if (selectedGroupBy) {

            report.forEach(
                contribution => {

                    let key;
                    let groupLabel;


                    // =========================
                    // Group By User
                    // =========================

                    if (
                        selectedGroupBy ===
                        "user"
                    ) {

                        key =
                            contribution.user?._id
                                ?.toString() ||
                            "unknown";

                        groupLabel =
                            contribution.user?.fullName ||
                            "Unknown User";

                    }


                    // =========================
                    // Group By Contributed To
                    // =========================

                    else if (
                        selectedGroupBy ===
                        "contributedTo"
                    ) {

                        const value =
                            contribution.contributedTo ||
                            "Unspecified";

                        key =
                            value
                                .trim()
                                .toLowerCase();

                        groupLabel =
                            value;

                    }


                    // =========================
                    // Group By Collection Type
                    // =========================

                    else if (
                        selectedGroupBy ===
                        "collectionType"
                    ) {

                        const value =
                            contribution.collectionType ||
                            "Unspecified";

                        key =
                            value
                                .trim()
                                .toLowerCase();

                        groupLabel =
                            value;

                    }


                    // =========================
                    // Group By Date + User
                    // =========================

                    else if (
                        selectedGroupBy ===
                        "date-user"
                    ) {

                        const date =
                            new Date(
                                contribution.date
                            );


                        const dateKey =
                            new Intl.DateTimeFormat(
                                "en-CA",
                                {
                                    timeZone:
                                        "Asia/Manila",
                                    year:
                                        "numeric",
                                    month:
                                        "2-digit",
                                    day:
                                        "2-digit"
                                }
                            ).format(date);


                        const userId =
                            contribution.user?._id
                                ?.toString() ||
                            "unknown";


                        key =
                            `${dateKey}-${userId}`;


                        groupLabel =
                            contribution.user?.fullName ||
                            "Unknown User";

                    }


                    // =========================
                    // Create Group
                    // =========================

                    if (!groups[key]) {

                        groups[key] = {

                            key,

                            groupBy:
                                selectedGroupBy,

                            groupLabel,

                            user:
                                contribution.user
                                    ? {

                                        _id:
                                            contribution.user._id,

                                        userId:
                                            contribution.user.userId,

                                        fullName:
                                            contribution.user.fullName

                                    }
                                    : null,

                            date:
                                selectedGroupBy ===
                                "date-user"
                                    ? contribution.date
                                    : null,

                            contributedTo:
                                selectedGroupBy ===
                                "contributedTo"
                                    ? contribution.contributedTo
                                    : null,

                            collectionType:
                                selectedGroupBy ===
                                "collectionType"
                                    ? contribution.collectionType
                                    : null,

                            contributions: [],

                            totalAmount: 0

                        };

                    }


                    // =========================
                    // Add Contribution
                    // =========================

                    groups[key]
                        .contributions
                        .push(
                            contribution
                        );


                    // =========================
                    // Add Amount
                    // =========================

                    groups[key]
                        .totalAmount +=
                        Number(
                            contribution.amount
                        ) || 0;

                }
            );

        }


        // =========================
        // Convert Groups To Array
        // =========================

        let groupedReport =
            Object.values(
                groups
            );


        // =========================
        // Sort Groups
        // =========================

        if (
            selectedGroupBy ===
            "date-user"
        ) {

            groupedReport.sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            );

        } else {

            groupedReport.sort(
                (a, b) =>
                    a.groupLabel
                        .localeCompare(
                            b.groupLabel
                        )
            );

        }


        // =========================
        // Response
        // =========================

        return res.status(200).send({

            filters: {

                name:
                    name || null,

                startDate:
                    start,

                endDate:
                    end,

                collectionType:
                    collectionType || null,

                contributedTo:
                    contributedTo || null,

                groupBy:
                    selectedGroupBy || null

            },

            count:
                report.length,

            totalAmount,

            groupBy:
                selectedGroupBy || null,

            contributions:
                report,

            groups:
                groupedReport

        });


    } catch (err) {

        console.error(
            "Create report error:",
            err
        );


        return errorHandler(
            err,
            req,
            res
        );

    }

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


            return res.status(200).send(
                result
            );

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

            date: -1

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

    const updates = {};


    // =========================
    // User
    // =========================

    if (
        req.body.user !== undefined
    ) {

        updates.user =
            req.body.user;

    }


    // =========================
    // Date
    // =========================

    if (
        req.body.date !== undefined
    ) {

        const contributionDate =
            new Date(
                `${req.body.date}T00:00:00+08:00`
            );


        if (
            isNaN(
                contributionDate.getTime()
            )
        ) {

            return res.status(400).send({

                message:
                    'Invalid contribution date'

            });

        }


        updates.date =
            contributionDate;

    }


    // =========================
    // Contributed To
    // =========================

    if (
        req.body.contributedTo !== undefined
    ) {

        updates.contributedTo =
            req.body.contributedTo;

    }


    // =========================
    // Collection Type
    // =========================

    if (
        req.body.collectionType !== undefined
    ) {

        updates.collectionType =
            req.body.collectionType;

    }


    // =========================
    // Description
    // =========================

    if (
        req.body.description !== undefined
    ) {

        updates.description =
            req.body.description;

    }


    // =========================
    // Amount
    // =========================

    if (
        req.body.amount !== undefined
    ) {

        updates.amount =
            req.body.amount;

    }


    // =========================
    // Data Availability
    // =========================

    if (
        req.body.isDataAvailable !== undefined
    ) {

        updates.isDataAvailable =
            req.body.isDataAvailable;

    }


    // =========================
    // Update
    // =========================

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


            return res.status(200).send(
                result
            );

        })

        .catch(err =>
            errorHandler(
                err,
                req,
                res
            )
        );

};


// Archive Contribution
module.exports.deleteContribution = (req, res) => {

    return Contribution.findByIdAndUpdate(

        req.params.contributionId,

        {

            isDataAvailable:
                false

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

            console.log(result);

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