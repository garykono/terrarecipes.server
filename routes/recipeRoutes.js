const express = require('express');
const recipeController = require('../controllers/recipeController');
const authController = require('../controllers/authController');
const { parseInput } = require('../middleware/parseInput');
const { normalizeSearchRequest } = require('../normalizers/normalizeSearchRequest');
const { normalizeRecipeWriteRequest } = require('../normalizers/normalizeRecipeWriteRequest');
const { RECIPES_PROFILES, RECIPE_PROFILE_MAPS } = require('../policy/recipes.policy');
const { compileSearch } = require('../middleware/compileSearch');

const router = express.Router();

router.use(authController.setDataType('recipe'));

//router.param('id', recipeController.checkID);

router.route('/myRecipes/')
    .post(
        authController.protect,
        parseInput({ profile: RECIPES_PROFILES["create"], normalizer: normalizeRecipeWriteRequest }),
        authController.assignAuthor,
        recipeController.createRecipe)

router.route('/myRecipes/:id')
    .patch(
        authController.protect,
        authController.verifyAuthor, 
        parseInput({ profile: RECIPES_PROFILES["update"], normalizer: normalizeRecipeWriteRequest }),
        recipeController.updateRecipe)
    .delete(
        authController.protect,
        authController.verifyAuthor, 
        recipeController.deleteRecipe)


// Implement separate routes for users to do these functions for their own account
//router.use(authController.restrictTo('admin'));

router.route('/')
    .get(
        parseInput({ profile: RECIPES_PROFILES["getAll"], normalizer: normalizeSearchRequest }),
        compileSearch(RECIPE_PROFILE_MAPS),
        recipeController.getAllRecipes)
    .post(
        authController.protect,
        parseInput({ profile: RECIPES_PROFILES["create"], normalizer: normalizeRecipeWriteRequest }),
        authController.assignAuthor,
        recipeController.createRecipe)

router.route('/:id')
    .get(recipeController.getRecipe)
    .patch(
        parseInput({ profile: RECIPES_PROFILES["update"], normalizer: normalizeRecipeWriteRequest }),
        recipeController.updateRecipe)
    .delete(
        recipeController.deleteRecipe)

router.route('/search')
    .post(
        parseInput({ profile: RECIPES_PROFILES["getAll"], normalizer: normalizeSearchRequest }),
        compileSearch(RECIPE_PROFILE_MAPS),
        recipeController.getAllRecipes
    )

module.exports = router;