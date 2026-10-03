const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets
app.use(express.static(config.PUBLIC_DIR));

// Serve uploaded user files securely
app.use('/uploads', express.static(config.UPLOAD_DIR));

// Mount REST API
app.use('/api', apiRoutes);

// Catch unknown API requests
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
