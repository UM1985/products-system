require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const invoiceRoutes = require('./routes/invoices');
const productRoutes = require('./routes/products');

const app = express();

app.use(express.json());
const allowedOrigins = [
	
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.includes("vercel.app")
      ) {
        callback(null, true);
      } else {
        callback(null, false); // ✅ fixed
      }
    },
    credentials: true
  })
);

app.options("*", cors());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 5000;

const mongoUri = process.env.MONGO_URI
connectDB(mongoUri);
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// Ensure JWT secret is available — provide a clear development fallback
if (!process.env.JWT_SECRET) {
	console.warn('\nWARNING: JWT_SECRET is not set. Using an insecure development fallback.\n' +
		'Set JWT_SECRET in your .env before running in production.\n');
	process.env.JWT_SECRET = 'dev_secret_change_me';
}

app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));
