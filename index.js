const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();

const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k95s6zq.mongodb.net/?retryWrites=true&w=majority`;

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
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const serviceCollections = client.db('carDB').collection('services');
        const bookingCollections = client.db('carDB').collection('bookings');

        const indexKeys = { service: -1, price: -1 };
        const indexOptions = { name: "carService" };
        const result = await bookingCollections.createIndex(indexKeys, indexOptions);
        // console.log(result);

        app.get('/services', async (req, res) => {
            const result = await serviceCollections.find().toArray();
            res.send(result);
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const options = {
                projection: { title: 1, service_id: 1, img: 1, price: 1 }
            }
            const result = await serviceCollections.findOne(query, options);
            res.send(result);
        })

        app.get('/bookings', async (req, res) => {
            // console.log(req.query);
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingCollections.find(query).sort({ entryDate: -1 }).toArray();
            res.send(result);
        })

        app.get('/bookingSearch/:text', async (req, res) => {
            const searchText = req.params.text;
            // console.log(searchText);
            const result = await bookingCollections.find({
                $or: [
                    { service: { $regex: searchText, $options: "i" } },
                    { price: { $regex: searchText, $options: "i" } }
                ]
            }).toArray();
            // console.log(result);
            res.send(result);
        })

        // app.get('/bookingSearch/:text', async (req, res) => {
        //     const searchText = req.params.text;
        //     // console.log(searchText);

        //     let query = {};
        //     if (searchText !== '') {
        //         query = {
        //             $or: [
        //                 { service: { $regex: searchText, $options: "i" } },
        //                 { price: { $regex: searchText, $options: "i" } }
        //             ]
        //         };
        //     }

        //     try {
        //         const result = await bookingCollections.find(query).toArray();
        //         // console.log(result);
        //         res.send(result);
        //     } catch (error) {
        //         console.error(error);
        //         res.status(500).send('Internal Server Error');
        //     }
        // });


        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            booking.entryDate = new Date();
            booking.status = 'Pending';
            const result = await bookingCollections.insertOne(booking);
            res.send(result);
        })

        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const booking = req.body;
            const updateBooking = {
                $set: {
                    status: booking.status
                }
            }
            const result = await bookingCollections.updateOne(filter, updateBooking);
            res.send(result);
        })

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingCollections.deleteOne(query);
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Car Doctor Server Running');
})

app.listen(port, () => {
    console.log(`Car Doctor Server Running Port ${port}`);
})

