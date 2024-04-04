import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {S3Client, PutObjectCommand,DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

import UserSchema from "../model/user.model.js";
import  FolderModel  from '../model/structur.model.js';


const s3Client = new S3Client({
  endpoint: "https://blr1.digitaloceanspaces.com",
  forcePathStyle: false,
  region: "blr1",
  credentials: {
    accessKeyId: process.env.digitalocenaccesskey,
    secretAccessKey: process.env.digitalocenseckey,
  },
});

const getPublicDownloadUrl = async (bucket, key) => {
  const params = {
    Bucket: bucket,
    Key: key,
    Expires: 31536000,
  };
  const url =`https://${bucket}.blr1.digitaloceanspaces.com/${key}`;
console.log(url)
   return url
};


export async function getPublicDownloadUrl2(req,res){
  const {bucket,key} = req.body
  const data = getPublicDownloadUrl(bucket,key);
  console.log("data is ",data)
}



export async function uploadObject(req, res) { 
  const files = Array.isArray(req.files) ? req.files : [req.files];
  const { userid, filename, size } = req.body;
  console.log(req.body)

  if(userid  == null || filename == null){
      console.error("Error in sending data");
      return res.status(400).send(`Please provide all the required fields.`);}

  console.log("user id is", userid);

  if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
  }

  try {
      const user = await UserSchema.findById(userid);  
      console.log("user is", user);
    

      if (!user) {
          res.status(404).send("User not found");
          return;
      }
      if(user.fu > 10){
        return res.send("cant upload limit reached")
      }
  } catch (error) {
      console.log("error fetching User from db:", error);
      return res.status(500).send("Internal Server Error");
  }

  try {
      const uploadedFiles = [];
      for (const file of files) {
          const sizemb = parseFloat((size / (1024 * 1024)).toFixed(4));
          const params = {
              Bucket: "userstograge",
              Key: `${userid}/${filename}`, 
              Body: file.data, 
              ACL: 'public-read', 
          };
          try {
              const data = await s3Client.send(new PutObjectCommand(params));
              console.log("Successfully uploaded object:", params.Bucket + "/" + params.Key);
          
              await UserSchema.findByIdAndUpdate({_id : userid}, { $inc: { fu: 1 } });
              
              const publicDownloadUrl = await getPublicDownloadUrl(params.Bucket, params.Key);
              uploadedFiles.push({ filename, downloadlink: publicDownloadUrl, size: `${sizemb} MB` });

              try {
                  const folderRecord = await FolderModel.findOne({ owner: userid });
                  if (folderRecord) {
                      folderRecord.files = folderRecord.files || [];
                      folderRecord.files.push({ filename, publicDownloadUrl, size: sizemb });
                      await folderRecord.save();
                  } else {
                      const newFolderRecord = new FolderModel({
                          owner: userid,
                          files: [{ filename, publicDownloadUrl, size: sizemb }],
                      });
                      await newFolderRecord.save();
                  }
              } catch (e) {
                  if (e.code === 11000) {
                      console.log("Duplicate key error:", e);
                      return res.status(409).json(`File with name ${filename} already exists.`);
                  } else {
                      console.log("Error:", e);
                  }
              }
          } catch (err) {
              console.error("Error uploading file:", err);
              return res.status(500).send("Internal Server Error");
          }
      }
      return res.json(uploadedFiles);
  } catch (err) {
      console.error("Error in uploadObject function:", err);
      return res.status(500).send("Internal Server Error");
  }
}


const listUserFiles = async (bucket, userId) => {
  try {
    const listObjectsCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: `${userId}/`,
    });
    const listObjectsResponse = await s3Client.send(listObjectsCommand);

    let filesList = listObjectsResponse.Contents;
    if (!filesList) {
      return "no file";
    }

    const files = listObjectsResponse.Contents.length > 0
      ? listObjectsResponse.Contents.map((object) => {
        console.log(object,"is object");
          const fileName = object.Key ? object.Key.split('/')[1] : 'Unknown';
          return {
            fileName,
            lastModified: object.LastModified,
          };
        })
      : [];

    return files;
  } catch (err) {
    console.error("Error listing objects:", err);
    throw err;
  }
};


