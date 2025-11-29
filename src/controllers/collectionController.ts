import { CollectionModel } from '../models/collectionModel';
import { createOne, deleteOne, getAll, getOne, updateOne } from './handlerFactory';

export const getAllCollections = getAll(CollectionModel);
export const getCollection = getOne(CollectionModel, [
    {
        path: 'author',
        select: 'username'
    },
    { 
        path: 'recipes', 
        select: '-__v -description -directions'
    }
]);
export const createCollection = createOne(CollectionModel);
export const updateCollection = updateOne(CollectionModel);
export const deleteCollection = deleteOne(CollectionModel);