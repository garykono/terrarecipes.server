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
        this._filter = {};          // track the filter we apply
        this._countPromise = null;  // store pending count
    }

    /**
     * 
     * @returns Query with the $match filter applied
     */
    addFilters(filter) {
        // Just putting $ in front of these expressions so we can query. We used regular expressions here but they're complicated.
        // Can just write my own logic to do that.
        // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        if (filter && Object.keys(filter).length) {
            this._filter = { ...this._filter, ...filter };
            this.query = this.query.find(filter);
        }

        return this;
    }

    /**
     * 
     * @returns Query with values sorted in ascending order if sort=(insert field here) or descending if sort=-(insert field here)
     */
    sort(sort) {
        this.query = this.query.sort(sort);

        return this;
    }

    /**
     * 
     * @returns Query that narrows down result to the specified fields of each document (ex. fields=name will only return an array
     * of names and _id)
     */
    limitFields(project) {
        if(project) {
            this.query = this.query.select(project);
        }

        return this;
    }

    // Start the count using the current filter (no skip/limit)
  startCount() {
    // Either use the tracked filter...
    const filterOnly = this._filter;

    // ...or derive from the built query (also fine):
    // const filterOnly = this.query.getFilter();

    this._countPromise = this.query.model.countDocuments(filterOnly).exec();
    return this;
  }

    /**
     * 
     * @returns Query with subset of the filtered results that are based on location specified (calculated by limit and page fields)
     * ex. if limit=5&page=2, then results 6-10 of the filtered results would be given
     */
    paginate(page, limit, skip) {
        this.query = this.query.skip(skip).limit(limit);

        return this;
    }

    countTotalResults() {
        this.query = this.query.countDocuments();

        return this;
    }

    // Count docs before actual execution
    async exec() {
        const docsPromise = this.query.lean().exec();
        const totalPromise = this._countPromise ??
        this.query.model.countDocuments(this._filter).exec();

        const [results, total] = await Promise.all([docsPromise, totalPromise]);
        return { results, total };
    }
}

module.exports = APIFeatures;