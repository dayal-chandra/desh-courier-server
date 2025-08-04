const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8xhugn7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollection = client.db("deshDB").collection("users");
    const parcelsCollection = client.db("deshDB").collection("parcels");
    const ridersCollection = client.db("deshDB").collection("riders");

    // user api
    app.post("/users", async (req, res) => {
      const email = req.body.email;
      const usersExists = await usersCollection.findOne({ email });
      if (usersExists) {
        return res
          .status(200)
          .send({ message: "User already exists", inserted: false });
      }
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // parcel api
    app.post("/parcels", async (req, res) => {
      const parcel = req.body;
      const result = await parcelsCollection.insertOne(parcel);
      res.send(result);
    });

    app.get("/parcels", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email)
          return res.status(400).json({ message: "Email is required" });

        const parcels = await parcelsCollection
          .find({ senderEmail: email })
          .toArray();
        res.status(200).json(parcels);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to fetch parcels", error: error.message });
      }
    });

    // Riders api
    app.post("/riders", async (req, res) => {
      try {
        const rider = req.body;
        rider.status = "Pending";
        rider.appliedAt = new Date();

        const result = await ridersCollection.insertOne(rider);
        res.send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).send({ success: false, error: error.message });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Desh Courier is running");
});

app.listen(port, () => {
  console.log(`Desh Courier server is running on port ${port}`);
});
