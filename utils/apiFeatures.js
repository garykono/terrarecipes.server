const { buildSortFilter } = require("./searchUtils/searchHelpers");

class APIFeatures {
    /**
     * 
     * 
     * @param {Query} query - A mongoose Query
     * @param {String} queryString - The String in an html request that gives query requests (ex. limit=5)
     */
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
        this.baseFilter = {};
        this.totalPages = 1;
    }

    /**
     * 
     * @returns A query that is filtered by all given query fields except the features handled manually in this class (ex. sort)
     */
    addQueryFilters () {
        const queryObj = {...this.queryString};
        const excludedFields = ['page', 'sort', 'limit', 'fields', 'search', 'searchFields'];
        excludedFields.forEach(el => delete queryObj[el]);

        let queryStr = JSON.stringify(queryObj);
        // Just putting $ in front of these expressions so we can query. We used regular expressions here but they're complicated.
        // Can just write my own logic to do that.
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        
        this.baseFilter = { ...this.baseFilter, ...JSON.parse(queryStr) };

        return this;
    }

    /**
     * Add filters that are more directly applied to the query like "$or".
     * @param {*} customFilter 
     * @returns 
     */
    addCustomFilters(customFilter) {
        if (customFilter && typeof customFilter === 'object') {
            // Merge custom filter like $or with existing baseFilter
            this.baseFilter = { ...this.baseFilter, ...customFilter };
        }
        return this;
    }

    /**
     * Actually submit the query with all accumulated filters
     * @returns 
     */
    applyFilters() {
        this.query = this.query.find(this.baseFilter);
        return this;
    }

    /**
     * 
     * @returns Query with values sorted in ascending order if sort=(insert field here) or descending if sort=-(insert field here)
     */
    sort(sort) {
        if(sort) {
            const sortBy = buildSortFilter(sort);
            this.query = this.query.sort(sortBy);
        } else {
            // this.query = this.query.sort('-createdAt')
            this.query = this.query.sort('-name')
        }

        return this;
    }

    /**
     * 
     * @returns Query that narrows down result to the specified fields of each document (ex. fields=name will only return an array
     * of names and _id)
     */
    limitFields() {
        if(this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            // The minus means "exclude". This takes that variable __v (__v is something mongoose usees internally) out of the results
            this.query = this.query.select('-__v');
        }

        return this;
    }

    /**
     * 
     * @returns Query with subset of the filtered results that are based on location specified (calculated by limit and page fields)
     * ex. if limit=5&page=2, then results 6-10 of the filtered results would be given
     */
    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }

    countTotalResults() {
        this.query = this.query.countDocuments();

        return this;
    }
}

module.exports = APIFeatures;