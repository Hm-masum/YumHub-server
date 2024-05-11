const express = require('express');
const cors = require('cors');
require('dotenv').config()
const jwt=require('jsonwebtoken')
const cookieParser=require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express()

const corsOptions={
    origin:['http://localhost:5173'],
    credentials:true,
    optionSuccessStatus:200,
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())

// verify jwt middleware
const verifyToken=(req,res,next)=>{
    const token = req.cookies?.token;
    if(!token){
      return res.status(401).send({message:'unauthorized access'})
    }
    if(token){
      jwt.verify(token.process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
        if(err){
          return res.status(403).send({message:'forbidden access'})
        }
        req.user=decoded;
        next()
      })
    }
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cxuuz57.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try { 

    const foodsCollection=client.db('YumHub').collection('foods')

        // jwt generate
    app.post('/jwt',async(req,res)=>{
        const email=req.body;
        const token=jwt.sign(email,process.env.ACCESS_TOKEN_SECRET,{
            expiresIn:'7d'
        })
        res.cookie('token',token,{
            httpOnly:true,
            secure: process.env.NODE_ENV==='production',
            sameSite: process.env.NODE_ENV==='production' ? 'none' : 'strict'
        }).send({success: true})
    })
      
    app.get('/logout',(req,res)=>{
      res.
      clearCookie('token',{
         httpOnly:true,
         secure: process.env.NODE_ENV==='production',
         sameSite: process.env.NODE_ENV==='production' ? 'none' : 'strict',
         maxAge:0,
      })
       .send({success: true})
   })
      

    app.post('/food',async(req,res)=>{
        const foodData=req.body;
        const result = await foodsCollection.insertOne(foodData)
        res.send(result)
    })

    app.get('/foods',async(req,res)=>{
        const cursor=foodsCollection.find({});
        const result = await cursor.toArray();
        res.send(result)
    })

    app.get('/food/:id',async(req,res)=>{
        const id=req.params.id;
        const query={_id:new ObjectId(id)}
        const result = await foodsCollection.findOne(query)
        res.send(result)
    })






    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('YumHub is cooking')
})

app.listen(port,()=>{
    console.log(`server is running on port , ${port}`)
})
