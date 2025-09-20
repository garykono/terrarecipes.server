const express = require('express');
const recipeController = require('../controllers/recipeController');
const authController = require('../controllers/authController');
const { parseRecipeQuery, parseRecipeAdvancedBody } = require('../middleware/recipes.parse');

const router = express.Router();

router.use(authController.setDataType('recipe'));

//router.param('id', recipeController.checkID);

router.route('/myRecipes/')
    .post(
        authController.protect,
        authController.assignAuthor,
        recipeController.computeTotalCookTime,
        recipeController.normalizeTags,
        recipeController.createRecipe)

router.route('/myRecipes/:id')
    .patch(
        authController.protect,
        authController.verifyAuthor, 
        recipeController.computeTotalCookTime,
        recipeController.normalizeTags,
        recipeController.updateRecipe)
    .delete(
        authController.protect,
        authController.verifyAuthor, 
        recipeController.deleteRecipe)


// Implement separate routes for users to do these functions for their own account
//router.use(authController.restrictTo('admin'));

router.route('/')
    .get(
        parseRecipeQuery("getAll"),
        recipeController.search,
        recipeController.getAllRecipes)
    .post(
        authController.protect,
        recipeController.computeTotalCookTime,
        recipeController.normalizeTags,
        recipeController.createRecipe)

router.route('/:id')
    .get(recipeController.getRecipe)
    .patch(
        recipeController.computeTotalCookTime,
        recipeController.normalizeTags,
        recipeController.updateRecipe)
    .delete(
        recipeController.deleteRecipe)

router.route('/search')
    .post(
        parseRecipeAdvancedBody("getAll"),
        recipeController.search,
        recipeController.getAllRecipes
    )

module.exports = router;