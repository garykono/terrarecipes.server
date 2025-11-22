import express from 'express';
import { createCollection, deleteCollection, getAllCollections, getCollection, updateCollection } from '../controllers/collectionController';
import { assignAuthor, protect, setDataType, verifyAuthor } from '../controllers/authController';
import { parseInput } from '../middleware/parseInput';
import { normalizeRequest } from '../normalizers/normalizeRequest';
import { normalizeSearchRequest } from '../normalizers/normalizeSearchRequest';
import { COLLECTIONS_PROFILES, COLLECTIONS_PROFILE_MAPS } from '../policy/collections.policy';
import { compileSearch } from '../middleware/compileSearch';

const router = express.Router();

router.use(setDataType('collection'));

router.route('/myCollections/')
    .post(
        protect,
        parseInput({ profile: COLLECTIONS_PROFILES["create"], normalizer: normalizeRequest }),
        assignAuthor, 
        createCollection)

router.route('/myCollections/:id')
    .patch(
        protect,
        verifyAuthor, 
        parseInput({ profile: COLLECTIONS_PROFILES["updateMe"], normalizer: normalizeRequest }),
        updateCollection)
    .delete(
        protect,
        verifyAuthor, 
        deleteCollection)


// Implement separate routes for users to do these functions for their own account
//router.use(restrictTo('admin'));

router.route('/')
    .get( 
        parseInput({ profile: COLLECTIONS_PROFILES["getAll"], normalizer: normalizeSearchRequest }),
        compileSearch(COLLECTIONS_PROFILE_MAPS),
        getAllCollections
    )
    .post(
        protect, 
        parseInput({ profile: COLLECTIONS_PROFILES["create"], normalizer: normalizeRequest }),
        createCollection)

router.route('/:id')
    .get(getCollection)
    .patch( 
        parseInput({ profile: COLLECTIONS_PROFILES["update"], normalizer: normalizeRequest }),
        updateCollection)
    .delete(
        deleteCollection)

export default router;