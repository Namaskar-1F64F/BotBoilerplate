import Express from 'express';
import { fromSms } from './gobetween';
const bodyParser = require('body-parser');
const app = Express();

app.use(bodyParser.urlencoded({ extended: false }));
app.post('/sms', (req, res) => {
  console.log(req.body);
  const { Body, From } = req.body;
  fromSms(From, Body);
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end();
});
app.get('')
app.listen(process.env.TWILIO_PORT);