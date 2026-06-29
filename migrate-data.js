require('dotenv').config();
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

async function main() {
  const client = new MongoClient(process.env.DATABASE_URL);
  try {
    await client.connect();
    const db = client.db();
    
    // Migrate Receipts into TractorWork and JCBWork
    const receipts = await db.collection('Receipt').find({}).toArray();
    for (const receipt of receipts) {
      if (receipt.tractorWorkId && receipt.pdfUrl) {
        await db.collection('TractorWork').updateOne(
          { _id: receipt.tractorWorkId },
          { $set: { pdfUrl: receipt.pdfUrl } }
        );
        console.log(`Migrated PDF for TractorWork ${receipt.tractorWorkId}`);
      }
      if (receipt.jcbWorkId && receipt.pdfUrl) {
        await db.collection('JCBWork').updateOne(
          { _id: receipt.jcbWorkId },
          { $set: { pdfUrl: receipt.pdfUrl } }
        );
        console.log(`Migrated PDF for JCBWork ${receipt.jcbWorkId}`);
      }
    }

    // Migrate TractorWork operations
    const tractorWorks = await db.collection('TractorWork').find({}).toArray();
    for (const work of tractorWorks) {
      // Check if it already has the old fields
      if (work.workType) {
        const opId = uuidv4();
        
        // Calculate amount for this specific operation
        let amount = 0;
        if (work.pricingMethod === "FIXED_TOTAL") {
          // If fixed total, we can't easily decouple extra charges, but previously fixed total meant base amount.
          amount = work.totalAmount - ((work.driverCharge || 0) + (work.helperCharge || 0) + (work.foodExpense || 0) + (work.otherExpense || 0));
        } else {
          const isTransport = ["SOIL_FILLING", "SAND_TRANSPORT", "BRICK_TRANSPORT", "WATER_TANK_SUPPLY", "TROLLEY_TRANSPORT", "TROLLEY"].includes(work.workType);
          if (isTransport) {
            amount = (work.tripCount || 0) * (work.ratePerTrip || 0);
          } else {
            amount = (work.area || 0) * (work.ratePerArea || 0);
          }
        }

        const operation = {
          _id: opId,
          tractorWorkId: work._id,
          workType: work.workType,
          area: work.area,
          ratePerArea: work.ratePerArea,
          landUnit: work.landUnit || "Bigha",
          numberOfPasses: work.numberOfPasses,
          pricingMethod: work.pricingMethod || "RATE_PER_UNIT",
          tripCount: work.tripCount,
          ratePerTrip: work.ratePerTrip,
          amount: amount,
          createdAt: work.createdAt || new Date(),
          updatedAt: work.updatedAt || new Date()
        };

        // Insert into TractorOperation
        await db.collection('TractorOperation').insertOne(operation);
        console.log(`Created TractorOperation for Work ${work._id}`);

        // Remove old fields from TractorWork
        await db.collection('TractorWork').updateOne(
          { _id: work._id },
          {
            $unset: {
              workType: "",
              area: "",
              ratePerArea: "",
              landUnit: "",
              numberOfPasses: "",
              pricingMethod: "",
              tripCount: "",
              ratePerTrip: ""
            }
          }
        );
      }
    }
    
    // Drop Receipt collection completely since we moved pdfUrls
    try {
      await db.collection('Receipt').drop();
      console.log("Dropped Receipt collection");
    } catch(e) {
      console.log("Receipt collection might not exist or couldn't drop:", e.message);
    }

    console.log("Migration complete!");
  } finally {
    await client.close();
  }
}
main().catch(console.error);
