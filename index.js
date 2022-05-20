const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
const res = require('express/lib/response');
const jwt = require('jsonwebtoken');

require('dotenv').config()
// middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) =>{
    res.send('running doctors portal server')
})
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.epbjf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({ message : 'Invalid authorization'})
  }
  const token = authHeader.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
    if (err) {
      return res.status(403).send({ message : 'Forbidden access'})
    }
    req.decoded = decoded;
    next();
  });
}
async function run() {
    try {
      await client.connect();
       const servicesCollection = client.db("doctors_portal").collection("services")
       const bookingCollection = client.db("doctors_portal").collection("bookings")
       const userCollection = client.db("doctors_portal").collection("users")

     app.get("/service" , async (req, res) => {
        const query ={}
        const cursor = servicesCollection.find(query);
        const services = await cursor.toArray();
        res.send(services);
     })
      // get all user
     app.get('/user' , verifyJWT, async (req, res) => {
       const user = await userCollection.find().toArray();
       res.send(user);
     })
     // admin role
     
     app.put('/user/admin/:email', async (req, res) => {
      const email = req.params.email;
      const filter ={email: email};
      const updateDoc = {
       $set: {role: 'admin'}
     };
     const result = await userCollection.updateOne(filter, updateDoc);
     res.send(result);
    })
  

     app.put('/user/:email', async (req, res) => {
       const email = req.params.email;
       const user = req.body;
       const filter ={email: email};
       const options = { upsert: true };
       const updateDoc = {
        $set: user
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({email : email} , process.env.ACCESS_TOKEN_SECRET , { expiresIn: '1h' })
      res.send({result , token});
     })
    app.get('/available' , async(req, res) => {
      const date = req.query.date || "May 19, 2022"
      //step-1  get all services
      const services = await servicesCollection.find().toArray()
      // step-2 get the booking of the day
      const query = {date : date};
      const bookings = await bookingCollection.find(query).toArray();
     // step 3: for each service
     services.forEach(service=>{
      // step 4: find bookings for that service. output: [{}, {}, {}, {}]
      const serviceBookings = bookings.filter(book => book.treatment === service.name);
      // step 5: select slots for the service Bookings: ['', '', '', '']
      const bookedSlots = serviceBookings.map(book => book.slot);
      // step 6: select those slots that are not in bookedSlots
      const available = service.slots.filter(slot => !bookedSlots.includes(slot));
      //step 7: set available to slots to make it easier 
      service.slots = available;
    });
      res.send(services)
    })

    app.get('/booking' , verifyJWT ,  async (req, res) => {
      const patient = req.query.patient;
      const decodedEmail = req.decoded.email;
      if(decodedEmail === patient){
        const query = {patient: patient};
        const bookings = await bookingCollection.find(query).toArray();
       return res.send(bookings);
      }else{
        return res.status(403).send({message: 'Forbidden access'})
      }
      
    })

     app.post("/booking", async(req, res) => {
       const booking = req.body;
       const query = {treatment: booking.treatment , patient: booking.patient, date: booking.date}
       const exists = await bookingCollection.findOne(query);
       if(exists){
         return res.send({success : false ,booking : exists});
       }
       const result = await bookingCollection.insertOne(booking);
       res.send({success : true, result});

     })
    } finally {
     
    }
  }
  run().catch(console.dir);


app.listen(port, () => {
    console.log('doctors portal server listening');
})