import express from 'express';
import { parseInput } from '../middleware/parseInput';
import { normalizeSearchRequest } from '../normalizers/normalizeSearchRequest';
import { normalizeRecipeWriteRequest } from '../normalizers/normalizeRecipeWriteRequest';
import { RECIPES_PROFILES, RECIPE_PROFILE_MAPS } from '../policy/recipes.policy';
import { compileSearch } from '../middleware/compileSearch';
import { assignAuthor, protect, setDataType, verifyAuthor } from '../controllers/authController';
import { createRecipe, deleteRecipe, getAllRecipes, getRecipe, updateRecipe } from '../controllers/recipeController';

const router = express.Router();

router.use(setDataType('recipe'));

//router.param('id', checkID);

router.route('/myRecipes/')
    .post(
        protect,
        parseInput({ profile: RECIPES_PROFILES["create"], normalizer: normalizeRecipeWriteRequest }),
        assignAuthor,
        createRecipe)

router.route('/myRecipes/:id')
    .patch(
        protect,
        verifyAuthor, 
        parseInput({ profile: RECIPES_PROFILES["update"], normalizer: normalizeRecipeWriteRequest }),
        updateRecipe)
    .delete(
        protect,
        verifyAuthor, 
        deleteRecipe)


// Implement separate routes for users to do these functions for their own account
//router.use(restrictTo('admin'));

router.route('/')
    .get(
        parseInput({ profile: RECIPES_PROFILES["getAll"], normalizer: normalizeSearchRequest }),
        compileSearch(RECIPE_PROFILE_MAPS),
        getAllRecipes)
    .post(
        protect,
        parseInput({ profile: RECIPES_PROFILES["create"], normalizer: normalizeRecipeWriteRequest }),
        assignAuthor,
        createRecipe)

router.route('/:id')
    .get(getRecipe)
    .patch(
        parseInput({ profile: RECIPES_PROFILES["update"], normalizer: normalizeRecipeWriteRequest }),
        updateRecipe)
    .delete(
        deleteRecipe)

router.route('/search')
    .post(
        parseInput({ profile: RECIPES_PROFILES["getAll"], normalizer: normalizeSearchRequest }),
        compileSearch(RECIPE_PROFILE_MAPS),
        getAllRecipes
    )

export default router;