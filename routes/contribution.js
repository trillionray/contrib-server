const express = require('express');

const contributionController =
    require('../controllers/contribution');

const router = express.Router();


// Create Contribution
router.post(
    '/create',
    contributionController.createContribution
);


// Get All Contributions
router.get(
    '/all',
    contributionController.getAllContributions
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