export async function getUserFiles(req, res) {
  const { id } = req.body;
  console.log(id);
  if (!id) 
  {return res.status(402).send("Can't find id")}

  try {
    let user
    try{
    user = await UserSchema.findById(id);
    console.log("user is", user)
    }catch(e){ 
      console.log('no such user')
      return res.status(400).send("data manipulated??") 
    }
    const files = await listUserFiles("userstograge", id);
    console.log(files)
    if (!files || files === "no file") {
      return res.status(204).send("No Files Found!");
    }
    return res.status(200).json({ file: files });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).send("Server error");
  }
}



async function deleteObject(bucket, key) {
  try {
    const deleteObjectCommand = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3Client.send(deleteObjectCommand);

    console.log(`Object deleted successfully: ${bucket}/${key}`);
    return true;
  } catch (error) {
    console.error('Error deleting object:', error);
    throw error;
  }
}


export async function generateTemporaryFileLink(req, res) {
  const { bucket, key } = req.body;
  const expiresIn = 18000; 

  try {
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const signedUrl = await getSignedUrl(
      s3Client,
      getObjectCommand,
      { expiresIn }
    );

    res.json({ temporaryLink: signedUrl });
  } catch (error) {
    console.error('Error generating temporary link:', error);
    res.status(500).json({ message: 'Error generating temporary link' });
  }
}



export async function deletefiles(req,res){
  const { bucket, key,id} = req.body; 
  console.log(bucket + " " + key);
  try {
    try {
      await deleteObject(bucket, key);
      await UserSchema.findOneAndUpdate({ _id: id }, { $inc: { fu: -1 } });
      res.json({ message: 'Object deleted successfully' });
    } catch (err) {
      console.log({ message: 'Error deleting object', err });
    }
  } 
  catch (err) {console.log({ message: 'Error deleting object',err })}}

  
  
  
  
  
  async function calculateFolderSize(bucketName, prefix) {
    let totalSize = 0;
  
    try {
      const listObjectsCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
      });
  
      const listObjectsResponse = await s3Client.send(listObjectsCommand);
  
      if (listObjectsResponse.Contents) {
        for (const object of listObjectsResponse.Contents) {
          if (object.Size) {
            totalSize += object.Size;
          } else {
            const folderSize = await calculateFolderSize(bucketName, object.Key + '/');
            totalSize += folderSize;
          }
        }
      }
    } catch (error) {
      console.error('Error calculating folder size:', error);
      throw error;
    }
  
    return totalSize;
  }
  
  export async function calculateUsedSpace(req, res) {
    const bucketName = 'userstograge';
  
    try {
      const usedSpace = await calculateFolderSize(bucketName, '');
      const usedSpaceInGB = (usedSpace / (1024 * 1024 * 1024)).toFixed(2);
  
      res.json({ usedSpace: `${usedSpaceInGB} GB` });
    } catch (error) {
      console.error('Error calculating used space:', error);
      res.status(500).json({ message: 'Error calculating used space' });
    }
  }


  export async function AdminlistAllFiles(req, res) {
    const bucketName = 'userstograge';
    try {
      const listObjectsCommand = new ListObjectsV2Command({
        Bucket: bucketName,
      });
      const listObjectsResponse = await s3Client.send(listObjectsCommand);
      console.log(JSON.stringify(listObjectsResponse))
      const files = listObjectsResponse.Contents.map((object) => {
        
        const userId = object.Key.split('/')[0];
        const fileName = object.Key.split('/')[1];
        return {
          fileName,
          uploadedBy: userId,
          size: (object.Size / 1024).toFixed(2), 
          lastModified: object.LastModified,
        };
      });
  
      res.json({ files });
    } catch (error) {
      console.error('Error listing files:', error);
      res.status(500).json({ message: 'Error listing files' });
    }
  }