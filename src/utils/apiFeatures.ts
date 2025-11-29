import {
    Query,
    FilterQuery,
    Model
} from "mongoose";

export default class APIFeatures<TResult> {
    public query: Query<TResult[], any>;

    public baseFilter: FilterQuery<any>;
    private _filter: FilterQuery<any>;
    private _countPromise: Promise<number> | null;

    /**
     * 
     * 
     * @param {Query} query - A mongoose Query
     */
    constructor(query: Query<TResult[], any>) {
        this.query = query;
        this.baseFilter = {};
        this._filter = {};          // track the filter we apply
        this._countPromise = null;  // store pending count
    }

    /**
     * 
     * @returns Query with the $match filter applied
     */
    addFilters(filter: FilterQuery<any>): this {
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
     * @param {string} sort - A string representing a field to sort by, in ascending order if sort=(insert field here) 
     * or descending if sort=-(insert field here)
     * 
     * @returns Query with values sorted 
     */
    sort(sort: string): this {
        this.query = this.query.sort(sort);

        return this;
    }

    /**
     * 
     * @returns Query that narrows down result to the specified fields of each document (ex. fields=name will only return an array
     * of names and _id)
     */
    limitFields(project: string): this {
        if(project) {
            this.query = this.query.select(project);
        }

        return this;
    }

    // Start the count using the current filter (no skip/limit)
    startCount(): this {
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
    paginate(page: number, limit: number, skip: number): this {
        this.query = this.query.skip(skip).limit(limit);

        return this;
    }

    countTotalResults(): this {
        const model: Model<any> = this.query.model;
        this._countPromise = model.countDocuments(this._filter).exec();
        return this;
    }

    async exec(): Promise<{ results: TResult[]; total: number }> {
        const docsPromise = this.query.exec() as Promise<TResult[]>;

        const totalPromise =
            this._countPromise ??
            this.query.model.countDocuments(this._filter).exec();

        const [results, total] = await Promise.all([docsPromise, totalPromise]);
        return { results, total };
    }
}