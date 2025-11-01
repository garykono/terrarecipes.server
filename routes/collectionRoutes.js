const express = require('express');
const collectionController = require('../controllers/collectionController');
const authController = require('../controllers/authController');
const { parseInput } = require('../middleware/parseInput');
const { normalizeRequest } = require('../normalizers/normalizeRequest');
const { normalizeSearchRequest } = require('../normalizers/normalizeSearchRequest');
const { COLLECTIONS_PROFILES, COLLECTIONS_PROFILE_MAPS } = require('../policy/collections.policy');
const { compileSearch } = require('../middleware/compileSearch');

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
        parseInput({ profile: COLLECTIONS_PROFILES["getAll"], normalizer: normalizeSearchRequest }),
        compileSearch(COLLECTIONS_PROFILE_MAPS),
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