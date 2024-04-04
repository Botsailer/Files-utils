import express, { json } from 'express';
import router from './router/route.js';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './conn.js';
import compression from 'compression';
import fileUpload from 'express-fileupload'

const app = express();
app.use(cors());
app.use(compression());
app.use(fileUpload({
  useTempFiles : false,
  createParentPath:true,

  limits:{ fileSize: 500 * 1024 * 1024 },
}));

app.use(json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('tiny'));
app.set('view engine', 'ejs');
app.disable('x-powered-by');


app.get('/', (req, res) => {
  res.status(201).json('Its Working');
});

app.use('/api', router);
connectDB().then(() => {
    try{
        app.listen(8000, () => {
          console.log('Server is running on http://localhost:8000');});}
    catch(error){
        console.log(error)
    }
}
).catch((error) => console.log(error));
