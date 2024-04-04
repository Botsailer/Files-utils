import mongoose from "mongoose";

const premiumSchema = new mongoose.Schema({
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    previousDBId: {
        type: String,
        required: true,
        unique: true
    }
});

export default mongoose.model('Premiumusers', premiumSchema);
