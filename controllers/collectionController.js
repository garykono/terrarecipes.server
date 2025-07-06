const Collection = require('../models/collectionModel')
const catchAsync = require('../utils/catchAsync')
const filterObj = require('../utils/filterObject')
const factory = require('./handlerFactory')

exports.updateMyCollection = catchAsync(async (req, res, next) => {
    // 1) Filtered out unwanted field names that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'author');

    // 2) Update the collection document
    const updatedCollection = await Collection.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true, 
        runValidators: true 
    });

    res.status(200).json({
        status: 'success',
        collection: updatedCollection
    });
});

exports.getAllCollections = factory.getAll(Collection);
exports.getCollection = factory.getOne(Collection, [
    {
        path: 'author',
        select: 'username'
    },
    { 
        path: 'recipes', 
        select: '-__v -description -directions'
    }
]);
exports.createCollection = factory.createOne(Collection);
exports.updateCollection = factory.updateOne(Collection);
exports.deleteCollection = factory.deleteOne(Collection);