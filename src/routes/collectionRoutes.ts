import express from 'express';
import { createCollection, deleteCollection, getAllCollections, getCollection, updateCollection } from '../controllers/collectionController';
import { assignAuthor, protect, restrictTo, setDataType, verifyAuthor } from '../controllers/authController';
import { parseInput } from '../middleware/parseInput';
import { normalizeRequest } from '../normalizers/normalizeRequest';
import { normalizeSearchRequest } from '../normalizers/normalizeSearchRequest';
import { COLLECTIONS_PROFILES, COLLECTIONS_PROFILE_MAPS } from '../policy/collections.policy';
import { compileSearch } from '../middleware/compileSearch';

const router = express.Router();

router.use(setDataType('collection'));

// NO AUTH REQUIRED


// LOGGED IN REQUIRED


// ADMIN ONLY 

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


// router.use(protect);
// router.use(restrictTo('admin'));

router.route('/')
    .get( 
        protect,
        restrictTo('admin'),
        parseInput({ profile: COLLECTIONS_PROFILES["getAll"], normalizer: normalizeSearchRequest }),
        compileSearch(COLLECTIONS_PROFILE_MAPS),
        getAllCollections
    )
    // only allow a logged in user to make collections for now
    // .post(
    //     protect, 
    //     parseInput({ profile: COLLECTIONS_PROFILES["create"], normalizer: normalizeRequest }),
    //     createCollection)

router.route('/:id')
    .get(getCollection)
    .patch( 
        protect,
        restrictTo('admin'),
        parseInput({ profile: COLLECTIONS_PROFILES["update"], normalizer: normalizeRequest }),
        updateCollection)
    .delete(
        protect,
        restrictTo('admin'),
        deleteCollection)

export default router;