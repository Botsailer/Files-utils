import UserSchema from "../model/user.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Sendadminmail, sendOtp, sendVerification, sendactivity } from "./mailer.js";
import PremiumModel from "../model/premiumschema.model.js";
import Stripe from "stripe";


const stripe = new Stripe(process.env.stripe_test);
dotenv.config();

export async function Signup(req, res, next) {
  try {
    const { username, password, email } = req.body;
    var user = new UserSchema({
      username,
      password: password,
      email,
      type: "user",
      fu: 0,
      isVerified: false,
    });
    const existingUser = await UserSchema.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      return res.status(409).send("Email or Username is already in use");
    }
    console.log("User Model:", user);

    user = await user.save();
    console.log("save result:", user);
    res.locals.user = user;
    next();
    return res
      .status(201)
      .send("sucess signing up! check email for verification");
  } catch (error) {
    console.error("Error in Signup:", error);
    if (error.code === 11000) {
      return res.status(408).send("Username or email already exists");
    }
    return res.status(500).send({ error });
  }
}

export async function Login(req, res) {
  const ipadress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  console.log(ipadress);
  const { username, email, password } = req.body;
  console.log("request boady is", req.body);
  if (username || email) {
    try {
      let user;
      if (username) {
        user = await UserSchema.findOne({ username });
        console.log(user);
      } else if (email) {
        user = await UserSchema.findOne({ email });
      }
      if (!user)
        return res.status(401).send("user not found or invalid username");
      if (user.isVerified === false)
        return res
          .status(426)
          .send(
            "Please verify your account first by clicking on the link sent to your registered email"
          );
      console.log(user.password, "=>", password);
      if (user.password !== password)
        return res.status(401).send("invalid password");
      const token = jwt.sign(
        { username: user.username, id: user._id },
        process.env.jwtsec,
        { expiresIn: "72h" }
      );
      sendactivity(user.username, ipadress, user.email);
      res.status(200).send({ msg: "login success", token: token });
    } catch (error) {
      console.log(error);
      return res.status(404).send("Not Found");
    }
  }
}

export async function getun(req, res) {
  const { udetail } = req.params;
  console.log(udetail);
  try {
    if (!udetail) return res.status(501).send({ error: "user detail invalid" });
    let user;
    if(udetail.includes('@') || udetail.includes('.com')) {
      user = await UserSchema.findOne({ email: udetail });
    } else {
      user = await UserSchema.findOne({ username: udetail });
    }
    if (!user) return res.status(501).send({ error: "user not found/null" });

    const { _id, username, email } = user._doc;
    return res.status(201).json({ id: _id, username: username, email: email });
  } catch (error) {
    return res.status(404).send(error);
  }
}

export async function sendverificationlink(req, res) {
  const email = req.query.email;
  console.log(email);
  await UserSchema.findOne({ email })
    .then(async (user) => {
      if (!user) {
        return res.status(401).json({ message: "The user does not exist" });
      }
      const jhatula = await jwt.sign({ id: user._id }, process.env.jwtsec, {
        expiresIn: "30min",
      });
      console.log(jhatula);
      const url = `${req.protocol}://${req.get(
        "host"
      )}/api/verifyemail?token=${jhatula}`;
      await sendVerification(url, email);
      return res.send("mail send");
    })
    .catch((err) => {
      console.log(err);
    });
}

export async function verifyEmailg(req, res, next) {
  const token = req.query.token;

  req.headers.authorization = token;
  if (!token) return res.status(401).json({ message: "No token provided." });
  next();
}

export async function verifyEmail(req, res) {
  const { id } = req.user;
  console.log("user id ", id);
  if (!id) return res.status(401).json({ message: "ID NOT FOUND!" });
  try {
    await UserSchema.findByIdAndUpdate(id, { isVerified: true })
      .then((user) => {
        if (user.nModified === 0) {
          return res.status(409).json({ message: "Nothing changed" });
        } else {
          console.log("User Verified");
          return res
            .status(200)
            .send(
              "<center><img src='https://sendy.colorlib.com/img/email-notifications/subscribed.gif' alt='Subscribed'> <h1> Verification Completed</h1></center>"
            );
        }
      })
      .catch((e) => console.log(e));
  } catch (err) {
    console.log(err);
  }
}

