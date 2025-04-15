const express = require('express');
const collectionController = require('../controllers/collectionController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.setDataType('collection'));

router.route('/myCollections/')
    .post(
        authController.protect,
        authController.assignAuthor, 
        collectionController.createCollection)

router.route('/myCollections/:id')
    .patch(
        authController.protect,
        authController.verifyAuthor, 
        collectionController.updateCollection)
    .delete(
        authController.protect,
        authController.verifyAuthor, 
        collectionController.deleteCollection)


// Implement separate routes for users to do these functions for their own account
//router.use(authController.restrictTo('admin'));

router.route('/')
    .get(collectionController.getAllCollections)
    .post(
        authController.protect,
        collectionController.createCollection)

router.route('/:id')
    .get(collectionController.getCollection)
    .patch(
        collectionController.updateCollection)
    .delete(
        collectionController.deleteCollection)

module.exports = router;