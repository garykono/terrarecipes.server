const catchAsync = require('../utils/catchAsync');
const { AppError, ERROR_NAME } = require('../utils/appError');
const { searchDocuments } = require('../utils/searchUtils/searchExecution');

exports.getAll = (Model) => catchAsync(async (req, res, next) => {
    const { results, totalCount, totalPages } = await searchDocuments(
        Model,
        req.options,
        req.query
    );

    res.status(200).json({
        status: 'success',
        results: totalCount,
        totalPages,
        data: { data: results }
    });
});

exports.getOne = (Model, popOptions = []) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id)
        .populate(popOptions);
    // if (popOptions) {
    //     query = query.populate(popOptions);
    // }
    const doc = await query;

    if (!doc) {
        return next(new AppError(404, ERROR_NAME.RESOURCE_NOT_FOUND, 'No resource found with that ID'));
    }

    res.status(200).json({
        status: 'success',
        data: {
            doc
        }
    });
});

exports.createOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            doc: doc
        }
    });
});

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    // This updates the document. If we used "PUT", then we would replace the whole doc with our new object
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })
    
    if (!doc) {
        return next(new AppError(404, ERROR_NAME.RESOURCE_NOT_FOUND, 'No resource found with that ID'));
    }
    
    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    });
    
});

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
        return next(new AppError(404, ERROR_NAME.RESOURCE_NOT_FOUND, 'No resource found with that ID'));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});