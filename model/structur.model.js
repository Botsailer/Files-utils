import mongoose from "mongoose";
export const FileSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    size: { type: Number, required: true },
    downloadlink: { type: String },
  });
  

  export const FolderSchema = new mongoose.Schema({
    owner: {
      type: String,
      required: true,
      unique: true,
    },
    files: {
      type: [FileSchema],
      default: [], 
    },
  });

  const FolderModel = mongoose.model('Files', FolderSchema); 
  export default FolderModel;

