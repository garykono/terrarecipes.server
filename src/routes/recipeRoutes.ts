import express from 'express';
import { parseInput } from '../middleware/parseInput';
import { normalizeSearchRequest } from '../normalizers/normalizeSearchRequest';
import { normalizeRecipeWriteRequest } from '../normalizers/normalizeRecipeWriteRequest';
import { RECIPES_PROFILES, RECIPE_PROFILE_MAPS } from '../policy/recipes.policy';
import { compileSearch } from '../middleware/compileSearch';
import { assignAuthor, protect, restrictTo, setDataType, verifyAuthor } from '../controllers/authController';
import { addIdMatchSearchCondition, createRecipe, deleteRecipe, getAllRecipes, getRecipe, updateRecipe } from '../controllers/recipeController';

const router = express.Router();

router.use(setDataType('recipe'));

router.route('/myRecipes/')
    .get(
        protect,
        addIdMatchSearchCondition,
        parseInput({ profile: RECIPES_PROFILES["getAll"], normalizer: normalizeSearchRequest }),
        compileSearch(RECIPE_PROFILE_MAPS),
        getAllRecipes
    )
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
    // recipes can only be created by an existing account
    // .post(
    //     protect,
    //     parseInput({ profile: RECIPES_PROFILES["create"], normalizer: normalizeRecipeWriteRequest }),
    //     assignAuthor,
    //     createRecipe)

router.route('/:id')
    .get(getRecipe)
    .patch(
        protect,
        restrictTo('admin'),
        parseInput({ profile: RECIPES_PROFILES["update"], normalizer: normalizeRecipeWriteRequest }),
        updateRecipe)
    .delete(
        protect,
        restrictTo('admin'),
        deleteRecipe)

export default router;