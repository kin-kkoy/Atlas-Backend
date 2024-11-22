require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-para-sa-itirenary';
module.exports = { JWT_SECRET };