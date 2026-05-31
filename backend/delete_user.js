import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = "mongodb+srv://princerajmne_db_user:0324Prince@cluster0.d5mziri.mongodb.net/foodDB?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to DB");
    
    // We need to define or import the User model to delete the record.
    // For a quick script, defining a minimal schema works.
    const UserSchema = new mongoose.Schema({ email: String });
    const User = mongoose.models.User || mongoose.model("User", UserSchema);
    
    const result = await User.deleteOne({ email: "kumarigudiyaa3@gmail.com" });
    console.log("Deleted count:", result.deletedCount);
    
    mongoose.disconnect();
  })
  .catch(err => console.log(err));
