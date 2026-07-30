import express from 'express';
import 'dotenv/config';
import connectdb from './config/db.js';
import userrouter from './routes/user.routes.js';
import cors from 'cors';
import authrouter from './routes/auth.routes.js';
import cookieParser from 'cookie-parser';
import geminiresponse from './gemini.js';



const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
const port = process.env.PORT || 8000;
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', userrouter);
app.use('/api/user', authrouter);


app.get('/', async (req, res) => {
  try {
    const prompt = req.query.prompt || 'Hello, who are you?';
    const reply = await geminiresponse(prompt);

    res.json({ success: true, prompt, reply });
  } catch (error) {
    console.error('Route Error ❌:', error.message);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

app.post('/api/assistant/chat', async (req, res) => {
  try {
    const prompt = req.body?.prompt?.trim();

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required.' });
    }

    const reply = await geminiresponse(prompt);

    res.json({ success: true, reply });
  } catch (error) {
    console.error('Chat Route Error ❌:', error.message);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});







app.listen(port, () => {
  connectdb();
  console.log(`Server is running on port ${port}`);
});

