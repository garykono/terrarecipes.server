import { CollectionModel } from '../models/collectionModel';
const factory = require('./handlerFactory')

export const getAllCollections = factory.getAll(CollectionModel);
export const getCollection = factory.getOne(CollectionModel, [
    {
        path: 'author',
        select: 'username'
    },
    { 
        path: 'recipes', 
        select: '-__v -description -directions'
    }
]);
export const createCollection = factory.createOne(CollectionModel);
export const updateCollection = factory.updateOne(CollectionModel);
export const deleteCollection = factory.deleteOne(CollectionModel);