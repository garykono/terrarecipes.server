const express = require('express');
const collectionController = require('../controllers/collectionController');
const authController = require('../controllers/authController');
const { parseInput } = require('../middleware/parseInput');
const { normalizeRequest } = require('../normalizers/normalizeRequest');
const { COLLECTIONS_PROFILES } = require('../policy/collections.policy');

const router = express.Router();

router.use(authController.setDataType('collection'));

router.route('/myCollections/')
    .post(
        authController.protect,
        parseInput({ profile: COLLECTIONS_PROFILES["create"], normalizer: normalizeRequest }),
        authController.assignAuthor, 
        collectionController.createCollection)

router.route('/myCollections/:id')
    .patch(
        authController.protect,
        authController.verifyAuthor, 
        parseInput({ profile: COLLECTIONS_PROFILES["updateMe"], normalizer: normalizeRequest }),
        collectionController.updateCollection)
    .delete(
        authController.protect,
        authController.verifyAuthor, 
        collectionController.deleteCollection)


// Implement separate routes for users to do these functions for their own account
//router.use(authController.restrictTo('admin'));

router.route('/')
    .get( 
        parseInput({ profile: COLLECTIONS_PROFILES["getAll"], normalizer: normalizeRequest }),
        collectionController.getAllCollections
    )
    .post(
        authController.protect, 
        parseInput({ profile: COLLECTIONS_PROFILES["create"], normalizer: normalizeRequest }),
        collectionController.createCollection)

router.route('/:id')
    .get(collectionController.getCollection)
    .patch( 
        parseInput({ profile: COLLECTIONS_PROFILES["update"], normalizer: normalizeRequest }),
        collectionController.updateCollection)
    .delete(
        collectionController.deleteCollection)

module.exports = router;