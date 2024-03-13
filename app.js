const express = require('express');
const cors = require('cors');
const multer = require('multer');

const dotenv = require('dotenv');
dotenv.config();

const {connectToDataBase} = require('./helpers/db');
const authRoutes = require('./routes/auth/routes');
const jobRoutes = require('./routes/job/routes');
const hireRoutes = require('./routes/hire/routes');

const app = express();

app.use(cors());
const upload = multer();
app.use(upload.array());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/job', jobRoutes);
app.use('/hire', hireRoutes);

connectToDataBase().then(()=>{
    try{
        app.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`);
        });
    }
    catch(err){
        console.log(err);
        console.log("SERVER CONNECTION FAILED");
    }
}).catch(err => {
    console.log("DATABASE CONNECTION FAILED");
    console.log(err);
})

