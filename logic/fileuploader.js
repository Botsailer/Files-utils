import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { sendemailfilelink } from "../controller/mailer.js";
import fs from 'fs';
import cron from 'node-cron';

export default async function FileUploader(req, res) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const referer = req.get('Referer');
    const file = req.files.files;
    const email = req.body.email;
    const username = req.body.username;
   const  {expirtime} =  req.body;
    if (!file) return res.status(403).send("No files were uploaded.");

    const uploadPath = path.join(__dirname, "../", "public", "upload", "temp", file.name);

    file.mv(uploadPath, async function(err) {
        if (err) return res.status(500).send(err);
        const fileUrl = `${referer}DownloadTempFile?filename=${file.name}`;

        if (email) sendemailfilelink(username, file.name, fileUrl, email);

        res.json({
            data: {
                url: fileUrl,
                filesize: file.size.length,
            },
            status: "success"
        });
            const expiresIn   = parseInt(expirtime)-1; 
            console.log(expiresIn , typeof(expiresIn))   
            const deljob = cron.schedule(`0 0/${expiresIn} * * *`, async () => {
            const folderPath = path.join(__dirname, "../", "public", "upload", "temp",file.name);
            try {
                await fs.promises.rm(folderPath, { recursive: true });
                deljob.stop()
            } catch (error) {
                console.error("Error deleting folder:", error);
            }
        }
      );
      deljob.start()
    });
}




export async function checktempfile(req,res){
  const filename = req.params.filename;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename)
  const filePath = path.join(__dirname, "../","public", "upload", "temp", filename);
  if(fs.existsSync(filePath)){
    console.log("it exists")
      return res.status(200).send({url: `http://localhost:8000/api/tempfiledownload/${filename}`});
  }
  else{
    return res.status(404).send('Not Found');
  }

}


export async function tempfiledownload(req,res){
  const filename = req.params.fid;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename)
  const filePath = path.join(__dirname, "../","public", "upload", "temp", filename);
  if(fs.existsSync(filePath)){
   console.log("file is here")
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error('Error downloading file:', err);
          res.status(500).json({ error: 'Internal server error' });
        }
      });
    }
  }
  