const catchAsync = require('../utils/catchAsync');
const { AppError, ERROR_NAME } = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures')
const { buildPipelineFromQuery } = require('../utils/buildPipelineFromQuery');
const { buildSortFilter } = require('../utils/searchUtils');

exports.getAll = (Model) => catchAsync(async (req, res, next) => {
    const {
      customFilter = {},          // e.g., { $or: [...] }
      addFields,
      useAggregate = false,
      sortBy = 'name',      // default sort
      fields,        // string like 'name quantity' (equivalent to .select())
    } = req.options;

    let results;
    let totalCount;
    let totalPages;

    // Querying with Model.aggregate() for anything more than simple queries and when we need pagination
    if (useAggregate) {
        const pipeline = [];

        if (customFilter) {
            pipeline.push({ $match: customFilter });
        }

        if (addFields) {
            pipeline.push({ $addFields: addFields });
        }

        if (sortBy) {
            pipeline.push({ $sort: buildSortFilter(sortBy) });
        }
        
        // Handles pagination 
        pipeline.push(...buildPipelineFromQuery(req.query));

        // Need to implement eventually: select which fields to return
        
        const [aggregated] = await Model.aggregate(pipeline);

        results = aggregated.results;
        totalCount = aggregated.totalCount;
        totalPages = aggregated.totalPages;
    } else {
        // Use Model.find() for basic queries
        const features = new APIFeatures(Model.find(), req.query)
            .addQueryFilters()
            .addCustomFilters(customFilter)
            .applyFilters()
            .sort(sortBy)
            .limitFields()
            .paginate()

        // This is when the query is actually sent to the database
        const doc = await features.query;
        results = doc;
        totalCount = doc.length;
        totalPages = 1;
    }

    res.status(200).json({
        status: 'success',
        results: totalCount,
        totalPages,
        data: {
            data: results
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