export async function updateuser(req, res) {
  try {
    const { id } = req.user;
    console.log(id);
    if (id) {
      const body = req.body;
      console.log(body);
      UserSchema.updateOne({ _id: id }, body)
        .then((result) => {
          if (result.nModified === 0)
            return res.status(401).send("id invalid or user not found");
          console.log("updateOne result:", result);
          if (result.modifiedCount > 0) return res.status(201).send("updated");
          else return res.status(500).send("result error cant update");
        })
        .catch((error) => {
          console.log(error);
          return res.status(500).send(error);
        });
    } else {
      return res.status(401).send("id invalid or user not found");
    }
  } catch (error) {
    console.log(error);
    return res.status(401).send(error);
  }
}

export async function sendrestlink(req, res) {
  const email = req.query.email;
  console.log(email);
  const userdata = await UserSchema.findOne({ email });
  if (!userdata) return res.status(401).send({ message: "User not found" });
  const user = userdata._id;
  console.log(user);
  if (!user) {
    return res.status(401).send({ message: "User not found" });
  }
  const tokenz = jwt.sign({ id: user._id }, process.env.jwtsec, {
    expiresIn: "30min",
  });
  console.log(tokenz);

  const url = `${req.protocol}://${req.get(
    "host"
  )}/api/resetpassword?tokenz=${tokenz}`;
  sendOtp(url, email);
  return res.status(200).send({ message: "check email!" });
}
export async function resetpassword(req, res) {
  let username;
  const { tokenz } = req.query;
  console.log(tokenz);
  if (!tokenz) return res.status(401).send("Token not found");
  try {
    const user = jwt.verify(tokenz, process.env.jwtsec);
    await UserSchema.findById(user.id)
      .select("username")
      .then((user) => {
        if (!user) {
          return res.status(401).json({ message: "The user does not exist" });
        }
        username = user.username;
      })
      .catch((err) => {
        console.log(err);
      });
    console.log(username, "is the username");
    if (!user) return res.status(401).send("Invalid Token");
    res.render("resetpassword", { username: username, token: tokenz });
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      return res.status(401).send("Verification token has expired.");
    }
    console.log(e);
    return res.status(401).send("Something went wrong!");
  }
}

export async function resetpasswordp(req, res) {
  const { tokenz, np } = req.body;
  console.log(tokenz, np);
  if (!tokenz) return res.status(401).send("Token not found");
  if (!np) return res.status(401).send("New password not found");
  let username;
  try {
    const { id } = jwt.verify(tokenz, process.env.jwtsec);
    if (!id) return res.status(401).send("Invalid Token");
    await UserSchema.findById(id)
      .then((user) => {
        if (!user) return res.status(401).send("User not found");
        username = user.username;
      })
      .catch((error) => {
        console.log(error);
        return res.status(500).send(error);
      });
    await UserSchema.updateOne({ _id: id }, { password: np })
      .then((result) => {
        if (result.nModified === 0)
          return res.status(401).send("id invalid or user not found");
        console.log("updateOne result:", result);
        return res.status(201).send("Password sucessfully updated!");
      })
      .catch((error) => {
        console.log(error);
        return res.status(500).send(error);
      });
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      return res.status(401).send("Verification token has expired.");
    }
    console.log(e);
    return res.status(401).send("Invalid Token");
  }
}

export async function verifytoken(req, res) {
  const token = req.body.token || null;

  if (!token) {
    return null;
  }
  try {
    const decoded = jwt.verify(token, process.env.jwtsec);
    console.log(decoded);
    res.status(201).send(decoded);
  } catch (err) {
    if (
      err instanceof jwt.JsonWebTokenError ||
      err instanceof jwt.NotBeforeError
    ) {
      return res.status(403).send("invalid token");
    }
    console.log(err);
    res.status(401).send(err.message);
  }
}

