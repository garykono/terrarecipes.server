const catchAsync = require('../utils/catchAsync');
const { AppError, ERROR_NAME } = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures')

exports.getAll = Model => catchAsync(async (req, res, next) => {

    // To allow for nested GET reviews on tour. It's a small hack but it's fine for now
    // let filter = { tags: {$in: ['side']} };
    let filter = {};
    if (req.params.tourId) {
        filter = { tour: req.params.tourId };
    }

    const features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()

    //const doc = await features.query.explain();
    const doc = await features.query;

    // Count total number of pages for front end pagination
    let totalPages = 1;
    if (req.query.page) {
        const countPagesFeatures = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .limitFields()
        .countTotalResults();
        
        totalPages = Math.ceil((await countPagesFeatures.query) / (req.query.limit ? req.query.limit : 100));
    }

    // const doc = await Model.find()
    //     .where('duration')
    //     .equals(5)
    //     .where('difficulty')
    //     .equals('easy');

    res.status(200).json({
        status: 'success',
        results: doc.length,
        totalPages,
        data: {
            data: doc
        }
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