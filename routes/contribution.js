const express = require('express');

const contributionController =
    require('../controllers/contribution');
const { verify, verifyAdmin } = require("../auth");


const router = express.Router();


router.get(
    '/', verify, verifyAdmin,
    contributionController.getAllAvailableContributions
);



// Create Contribution
router.post(
    '/create',
    contributionController.createContribution
);


// Get All Contributions
router.get(
    '/all', verify, verifyAdmin,
    contributionController.getAllContributions
);


router.get(
    '/collection-types',
    contributionController.getDistinctCollectionTypes
);

// Get Distinct Contribution Purposes
router.get(
    '/contributed-to',
    contributionController.getDistinctContributedTo
);


// Get Contributions by User
router.get(
    '/user/:userId',
    contributionController.getUserContributions
);


// Get Contribution by ID
router.get(
    '/:contributionId',
    contributionController.getContribution
);


// Update Contribution
router.put(
    '/:contributionId',
    contributionController.updateContribution
);


// Delete Contribution
router.delete(
    '/:contributionId',
    contributionController.deleteContribution
);


module.exports = router;