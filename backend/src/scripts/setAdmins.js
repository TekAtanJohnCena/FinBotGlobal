import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = "mongodb+srv://finbot:LuU23uZak9uAPiyU@cluster0.zdjpryt.mongodb.net/finbot?appName=Cluster0";

const userSchema = new mongoose.Schema({
    email: String,
    role: String
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function setAdmins() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const emails = ['ercanemre1108@gmail.com', 'simsekfarukkemal@gmail.com'];

        for (const email of emails) {
            const result = await User.findOneAndUpdate(
                { email: email.toLowerCase() },
                { role: 'admin' },
                { new: true }
            );
            if (result) {
                console.log(`Updated user ${email} to admin role.`);
            } else {
                console.log(`User ${email} not found.`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Error updating admins:', err);
        process.exit(1);
    }
}

setAdmins();
