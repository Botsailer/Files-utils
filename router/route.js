import { Router } from "express";
import Auth from "../controller/midauth.js";
import FileUploader,{tempfiledownload,checktempfile}  from "../logic/fileuploader.js";

import * as docen from "../uploader/upload.js";
const router = Router();
import * as controller from '../controller/controller.js';
router.route('/sendverificationlink').get(controller.sendverificationlink);//done
router.route('/verifyemail').get(controller.verifyEmailg,Auth,controller.verifyEmail) //done
router.route('/Signup').post(controller.Signup,controller.sendverificationlink); //done
router.route('/Login').post(controller.Login);//done
router.route('/user/:udetail').get(controller.getun)//done
router.route('/updateuser').put(Auth,controller.updateuser) //done
router.route('/sendrestlink').get(controller.sendrestlink)//done
router.route('/resetpassword').get(controller.resetpassword)//done
router.route('/resetpassword').post(controller.resetpasswordp)//done
router.route('/verifytoken').post(controller.verifytoken)//done
router.route("/checkpremium").post(controller.checkpremium)//done
router.route('/fetchallusers').post(controller.fetchallusers) //done
router.route('/removeuser').post(controller.removeuser)//done
router.route('/adminupdateusers').post(controller.adminupdateusers)//done
router.route('/myups/:id').get(controller.myups)//done
router.route('/tempupload').post(FileUploader);//done
router.route('/checktempfile/:filename').get(checktempfile);//done
router.route('/tempfiledownload/:fid').get(tempfiledownload)
router.route('/upgradeplan').post(controller.upgradeplan);
router.route('/uploadtodo').post(docen.uploadObject)//done
router.route('/listdofiles').post(docen.getUserFiles)//done
router.route('/deletedofiles').post(docen.deletefiles)
router.route('/checksizedo').get(docen.calculateUsedSpace)//done
router.route("/adminlistfiles").get(docen.AdminlistAllFiles)//done
router.route('/sendmailfromadmin').post(controller.sendmailfromadmin)//done
router.route('/getsharelink').post(docen.generateTemporaryFileLink)

export default router;