import mongoose, {Schema} from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const videoSchema = new Schema(
    {
        videoFile: {
            type: String, //cloudinary
            required: true
        },
        thumbnail: {
            type: String, //cloudinary
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        duration: { //cloudinary
            type: Number,
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    }, {timestamps: true}
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)


/**
NOTES:-

WHAT IS PAGINATION?
Pagination is a technique used in web development and data presentation to break down a large set of data into smaller, manageable chunks or pages. Instead of displaying all data at once, pagination divides it into discrete pages, allowing users to navigate through the content more easily.

The mongoose-aggregate-paginate plugin is an extension for Mongoose, which is an Object Data Modeling (ODM) library for MongoDB and Node.js. This plugin is specifically designed to simplify pagination when using the aggregation framework in MongoDB.

When you perform complex queries using the aggregation pipeline in MongoDB, the results might not be directly paginated in the same way as regular queries. The mongoose-aggregate-paginate plugin addresses this issue by adding a paginate method to the Mongoose aggregate query, making it easy to paginate the results of an aggregation pipeline.
 */