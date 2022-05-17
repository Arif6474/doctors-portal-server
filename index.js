const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
const res = require('express/lib/response');

require('dotenv').config()
// middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) =>{
    res.send('running doctors portal server')
})
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.epbjf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
      await client.connect();
       const servicesCollection = client.db("doctors_portal").collection("services")

     app.get("/service" , async (req, res) => {
        const query ={}
        const cursor = servicesCollection.find(query);
        const services = await cursor.toArray();
        res.send(services);
     })
    } finally {
     
    }
  }
  run().catch(console.dir);


app.listen(port, () => {
    console.log('doctors portal server listening');
})