import jwt from "jsonwebtoken";

export default async function Auth(req,res,next) {
    try{
      
        
            const token = req.headers.authorization;
            if(!token){
                return res.status(401).json({status:"Unauthorized"});
            }
            try{
                const decodedData = await jwt.verify(token,process.env.jwtsec);
                req.user = decodedData;
                next();
            }catch(err){
                return res.status(400).json({msg:err})
            }
    }
    catch(error){
        console.error("Error in Auth:", error);
        return res.status(500).json({ status: "ERROR" });
    }
}
