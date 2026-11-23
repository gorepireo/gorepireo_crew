import app from './index';
import { initializeFacialRecognitionIndex } from './routes/recognition';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`  WORKCREW BACKEND REST API IS RUNNING  `);
  console.log(`  Port: http://localhost:${PORT}        `);
  console.log(`=========================================`);
  initializeFacialRecognitionIndex();
});
