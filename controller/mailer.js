import nodemailer from 'nodemailer';
import * as ipfetch from 'ip-fetch';
import dotenv from 'dotenv';
dotenv.config();
export async function sendVerification(link,to){
    try{
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.email,
                pass: process.env.password
            }
        });
    
        let mailOptions={
            from : `"Verify Yourself" <${process.env.email}>`,
            to: `${to}`,
            subject: "Verify before login",
            text: `You need to verify yourself by clicking this link  ${link}. Please use this for verification `,
            html : `<h1>You need to verify yourself by clicking this link <br> <i> ${link} </i>.<br>Please use this for verification.</h1>`
        }

        transporter.sendMail(mailOptions, function (err, info) {
            if(err){
                console.log(err);
            }
            else{
                console.log(info);
            }
        });


    } catch (error) {
        console.error(error);
    }
}


export async function sendOtp(link,to){
    try{
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.email,
                pass: process.env.password
            }
        });
    
        let mailOptions={
            from : `"Forgot password?" <${process.env.email}>`,
            to: `${to}`,
            subject: "reset password!",
            text: `Your requested Password reset link is ${link}. Please use this for password reset `,
            html : `<h1>Your requested Password reset link is <br> <i> ${link} </i>.<br> Please use this for password reset.</h1>`
        }

        transporter.sendMail(mailOptions, function (err, info) {
            if(err){
                console.log(err);
            }
            else{
                console.log(info);
            }
        });


    } catch (error) {
        console.error(error);
    }


}



export async function sendactivity(username,ip,to){
    const info = await ipfetch.getLocationNpm('43.241.127.212');
    let city,country,isp,region;
    if(info){
        city=info.city;
        country=info.country;
        region = info.regionName;
        isp =  info.isp;
    }else{
        city='unknown';
        country='unknown';
        region = info.regionName;
        isp = 'unknown';
    }
    console.log(info)
    try{
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.email,
                pass: process.env.password
            }
        });
        let mailOptions = {
            from: `"Activity ALERT!" <${process.env.email}>`,
            to: `${to}`,
            subject: "Login Attempted!",
            html: `<div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <h2 style="color: #333;">Activity ALERT!</h2>
            <p style="font-size: 16px;">Dear ${username},</p>
            <p style="font-size: 16px;">Login Attempted from IP Address: ${ip}.</p><br>
            <p style="font-size: 16px;">Location: ${city}, ${region}, ${country}</p><br>
            <p style="font-size: 16px;">ISP: ${isp}</p><br>
            <p style="font-size: 16px;">Please change your password if it wasn't you.</p>
          </div>`
        };
        transporter.sendMail(mailOptions, function (err, info) {
            if(err){
                console.log(err);
            }
            else{
                console.log(info);
            }
        }
        );


    } catch (error) {
        console.error(error);
    }





}




export async function sendemailfilelink(username,fileName,link,to){

    try{
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.email,
                pass: process.env.password
            }
        });
    
        let mailOptions={
            from : `"File Shared" <${process.env.email}>`,
            to: `${to}`,
            subject: "User shared a file with You",
            text:
            
            + `Hope this message finds you well! We wanted to let you know that ${username} has shared a file with you. `
            + `Please find below the details:\n\n`
            + `File Name: ${fileName}\n`
            + `Shared Link: ${link}\n\n`
            + `Feel free to download the file and let us know if you have any questions.\n\n`
            + `Best Regards,\n`
            + `File Shared Team`,
      }

        transporter.sendMail(mailOptions, function (err, info) {
            if(err){
                console.log(err);
            }
            else{
                console.log(info);
            }
        });


    } catch (error) {console.error(error);}}


    
    export async function Sendadminmail(subject,message,to){

        try{
            
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.email,
                    pass: process.env.password
                }
            });
        
            let mailOptions={
                from : `"Admin Mail" <${process.env.email}>`,
                to: `${to}`,
                subject: subject,
                text:
                 message+ `\n\n`
          }
    
            transporter.sendMail(mailOptions, function (err, info) {
                if(err){
                    console.log(err);
                }
                else{
                    console.log(info);
                }
            });
    
    
        } catch (error) {
            console.error(error);
        }
    }
    