export async function fetchallusers(req, res) {
  const token = req.body.token;
  if (!token) return res.status(401).send("token not found");
  console.log(token);
  try {
    const decoded = jwt.verify(token, process.env.jwtsec);
    console.log(decoded.id);
    const usertype = await UserSchema.findById(decoded.id).select("type");
    if (!usertype) return res.status(404).json({ error: "User Not Found!" });
    console.log(usertype);
    if (usertype.type !== "admin")
      return res.status(403).send("You don't have permission");
    else {
      const users = await UserSchema.find({ _id: { $ne: decoded.id } }).select(
        "-password"
      );
      res.status(201).json({ data: users });
    }
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError || e instanceof jwt.NotBeforeError) {
      return res.status(403).send("invalid token");
    } else {
      console.log(e);
    }
  }
}

export async function removeuser(req, res) {
  const token = req.body.token;
  if (!token) return res.status(401).send("token not found");

  try {
    const decoded = jwt.verify(token, process.env.jwtsec);

    const usertype = await UserSchema.findById(decoded.id).select("type");
 
    if (usertype.type !== "admin")
      return res.status(403).send("You don't have permission");
    else {
      const users = await UserSchema.findByIdAndDelete(req.body.id);
      if (users) {
        const { password, ...other } = users.toObject();
        return res.status(201).json({ data: other });
      }
    }
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError || e instanceof jwt.NotBeforeError) {
      return res.status(403).send("invalid token");
    } else {
      console.log(e);
    }
  }
}

export async function adminupdateusers(req, res) {
  const token = req.body.token;
  if (!token) return res.status(401).send("token not found");
  const body = req.body.body;
  console.log("booty is",body)
  const id = req.body.userid;
  try {
    const decoded = jwt.verify(token, process.env.jwtsec);
    console.log(decoded.id);
    const usertype = await UserSchema.findById(decoded.id).select("type");
    console.log(usertype);
    if (usertype.type !== "admin")
      return res.status(403).send("You don't have permission");
    else {
      await UserSchema.updateOne({ _id: id }, body)
        .then((result) => {
          if (result.matchedCount > 0) {
            return res.status(201).send("updated");
          }
        })
        .catch((e) => {
          console.log(e);
          return res.json({ message: "error" });
        });
    }
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError || e instanceof jwt.NotBeforeError) {
      return res.status(403).send("invalid token");
    } else {
      console.log(e);
    }
  }
}

export async function myups(req, res) {
  const { id } = req.params;
  if (!id) {
    return res.status(401).send("You arnt loggedin!");
  }
  console.log("in my ups",id);
  const user = await UserSchema.findById(id).select("fu");
  if (!user) return res.status(404).send("user not found in DB");
  console.log(user);
  return res.status(200).send(`${user.fu}`);

}

export async function upgradeplan(req, res) {
  const token = req.body.token;
  if (!token) return res.status(401).send("No Token Provided");
  try {
    const decoded = jwt.verify(token, process.env.jwtsec);
    const { id } = decoded;
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "UpgradePlan",
              },
              unit_amount: 2000,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `http://localhost:3000/paysuc`,
        cancel_url: `http://localhost:3000/payfail`,
      });

      let today = new Date();
      console.log("today is ", today);
      let expirtdate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      console.log(expirtdate);

      const newPremiumUser = new PremiumModel({
        startDate: today,
        endDate: expirtdate,
        previousDBId: id,
      });
      await newPremiumUser.save();
      res.status(201).send(session.url);
      console.log(session.url);
      console.log(session);
    } catch (e) {
      console.log(e);
      return res.status(501).send(e);
    }
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError || e instanceof jwt.NotBeforeError) {
      return res.status(403).send("invalid token");
    }
    console.log(e);
    return res.status(501).send(e);
  }
}

export async function checkpremium(req, res) {
  const { token } = req.body;
  if (!token) return res.send("where is token??");
  try {
    let user = jwt.verify(token, process.env.jwtsec);
    const username = user.username;
    const id = user.id;
    const result = await PremiumModel.findOne({ previousDBId: id });
    console.log(result);
    if (!result) return res.status(403).send("user not premium");
    else {
      return res.status(201).send(result);
    }
  } catch (E) {
    console.log(E);
    return res.send(E);
  }
}



export async function sendmailfromadmin(req,res){
  const {des,to} = req.body;
  console.log(des.subject+"\n"+to);
try{
  Sendadminmail(des.subject,des.mailbody,to).then((data)=>{
    console.log(data)
  }),err=>{console.error(err)}
}
catch(e){
  console.log(e)
}
} 